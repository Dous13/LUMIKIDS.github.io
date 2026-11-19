import { db } from "./database";
import { mathLessons } from "../../data/mathLessons";
import { addToSyncQueue } from "../sync/localQueue";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { awardLessonRewards, getLocalStudent } from "./localStudent";
import { bestAttempt, isAssessmentAttempt } from "../../utils/assessmentAttempt";

// lessonId has TEXT affinity. Native numeric bindings can produce "2.0",
// while cloud keys use "2". Read aliases as one lesson without deleting any
// saved rows, and use canonical text IDs for all new inserts.
export interface MathProgress {
  studentId: string;
  lessonId: number;
  unlocked: number;
  completed: number;
  stars: number;
  quizScore: number;
  quizTotal: number;
  xpEarned: number;
  synced: number;
}

function mathProgress(studentId: string, lessonId?: number): MathProgress[] {
  const rows = db.getAllSync<MathProgress>(
    `SELECT studentId, CAST(lessonId AS NUMERIC) AS lessonId, unlocked, completed,
       stars, quizScore, quizTotal, xpEarned, synced FROM math_progress
     WHERE studentId = ? ${lessonId === undefined ? "" : "AND CAST(lessonId AS NUMERIC) = ?"}
     ORDER BY CAST(math_progress.lessonId AS NUMERIC),
       math_progress.lessonId = CAST(CAST(math_progress.lessonId AS NUMERIC) AS TEXT) DESC, math_progress.lessonId`,
    lessonId === undefined ? [studentId] : [studentId, lessonId],
  );
  const grouped = new Map<number, MathProgress>();
  for (const row of rows) {
    if (!mathLessons.some(lesson => lesson.id === row.lessonId)) continue;
    const previous = grouped.get(row.lessonId);
    if (!previous) {
      grouped.set(row.lessonId, row);
      continue;
    }
    const attempt = bestAttempt(previous, row)!;
    grouped.set(row.lessonId, {
      ...previous, quizScore: attempt.quizScore, quizTotal: attempt.quizTotal,
      unlocked: Math.max(previous.unlocked, row.unlocked),
      completed: Math.max(previous.completed, row.completed),
      stars: Math.max(previous.stars, row.stars),
      xpEarned: Math.max(previous.xpEarned, row.xpEarned),
      synced: Math.min(previous.synced, row.synced),
    });
  }
  return [...grouped.values()];
}

export function initializeMathProgress(studentId: string) {
  mathLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT OR IGNORE INTO math_progress
      (
        studentId,
        lessonId,
        unlocked,
        completed,
        stars,
        quizScore,
        quizTotal,
        xpEarned,
        synced
      )
      VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0)
      `,
      [studentId, String(lesson.id), index === 0 ? 1 : 0]
    );
  });

  // Ensure the first lesson is always available.
  if (mathLessons.length > 0) {
    db.runSync(
      `
      UPDATE math_progress
      SET unlocked = 1
      WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?
      `,
      [studentId, mathLessons[0].id]
    );
  }
}

export function getMathProgress(
  studentId: string,
  lessonId: number
): MathProgress | null {
  return mathProgress(studentId, lessonId)[0] ?? null;
}

export function getAllMathProgress(
  studentId: string
): MathProgress[] {
  return mathProgress(studentId);
}

export function isMathLessonUnlocked(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT MAX(unlocked) AS unlocked
    FROM math_progress
    WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?
    `,
    [studentId, lessonId]
  ) as { unlocked: number } | null;

  return result?.unlocked === 1;
}

export function isMathLessonCompleted(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT MAX(completed) AS completed
    FROM math_progress
    WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?
    `,
    [studentId, lessonId]
  ) as { completed: number } | null;

  return result?.completed === 1;
}

export function completeMathLesson(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number,
  stars: number,
  xpEarned: number,
  withinTransaction = false
): boolean {
  if (
    !isAssessmentAttempt({ quizScore, quizTotal }) ||
    !Number.isInteger(stars) ||
    stars < 0 ||
    stars > 3 ||
    !Number.isFinite(xpEarned) ||
    xpEarned < 0
  ) {
    throw new Error("Invalid math lesson completion data.");
  }

  const lessonIndex = mathLessons.findIndex(
    lesson => lesson.id === lessonId
  );

  if (lessonIndex === -1) {
    throw new Error(`Math lesson ${lessonId} does not exist.`);
  }

  // Evaluate the result using the shared rule engine.
  const ruleResult = evaluateQuiz(quizScore, quizTotal);

  // Failed assessments save their score but do not unlock
  // another lesson or mark the current lesson completed.
  if (!ruleResult.passed) {
    saveMathQuizProgress(
      studentId,
      lessonId,
      quizScore,
      quizTotal,
      withinTransaction,
    );

    return false;
  }

  const nextLesson = mathLessons[lessonIndex + 1];
  let completed = false;

  // Update completion and unlock the next lesson atomically.
  const commit = () => {
    if (!getLocalStudent(studentId)) throw new Error("Student not found on this device.");
    initializeMathProgress(studentId);
    const progress = getMathProgress(studentId, lessonId);
    if (progress?.unlocked !== 1) return;
    const attempt = bestAttempt(progress, { quizScore, quizTotal })!;
    const completionResult = db.runSync(
      `
      UPDATE math_progress
      SET
        completed = 1,
        stars = MAX(stars, ?),
        quizScore = ?,
        quizTotal = ?,
        xpEarned = MAX(xpEarned, ?),
        synced = 0
      WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?
      `,
      [
        stars,
        attempt.quizScore,
        attempt.quizTotal,
        xpEarned,
        studentId,
        lessonId,
      ]
    );

    if (completionResult.changes === 0) {
      throw new Error(
        `Progress record missing for lesson ${lessonId}.`
      );
    }

    if (nextLesson) {
      db.runSync(
        `
        INSERT OR IGNORE INTO math_progress
        (
          studentId,
          lessonId,
          unlocked,
          completed,
          stars,
          quizScore,
          quizTotal,
          xpEarned,
          synced
        )
        VALUES (?, ?, 1, 0, 0, 0, 0, 0, 0)
        `,
        [studentId, String(nextLesson.id)]
      );

      db.runSync(
        `
        UPDATE math_progress
        SET unlocked = 1, synced = 0
        WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?
        `,
        [studentId, nextLesson.id]
      );
    }

    // Commit rewards with completion so a failed save can be retried safely.
    if (!progress.completed) {
      awardLessonRewards(studentId, "math", lessonId, xpEarned, ruleResult.stars * 5);
    }
    addToSyncQueue("SYNC_STUDENT", { studentId });
    completed = true;
  };
  if (withinTransaction) commit();
  else db.withTransactionSync(commit);

  return completed;
}

export function unlockNextMathLesson(
  studentId: string,
  currentLessonId: number
) {
  // Kept for compatibility with existing screens.
  // Unlocking is handled by completeMathLesson().
  console.log(
    `[MathProgress] unlockNextMathLesson() is handled by completeMathLesson(). Current lesson: ${currentLessonId}, student: ${studentId}.`
  );
}

export function saveMathQuizProgress(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number,
  withinTransaction = false,
) {
  const attempt = { quizScore, quizTotal };
  if (!isAssessmentAttempt(attempt)) {
    throw new Error("Invalid math quiz progress data.");
  }

  const commit = () => {
    const previous = getMathProgress(studentId, lessonId);
    if (!previous || bestAttempt(previous, attempt) !== attempt) return;
    db.runSync(
      `UPDATE math_progress SET quizScore = ?, quizTotal = ?, synced = 0
       WHERE studentId = ? AND CAST(lessonId AS NUMERIC) = ?`,
      [quizScore, quizTotal, studentId, lessonId],
    );
    addToSyncQueue("SYNC_STUDENT", { studentId });
  };
  if (withinTransaction) commit();
  else db.withTransactionSync(commit);
}

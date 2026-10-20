import { db } from "./database";
import { mathLessons } from "../../data/mathLessons";
import { addToSyncQueue } from "../sync/localQueue";
import { evaluateQuiz } from "../../utils/ruleEngine";

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
      [studentId, lesson.id, index === 0 ? 1 : 0]
    );
  });

  // Ensure the first lesson is always available.
  if (mathLessons.length > 0) {
    db.runSync(
      `
      UPDATE math_progress
      SET unlocked = 1
      WHERE studentId = ? AND lessonId = ?
      `,
      [studentId, mathLessons[0].id]
    );
  }
}

export function getMathProgress(
  studentId: string,
  lessonId: number
): MathProgress | null {
  return db.getFirstSync(
    `
    SELECT *
    FROM math_progress
    WHERE studentId = ? AND lessonId = ?
    `,
    [studentId, lessonId]
  ) as MathProgress | null;
}

export function getAllMathProgress(
  studentId: string
): MathProgress[] {
  return db.getAllSync(
    `
    SELECT *
    FROM math_progress
    WHERE studentId = ?
    ORDER BY lessonId ASC
    `,
    [studentId]
  ) as MathProgress[];
}

export function isMathLessonUnlocked(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT unlocked
    FROM math_progress
    WHERE studentId = ? AND lessonId = ?
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
    SELECT completed
    FROM math_progress
    WHERE studentId = ? AND lessonId = ?
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
  xpEarned: number
): boolean {
  if (
    !Number.isFinite(quizScore) ||
    !Number.isFinite(quizTotal) ||
    quizTotal <= 0 ||
    quizScore < 0 ||
    quizScore > quizTotal ||
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
      quizTotal
    );

    return false;
  }

  initializeMathProgress(studentId);

  const nextLesson = mathLessons[lessonIndex + 1];

  // Update completion and unlock the next lesson atomically.
  db.withTransactionSync(() => {
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
      WHERE studentId = ? AND lessonId = ?
      `,
      [
        stars,
        quizScore,
        quizTotal,
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
        [studentId, nextLesson.id]
      );

      db.runSync(
        `
        UPDATE math_progress
        SET unlocked = 1, synced = 0
        WHERE studentId = ? AND lessonId = ?
        `,
        [studentId, nextLesson.id]
      );
    }
  });

  console.log(
    `[MathProgress] Completed lesson ${lessonId}.`
  );

  if (nextLesson) {
    console.log(
      `[MathProgress] Unlocked lesson ${nextLesson.id} - ${nextLesson.title}.`
    );
  } else {
    console.log(
      `[MathProgress] Final math lesson completed.`
    );
  }

  // Queue synchronization only after the database transaction succeeds.
  addToSyncQueue("SYNC_STUDENT", { studentId });

  return true;
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
  quizTotal: number
) {
  if (
    !Number.isFinite(quizScore) ||
    !Number.isFinite(quizTotal) ||
    quizTotal <= 0 ||
    quizScore < 0 ||
    quizScore > quizTotal
  ) {
    throw new Error("Invalid math quiz progress data.");
  }

  db.runSync(
    `
    UPDATE math_progress
    SET quizScore = ?, quizTotal = ?, synced = 0
    WHERE studentId = ? AND lessonId = ?
    `,
    [quizScore, quizTotal, studentId, lessonId]
  );

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

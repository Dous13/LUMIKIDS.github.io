import { db } from "./database";
import { mathLessons } from "../../data/mathLessons";
import { addToSyncQueue } from "../sync/localQueue";

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
  // Make sure every lesson currently defined in mathLessons
  // has a local progress row for this student.
  //
  // INSERT OR IGNORE means existing progress is preserved,
  // while newly added lessons are automatically created.

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
      [
        studentId,
        lesson.id,
        index === 0 ? 1 : 0,
      ]
    );
  });

  // Always make the first lesson available.
  if (mathLessons.length > 0) {
    db.runSync(
      `
      UPDATE math_progress
      SET unlocked = 1
      WHERE studentId = ?
        AND lessonId = ?
      `,
      [
        studentId,
        mathLessons[0].id,
      ]
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
) {
  // 1. Mark current lesson as completed.
  const completionResult = db.runSync(
    `
    UPDATE math_progress
    SET
      completed = 1,
      stars = ?,
      quizScore = ?,
      quizTotal = ?,
      xpEarned = ?,
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

  console.log(
    `[MathProgress] Completed lesson ${lessonId}. ` +
    `Rows changed: ${completionResult.changes}`
  );

  // 2. Find the current lesson.
  const currentIndex = mathLessons.findIndex(
    lesson => lesson.id === lessonId
  );

  if (
    currentIndex === -1 ||
    currentIndex >= mathLessons.length - 1
  ) {
    console.log(
      `[MathProgress] No next lesson for lesson ${lessonId}.`
    );

    addToSyncQueue("SYNC_STUDENT", {
      studentId,
    });

    return;
  }

  // 3. Get the next lesson.
  const nextLesson = mathLessons[currentIndex + 1];

  console.log(
    `[MathProgress] Next lesson: ${nextLesson.id} - ${nextLesson.title}`
  );

  // 4. Make sure the next lesson exists locally.
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
    [
      studentId,
      nextLesson.id,
    ]
  );

  // 5. Explicitly unlock the next lesson.
  const unlockResult = db.runSync(
    `
    UPDATE math_progress
    SET
      unlocked = 1,
      synced = 0
    WHERE studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      nextLesson.id,
    ]
  );

  console.log(
    `[MathProgress] Unlocked lesson ${nextLesson.id}. ` +
    `Rows changed: ${unlockResult.changes}`
  );

  // 6. Verify the actual SQLite value.
  const verification = db.getFirstSync(
    `
    SELECT
      lessonId,
      unlocked,
      completed
    FROM math_progress
    WHERE studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      nextLesson.id,
    ]
  ) as {
    lessonId: number;
    unlocked: number;
    completed: number;
  } | null;

  console.log(
    "[MathProgress] Unlock verification:",
    verification
  );

  // 7. Queue Firebase synchronization.
  addToSyncQueue("SYNC_STUDENT", {
    studentId,
  });
}

export function unlockNextMathLesson(
  studentId: string,
  currentLessonId: number
) {
  // Kept for compatibility with existing screens.
  // The actual unlock now happens inside completeMathLesson().
  console.log(
    `unlockNextMathLesson() is handled by completeMathLesson().`
  );
}

export function saveMathQuizProgress(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number
) {
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

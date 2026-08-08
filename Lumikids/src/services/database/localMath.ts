import { db } from "./database";
import { mathLessons } from "../../data/mathLessons";

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

/**
 * Initialize Math progress for a student.
 *
 * The first Math lesson is unlocked automatically.
 * All remaining lessons start locked.
 */
export function initializeMathProgress(studentId: string) {
  const existing = db.getFirstSync(
    `
    SELECT COUNT(*) AS total
    FROM math_progress
    WHERE studentId = ?
    `,
    [studentId]
  ) as { total: number };

  if (existing.total > 0) {
    return;
  }

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
}

/**
 * Get one Math lesson's progress.
 */
export function getMathProgress(
  studentId: string,
  lessonId: number
): MathProgress | null {
  const result = db.getFirstSync(
    `
    SELECT
      studentId,
      lessonId,
      unlocked,
      completed,
      stars,
      quizScore,
      quizTotal,
      xpEarned,
      synced
    FROM math_progress
    WHERE studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      lessonId,
    ]
  ) as MathProgress | null;

  return result;
}

/**
 * Get every Math lesson's progress.
 */
export function getAllMathProgress(
  studentId: string
): MathProgress[] {
  return db.getAllSync(
    `
    SELECT
      studentId,
      lessonId,
      unlocked,
      completed,
      stars,
      quizScore,
      quizTotal,
      xpEarned,
      synced
    FROM math_progress
    WHERE studentId = ?
    ORDER BY lessonId ASC
    `,
    [studentId]
  ) as MathProgress[];
}

/**
 * Check whether a Math lesson is unlocked.
 */
export function isMathLessonUnlocked(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT unlocked
    FROM math_progress
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      lessonId,
    ]
  ) as { unlocked: number } | null;

  return result?.unlocked === 1;
}

/**
 * Check whether a Math lesson is completed.
 */
export function isMathLessonCompleted(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT completed
    FROM math_progress
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      lessonId,
    ]
  ) as { completed: number } | null;

  return result?.completed === 1;
}

/**
 * Mark a Math lesson as completed.
 *
 * The quiz score, stars, and XP earned are stored locally.
 */
export function completeMathLesson(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number,
  stars: number,
  xpEarned: number
) {
  db.runSync(
    `
    UPDATE math_progress
    SET
      completed = 1,
      stars = ?,
      quizScore = ?,
      quizTotal = ?,
      xpEarned = ?,
      synced = 0
    WHERE
      studentId = ?
      AND lessonId = ?
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
}

/**
 * Unlock the next Math lesson.
 *
 * Lessons are unlocked sequentially:
 *
 * Counting → Addition → Subtraction → Shapes → Patterns
 */
export function unlockNextMathLesson(
  studentId: string,
  currentLessonId: number
) {
  const currentIndex = mathLessons.findIndex(
    lesson => lesson.id === currentLessonId
  );

  if (
    currentIndex === -1 ||
    currentIndex >= mathLessons.length - 1
  ) {
    return;
  }

  const nextLesson =
    mathLessons[currentIndex + 1];

  db.runSync(
    `
    UPDATE math_progress
    SET
      unlocked = 1,
      synced = 0
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      nextLesson.id,
    ]
  );
}

/**
 * Save a quiz attempt without completing
 * the lesson.
 */
export function saveMathQuizProgress(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number
) {
  db.runSync(
    `
    UPDATE math_progress
    SET
      quizScore = ?,
      quizTotal = ?,
      synced = 0
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      quizScore,
      quizTotal,
      studentId,
      lessonId,
    ]
  );
}
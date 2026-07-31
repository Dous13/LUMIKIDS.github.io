import { db } from "./database";
import { readingLessons } from "../../data/readingLessons";

/**
 * Creates progress records for a student
 * when they login for the first time.
 */
export function initializeStudentProgress(studentId: string) {
  const existing = db.getFirstSync(
    `
    SELECT COUNT(*) AS total
    FROM lesson_progress
    WHERE studentId = ?
    `,
    [studentId]
  ) as { total: number };

  if (existing.total > 0) return;

  readingLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT INTO lesson_progress
      (
        studentId,
        lessonId,
        unlocked,
        completed,
        stars,
        synced
      )
      VALUES (?, ?, ?, 0, 0, 0)
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
 * Returns one lesson's progress
 */
export function getLessonProgress(
  studentId: string,
  lessonId: string
) {
  return db.getFirstSync(
    `
    SELECT *
    FROM lesson_progress
    WHERE studentId = ?
    AND lessonId = ?
    `,
    [studentId, lessonId]
  );
}

/**
 * Returns every lesson progress
 */
export function getAllProgress(studentId: string) {
  return db.getAllSync(
    `
    SELECT *
    FROM lesson_progress
    WHERE studentId = ?
    ORDER BY lessonId
    `,
    [studentId]
  );
}

/**
 * Marks lesson complete
 */
export function completeLesson(
  studentId: string,
  lessonId: string,
  stars: number
) {
  db.runSync(
    `
    UPDATE lesson_progress
    SET
      completed = 1,
      stars = ?,
      synced = 0
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      stars,
      studentId,
      lessonId,
    ]
  );
}

/**
 * Unlock next lesson
 */
export function unlockNextLesson(
  studentId: string,
  currentLessonId: string
) {
  const currentIndex = readingLessons.findIndex(
    lesson => lesson.id === currentLessonId
  );

  if (
    currentIndex === -1 ||
    currentIndex >= readingLessons.length - 1
  ) {
    return;
  }

  const nextLesson =
    readingLessons[currentIndex + 1];

  db.runSync(
    `
    UPDATE lesson_progress
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
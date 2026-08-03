import { db } from "./database";
import { writingLessons } from "../../data/writingLessons";

export function initializeWritingProgress(studentId: string) {
  const existing = db.getFirstSync(
    `
    SELECT COUNT(*) AS total
    FROM writing_progress
    WHERE studentId = ?
    `,
    [studentId]
  ) as { total: number };

  if (existing.total > 0) {
    return;
  }


  writingLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT INTO writing_progress
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

export function getWritingProgress(
  studentId: string,
  lessonId: string
) {
  return db.getFirstSync(
    `
    SELECT *
    FROM writing_progress
    WHERE studentId = ?
    AND lessonId = ?
    `,
    [studentId, lessonId]
  );
}

export function getAllWritingProgress(
  studentId: string
) {
  return db.getAllSync(
    `
    SELECT *
    FROM writing_progress
    WHERE studentId = ?
    ORDER BY lessonId
    `,
    [studentId]
  );
}

export function completeWritingLesson(
  studentId: string,
  lessonId: string,
  stars: number
) {
  db.runSync(
    `
    UPDATE writing_progress
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

export function unlockNextWritingLesson(
  studentId: string,
  currentLessonId: string
) {
  const currentIndex = writingLessons.findIndex(
    lesson => lesson.id === currentLessonId
  );

  if (
    currentIndex === -1 ||
    currentIndex >= writingLessons.length - 1
  ) {
    return;
  }

  const nextLesson =
    writingLessons[currentIndex + 1];

  db.runSync(
    `
    UPDATE writing_progress
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

export function isWritingLessonCompleted(
  studentId: string,
  lessonId: string
): boolean {

  const result = db.getFirstSync(
    `
    SELECT completed
    FROM writing_progress
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
import { db } from "./database";
import { readingLessons } from "../../data/readingLessons";
import { addToSyncQueue } from "../sync/localQueue";

export function initializeStudentProgress(studentId: string) {
  const existing = db.getFirstSync(
    `
    SELECT COUNT(*) AS total
    FROM lesson_progress
    WHERE studentId = ?
    `,
    [studentId]
  ) as { total: number };

  if (existing.total > 0) {
    db.runSync(
      `
      INSERT OR IGNORE INTO owned_mascots (
        studentId,
        mascotId
      )
      VALUES (?, ?)
      `,
      [
        studentId,
        "default",
      ]
    );

    return;
  }

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

db.runSync(
  `
  INSERT OR IGNORE INTO owned_mascots (
    studentId,
    mascotId
  )
  VALUES (?, ?)
  `,
  [
    studentId,
    "default",
  ]
);}

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
  stars: number,
  quizScore = 0,
  quizTotal = 0
) {
  db.runSync(
    `
    UPDATE lesson_progress
    SET
      completed = 1,
      stars = ?,
      quizScore = ?,
      quizTotal = ?,
      synced = 0
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      stars,
      quizScore,
      quizTotal,
      studentId,
      lessonId,
    ]
  );

  addToSyncQueue("SYNC_STUDENT", { studentId });
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

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

export function isLessonCompleted(
  studentId: string,
  lessonId: string
): boolean {

  const result = db.getFirstSync(
    `
    SELECT completed
    FROM lesson_progress
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
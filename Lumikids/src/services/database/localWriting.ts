import { db } from "./database";
import { writingLessons } from "../../data/writingLessons";
import { addToSyncQueue } from "../sync/localQueue";
import { awardLessonRewards, getLocalStudent, stageLearningOperation } from "./localStudent";
import type { LocalLearningOperation } from "../sync/learningOperation";

type WritingProgress = { unlocked: number; completed: number; stars: number; lessonId: string };

export function initializeWritingProgress(studentId: string) {
  writingLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT OR IGNORE INTO writing_progress (
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
        String(lesson.id),
        index === 0 ? 1 : 0,
      ]
    );
  });

  // Ensure the first writing lesson is available
  // without changing the student's existing progress.
  if (writingLessons.length > 0) {
    db.runSync(
      `
      UPDATE writing_progress
      SET unlocked = 1, synced = 0
      WHERE studentId = ?
        AND lessonId = ?
        AND unlocked = 0
      `,
      [studentId, String(writingLessons[0].id)]
    );
  }
}

export function getWritingProgress(
  studentId: string,
  lessonId: string
) {
  return db.getFirstSync<WritingProgress>(
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
  return db.getAllSync<WritingProgress>(
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
  stars: number,
  withinTransaction = false,
  operation?: LocalLearningOperation,
) {
  const index = writingLessons.findIndex(lesson => lesson.id === lessonId);
  if (index < 0 || !Number.isInteger(stars) || stars < 0 || stars > 3) throw new Error("Invalid Writing completion.");
  let rewarded = false;
  const commit = () => {
    if (!getLocalStudent(studentId)) throw new Error("Student not found on this device.");
    initializeWritingProgress(studentId);
    const previous = getWritingProgress(studentId, lessonId);
    if (previous?.unlocked !== 1) throw new Error("This Writing level is locked.");
    db.runSync(
      `UPDATE writing_progress SET completed = 1, stars = MAX(stars, ?), synced = 0
       WHERE studentId = ? AND lessonId = ?`,
      [stars, studentId, lessonId],
    );
    if (!previous.completed) {
      const lesson = writingLessons[index];
      awardLessonRewards(studentId, "writing", lessonId, lesson.xp, lesson.coins, operation);
      rewarded = true;
    } else stageLearningOperation(studentId, operation);
    unlockNextWritingLesson(studentId, lessonId);
    addToSyncQueue("SYNC_STUDENT", { studentId });
  };
  if (withinTransaction) commit();
  else db.withTransactionSync(commit);
  return { rewarded, unlocked: index + 1 < writingLessons.length };
}

function unlockNextWritingLesson(
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

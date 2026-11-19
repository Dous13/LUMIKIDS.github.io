import { db } from "./database";
import { readingLessons } from "../../data/readingLessons";
import { addToSyncQueue } from "../sync/localQueue";
import { bestAttempt, isAssessmentAttempt } from "../../utils/assessmentAttempt";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { awardLessonRewards, getLocalStudent } from "./localStudent";

type ReadingProgress = { unlocked: number; completed: number; stars: number; quizScore: number; quizTotal: number };

export function initializeStudentProgress(studentId: string) {
  readingLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT OR IGNORE INTO lesson_progress (
        studentId,
        lessonId,
        unlocked,
        completed,
        stars,
        quizScore,
        quizTotal,
        synced
      )
      VALUES (?, ?, ?, 0, 0, 0, 0, 0)
      `,
      [
        studentId,
        String(lesson.id),
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
    [studentId, "default"]
  );
}

/**
 * Returns one lesson's progress
 */
export function getLessonProgress(
  studentId: string,
  lessonId: string
) {
  return db.getFirstSync<ReadingProgress>(
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
  return db.getAllSync<ReadingProgress & { lessonId: string }>(
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
export function saveReadingAssessment(
  studentId: string,
  lessonId: string,
  quizScore: number,
  quizTotal: number,
  withinTransaction = false,
) {
  const attempt = { quizScore, quizTotal };
  const index = readingLessons.findIndex(lesson => lesson.id === lessonId);
  if (index < 0 || !isAssessmentAttempt(attempt)) throw new Error("Invalid Reading assessment.");
  const lesson = readingLessons[index];
  const result = evaluateQuiz(quizScore, quizTotal);
  let rewarded = false;
  const commit = () => {
    if (!getLocalStudent(studentId)) throw new Error("Student not found on this device.");
    initializeStudentProgress(studentId);
    const previous = getLessonProgress(studentId, lessonId);
    if (previous?.unlocked !== 1) throw new Error("This Reading level is locked.");
    const best = bestAttempt(previous, attempt)!;
    if (!result.passed && best === previous) return;

    db.runSync(
      `UPDATE lesson_progress SET completed = MAX(completed, ?), stars = MAX(stars, ?),
       quizScore = ?, quizTotal = ?, synced = 0 WHERE studentId = ? AND lessonId = ?`,
      [Number(result.passed), result.stars, best.quizScore, best.quizTotal, studentId, lessonId],
    );
    if (result.passed) {
      if (!previous.completed) {
        awardLessonRewards(studentId, "reading", lessonId, lesson.xp, lesson.coins);
        rewarded = true;
      }
      unlockNextLesson(studentId, lessonId);
    }
    addToSyncQueue("SYNC_STUDENT", { studentId });
  };
  if (withinTransaction) commit();
  else db.withTransactionSync(commit);
  return { ...result, rewarded, unlocked: result.passed && index + 1 < readingLessons.length };
}

/**
 * Unlock next lesson
 */
function unlockNextLesson(
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

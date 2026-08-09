import { db } from "./database";
import { mathLessons } from "../../data/mathLessons";
<<<<<<< HEAD
import { addToSyncQueue } from "../sync/localQueue";
=======
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

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

<<<<<<< HEAD
=======
/**
 * Initialize Math progress for a student.
 *
 * The first Math lesson is unlocked automatically.
 * All remaining lessons start locked.
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function initializeMathProgress(studentId: string) {
  const existing = db.getFirstSync(
    `
    SELECT COUNT(*) AS total
    FROM math_progress
    WHERE studentId = ?
    `,
    [studentId]
  ) as { total: number };

<<<<<<< HEAD
  if (existing.total > 0) return;
=======
  if (existing.total > 0) {
    return;
  }
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

  mathLessons.forEach((lesson, index) => {
    db.runSync(
      `
      INSERT OR IGNORE INTO math_progress
      (
<<<<<<< HEAD
        studentId, lessonId, unlocked, completed,
        stars, quizScore, quizTotal, xpEarned, synced
      )
      VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0)
      `,
      [studentId, lesson.id, index === 0 ? 1 : 0]
=======
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
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
    );
  });
}

<<<<<<< HEAD
=======
/**
 * Get one Math lesson's progress.
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function getMathProgress(
  studentId: string,
  lessonId: number
): MathProgress | null {
<<<<<<< HEAD
  return db.getFirstSync(
    `
    SELECT *
    FROM math_progress
    WHERE studentId = ? AND lessonId = ?
    `,
    [studentId, lessonId]
  ) as MathProgress | null;
}

=======
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
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function getAllMathProgress(
  studentId: string
): MathProgress[] {
  return db.getAllSync(
    `
<<<<<<< HEAD
    SELECT *
=======
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
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
    FROM math_progress
    WHERE studentId = ?
    ORDER BY lessonId ASC
    `,
    [studentId]
  ) as MathProgress[];
}

<<<<<<< HEAD
=======
/**
 * Check whether a Math lesson is unlocked.
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function isMathLessonUnlocked(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT unlocked
    FROM math_progress
<<<<<<< HEAD
    WHERE studentId = ? AND lessonId = ?
    `,
    [studentId, lessonId]
=======
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      lessonId,
    ]
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
  ) as { unlocked: number } | null;

  return result?.unlocked === 1;
}

<<<<<<< HEAD
=======
/**
 * Check whether a Math lesson is completed.
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function isMathLessonCompleted(
  studentId: string,
  lessonId: number
): boolean {
  const result = db.getFirstSync(
    `
    SELECT completed
    FROM math_progress
<<<<<<< HEAD
    WHERE studentId = ? AND lessonId = ?
    `,
    [studentId, lessonId]
=======
    WHERE
      studentId = ?
      AND lessonId = ?
    `,
    [
      studentId,
      lessonId,
    ]
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
  ) as { completed: number } | null;

  return result?.completed === 1;
}

<<<<<<< HEAD
=======
/**
 * Mark a Math lesson as completed.
 *
 * The quiz score, stars, and XP earned are stored locally.
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
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
<<<<<<< HEAD
    WHERE studentId = ? AND lessonId = ?
=======
    WHERE
      studentId = ?
      AND lessonId = ?
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
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
<<<<<<< HEAD

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

=======
}

/**
 * Unlock the next Math lesson.
 *
 * Lessons are unlocked sequentially:
 *
 * Counting → Addition → Subtraction → Shapes → Patterns
 */
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
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

<<<<<<< HEAD
  const nextLesson = mathLessons[currentIndex + 1];
=======
  const nextLesson =
    mathLessons[currentIndex + 1];
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

  db.runSync(
    `
    UPDATE math_progress
<<<<<<< HEAD
    SET unlocked = 1, synced = 0
    WHERE studentId = ? AND lessonId = ?
    `,
    [studentId, nextLesson.id]
  );

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

=======
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
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
export function saveMathQuizProgress(
  studentId: string,
  lessonId: number,
  quizScore: number,
  quizTotal: number
) {
  db.runSync(
    `
    UPDATE math_progress
<<<<<<< HEAD
    SET quizScore = ?, quizTotal = ?, synced = 0
    WHERE studentId = ? AND lessonId = ?
    `,
    [quizScore, quizTotal, studentId, lessonId]
  );

  addToSyncQueue("SYNC_STUDENT", { studentId });
}
=======
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
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

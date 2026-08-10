import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { getLocalStudent } from "../database/localStudent";
import { getAllProgress } from "../database/localProgress";
import { getAllWritingProgress } from "../database/localWriting";
import { getAllMathProgress } from "../database/localMath";
import { db as localDb } from "../database/database";
import { getAllMistakes } from "../database/localMistakes";
import { getOwnedMascots } from "../database/localMascot";

function toReadingProgress(rows: any[]) {
  return Object.fromEntries(
    rows.map((lesson) => [lesson.lessonId, {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars ?? 0,
      quizScore: lesson.quizScore ?? 0,
      quizTotal: lesson.quizTotal ?? 0,
    }])
  );
}

function toWritingProgress(rows: any[]) {
  return Object.fromEntries(
    rows.map((lesson) => [lesson.lessonId, {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars ?? 0,
    }])
  );
}

function toMathProgress(rows: any[]) {
  return Object.fromEntries(
    rows.map((lesson) => [String(lesson.lessonId), {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars ?? 0,
      quizScore: lesson.quizScore ?? 0,
      quizTotal: lesson.quizTotal ?? 0,
      xpEarned: lesson.xpEarned ?? 0,
    }])
  );
}

export async function syncStudent(studentId: string) {
  const student = getLocalStudent(studentId);
  if (!student) return;

  const readingProgress = toReadingProgress(
    getAllProgress(studentId) as any[]
  );
  const writingProgress = toWritingProgress(
    getAllWritingProgress(studentId) as any[]
  );
  const mathProgress = toMathProgress(
    getAllMathProgress(studentId) as any[]
  );

  const mistakes = Object.fromEntries(
    getAllMistakes(studentId).map((mistake) => [
      `${mistake.subject}_${mistake.lessonId}_${mistake.questionKey}`,
      {
        subject: mistake.subject,
        lessonId: mistake.lessonId,
        questionKey: mistake.questionKey,
        question: mistake.question,
        selectedAnswer: mistake.selectedAnswer,
        correctAnswer: mistake.correctAnswer,
        count: mistake.count,
      },
    ])
  );

  const ownedMascots = getOwnedMascots(studentId).map(
    (item) => item.mascotId
  );

  const payload = {
    id: student.id,
    name: student.name,
    classCode: student.classCode,
    xp: student.xp,
    coins: student.coins,
    readingXP: student.readingXP,
    writingXP: student.writingXP,
    mathXP: student.mathXP,
    level: student.level,
    streak: student.streak,
    avatar: student.avatar,
    ownedMascots,
    mistakes,
    readingProgress,
    writingProgress,
    mathProgress,
    updatedAt: serverTimestamp(),
  };

  // Root student document is the source of truth for the student app.
  await setDoc(
    doc(firestore, "students", student.id),
    payload,
    { merge: true }
  );

  // Keep the teacher roster in sync with the same student summary.
  // Teachers read this document to monitor class progress.
  await setDoc(
    doc(firestore, "classes", student.classCode, "students", student.id),
    payload,
    { merge: true }
  );

  // Mark local progress as synchronized only after Firestore succeeds.
  localDb.runSync(`UPDATE lesson_progress SET synced = 1 WHERE studentId = ?`, [student.id]);
  localDb.runSync(`UPDATE writing_progress SET synced = 1 WHERE studentId = ?`, [student.id]);
  localDb.runSync(`UPDATE math_progress SET synced = 1 WHERE studentId = ?`, [student.id]);
  localDb.runSync(`UPDATE mistakes SET synced = 1 WHERE studentId = ?`, [student.id]);
}

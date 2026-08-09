import { doc, updateDoc } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { getLocalStudent } from "../database/localStudent";
import { getAllProgress } from "../database/localProgress";
import { getAllMathProgress } from "../database/localMath";

export async function syncStudent(
  studentId: string
) {
  const student = getLocalStudent(studentId);
  if (!student) return;
  const progress = getAllProgress(studentId) as any[];
  const mathProgress = getAllMathProgress(studentId) as any[];

  const readingProgress: Record<string, any> = {};
  const mathProgressMap: Record<string, any> = {};

  progress.forEach((lesson) => {
    readingProgress[lesson.lessonId] = {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars,
    };
  });

  mathProgress.forEach((lesson) => {
    mathProgressMap[lesson.lessonId] = {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars,
      quizScore: lesson.quizScore ?? 0,
      quizTotal: lesson.quizTotal ?? 0,
      xpEarned: lesson.xpEarned ?? 0,
    };
  });

  const ref = doc(
    firestore,
    "students",
    student.id
  );
  console.log("Reading Progress:", readingProgress);
    await updateDoc(ref, {
        xp: student.xp,
        coins: student.coins,
        readingXP: student.readingXP,
        writingXP: student.writingXP,
        mathXP: student.mathXP,
        level: student.level,
        streak: student.streak,
        avatar: student.avatar,
        readingProgress,
        mathProgress: mathProgressMap,
    });
    console.log("Firestore updated!");
}
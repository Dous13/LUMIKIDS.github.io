import { doc, updateDoc } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { getLocalStudent } from "../database/localStudent";
import { getAllProgress } from "../database/localProgress";

export async function syncStudent(
  studentId: string
) {
  const student = getLocalStudent(studentId);
  if (!student) return;
  const progress = getAllProgress(studentId) as any[];
  const readingProgress: Record<string, any> = {};

  progress.forEach((lesson) => {
    readingProgress[lesson.lessonId] = {
      unlocked: lesson.unlocked === 1,
      completed: lesson.completed === 1,
      stars: lesson.stars,
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
    });
    console.log("Firestore updated!");
}
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Student } from "../../models/Student";
import { db } from "../firebase/firebase";

export async function getStudent(
  studentId: string
): Promise<Student | null> {

  const snapshot = await getDoc(
    doc(db, "students", studentId)
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,

    name: data.name,
    classCode: data.classCode,

    xp: data.xp ?? 0,
    coins: data.coins ?? 0,

    readingXP: data.readingXP ?? 0,
    writingXP: data.writingXP ?? 0,
    mathXP: data.mathXP ?? 0,

    level: data.level ?? 1,
    streak: data.streak ?? 0,

    avatar: data.avatar ?? "default",

    readingProgress: data.readingProgress ?? {},
  };
}

export async function awardReadingXP(
  studentId: string,
  xpEarned: number
) {
  const ref = doc(db, "students", studentId);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const student = snapshot.data();

  await updateDoc(ref, {
    xp: (student.xp || 0) + xpEarned,
    readingXP:
      (student.readingXP || 0) + xpEarned,
  });
}

export async function saveReadingProgress(
  studentId: string,
  lessonId: string,
  stars: number,
  nextLessonId?: string
) {
  const ref = doc(db, "students", studentId);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const student = snapshot.data();

  const progress =
    student.readingProgress || {};

  progress[lessonId] = {
    unlocked: true,
    completed: true,
    stars,
  };

  if (nextLessonId) {
    progress[nextLessonId] = {
      ...(progress[nextLessonId] || {}),
      unlocked: true,
    };
  }

  await updateDoc(ref, {
    readingProgress: progress,
  });
}
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { generateStudentId } from "../auth/auth";

export async function createStudent(
  name: string,
  classCode: string
): Promise<string> {

  // Check if this student already exists
  const q = query(
    collection(db, "students"),
    where("name", "==", name),
    where("classCode", "==", classCode)
  );

  const snapshot = await getDocs(q);

  // Student already exists
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  // Create a new student
  const id = generateStudentId();

  await setDoc(doc(db, "students", id), {
    name,
    classCode,

    xp: 0,
    level: 1,
    streak: 0,

    readingXP: 0,
    writingXP: 0,
    mathXP: 0,

    avatar: "default",

    createdAt: serverTimestamp(),
  });

  return id;
}
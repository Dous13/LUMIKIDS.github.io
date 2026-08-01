import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

import { Student } from "../../types/Student";

export async function createStudent(student: Student) {
  const ref = doc(
    db,
    "classes",
    student.classCode,
    "students",
  );

  await setDoc(ref, student);
}
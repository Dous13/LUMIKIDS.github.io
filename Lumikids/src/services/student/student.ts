import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

import { Student } from "../../types/Student";

export async function createStudent(student: Student) {
  const ref = doc(
    db,
    "classes",
    student.classCode,
    "students",
    student.studentId
  );

  await setDoc(ref, student);
}
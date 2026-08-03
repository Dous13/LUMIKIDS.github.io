import {
    doc,
    updateDoc,
    increment,
} from "firebase/firestore";

import { db } from "./firebase";

export async function updateStudentXP(
    classCode: string,
    studentId: string,
    xp: number
) {
    const ref = doc(
        db,
        "classes",
        classCode,
        "students",
        studentId
    );

    await updateDoc(ref, {
        xp: increment(xp),
        readingXP: increment(xp),
    });
}
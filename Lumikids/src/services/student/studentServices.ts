import {
    doc,
    getDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import { Student } from "../../models/Student";

export async function getStudent(
    id: string
): Promise<Student | null> {

    const ref = doc(
        db,
        "students",
        id
    );

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as Student;

}
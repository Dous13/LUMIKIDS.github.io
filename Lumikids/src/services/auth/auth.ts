import { doc, getDoc } from "firebase/firestore";
import * as Crypto from "expo-crypto";

import { db } from "../firebase/firebase";

/**
 * Checks if a class exists in Firestore.
 */
export async function classExists(classCode: string): Promise<boolean> {
  try {
    const classRef = doc(db, "classes", classCode.toUpperCase());

    const classSnapshot = await getDoc(classRef);

    return classSnapshot.exists();
  } catch (error) {
    console.error("Error checking class:", error);
    return false;
  }
}

/**
 * Generates a unique student ID.
 */
export function generateStudentId(): string {
  return Crypto.randomUUID();
}
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Students are pre-registered by their teacher. This function only looks up
 * the existing account; it does not create a new student from the login screen.
 */
export async function findStudentForLogin(
  preferredName: string,
  classCode: string
): Promise<string | null> {
  const code = classCode.trim().toUpperCase();
  const name = preferredName.trim().toLowerCase();

  const snapshot = await getDocs(
    query(
      collection(db, "classes", code, "students"),
      where("preferredNameLower", "==", name)
    )
  );

  if (!snapshot.empty) return snapshot.docs[0].id;

  // Legacy compatibility for students created before teacher registration.
  const legacy = await getDocs(
    query(
      collection(db, "students"),
      where("classCode", "==", code),
      where("name", "==", preferredName.trim())
    )
  );

  return legacy.empty ? null : legacy.docs[0].id;
}

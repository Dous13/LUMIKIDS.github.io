import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function testFirestore() {
  try {
    const ref = doc(db, "classes", "ABC123");

    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      console.log("✅ Connected to Firestore!");
      console.log(snapshot.data());
    } else {
      console.log("❌ Class not found.");
    }
  } catch (error) {
    console.error("Firestore Error:", error);
  }
}
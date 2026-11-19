import type { Student } from "../../models/Student";
import { getLevel } from "../../utils/xp";
import { addToSyncQueue } from "../sync/localQueue";
import { db } from "./database";

export function getLocalStudent(id: string): Student | null {
  return db.getFirstSync<Student>("SELECT * FROM student WHERE id = ?", [id]);
}

// Called inside the subject completion transaction.
export function awardLessonRewards(
  studentId: string, subject: "reading" | "writing" | "math",
  lessonId: string | number, xp: number, coins: number,
) {
  const student = getLocalStudent(studentId);
  if (!student) throw new Error("Student not found on this device.");
  db.runSync(
    `UPDATE student SET xp = xp + ?, ${subject}XP = ${subject}XP + ?, coins = coins + ?, level = ? WHERE id = ?`,
    [xp, xp, coins, getLevel(student.xp + xp), studentId],
  );
  db.runSync(
    "INSERT INTO student_profile_changes (studentId, subject, lessonId, xp, coins) VALUES (?, ?, ?, ?, ?)",
    [studentId, subject, String(lessonId), xp, coins],
  );
}

export function equipMascot(studentId: string, mascotId: string) {
  db.withTransactionSync(() => {
    if (!getLocalStudent(studentId) || !db.getFirstSync(
      "SELECT 1 FROM owned_mascots WHERE studentId = ? AND mascotId = ?", [studentId, mascotId],
    )) throw new Error("This mascot is not owned by this student.");
    db.runSync("UPDATE student SET avatar = ? WHERE id = ?", [mascotId, studentId]);
    db.runSync("INSERT INTO student_profile_changes (studentId, avatar) VALUES (?, ?)", [studentId, mascotId]);
    addToSyncQueue("SYNC_STUDENT", { studentId });
  });
}

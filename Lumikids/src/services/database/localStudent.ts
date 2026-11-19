import type { Student } from "../../models/Student";
import { getLevel } from "../../utils/xp";
import { addToSyncQueue } from "../sync/localQueue";
import { db } from "./database";
import type { LocalLearningOperation } from "../sync/learningOperation";

export function getLocalStudent(id: string): Student | null {
  return db.getFirstSync<Student>("SELECT * FROM student WHERE id = ?", [id]);
}

// Called inside the subject completion transaction.
export function awardLessonRewards(
  studentId: string, subject: "reading" | "writing" | "math",
  lessonId: string | number, xp: number, coins: number,
  operation?: LocalLearningOperation,
) {
  const student = getLocalStudent(studentId);
  if (!student) throw new Error("Student not found on this device.");
  db.runSync(
    `UPDATE student SET xp = xp + ?, ${subject}XP = ${subject}XP + ?, coins = coins + ?, level = ? WHERE id = ?`,
    [xp, xp, coins, getLevel(student.xp + xp), studentId],
  );
  db.runSync(
    "INSERT INTO student_profile_changes (studentId, subject, lessonId, xp, coins, operation) VALUES (?, ?, ?, ?, ?, ?)",
    [studentId, subject, String(lessonId), xp, coins, operation ? JSON.stringify(operation) : null],
  );
}

export function stageLearningOperation(studentId: string, operation?: LocalLearningOperation) {
  if (operation) db.runSync("INSERT INTO student_profile_changes (studentId, operation) VALUES (?, ?)",
    [studentId, JSON.stringify(operation)]);
}

export function equipMascot(studentId: string, mascotId: string) {
  db.withTransactionSync(() => {
    if (!getLocalStudent(studentId) || !db.getFirstSync(
      "SELECT 1 FROM owned_mascots WHERE studentId = ? AND mascotId = ?", [studentId, mascotId],
    )) throw new Error("This mascot is not owned by this student.");
    db.runSync("UPDATE student SET avatar = ? WHERE id = ?", [mascotId, studentId]);
    db.runSync("INSERT INTO student_profile_changes (studentId, avatar, operation) VALUES (?, ?, ?)",
      [studentId, mascotId, JSON.stringify({ type: "equip", mascotId })]);
    addToSyncQueue("SYNC_STUDENT", { studentId });
  });
}

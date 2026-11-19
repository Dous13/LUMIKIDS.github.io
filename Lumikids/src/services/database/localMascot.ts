import { db } from "./database";
import { addToSyncQueue } from "../sync/localQueue";

export function ownsMascot(
  studentId: string,
  mascotId: string
): boolean {
  const result = db.getFirstSync(
    `
    SELECT *
    FROM owned_mascots
    WHERE studentId = ?
    AND mascotId = ?
    `,
    [studentId, mascotId]
  );

  return !!result;
}

export function buyMascot(
  studentId: string,
  mascotId: string,
  price: number,
) {
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Invalid mascot price.");
  let result: "owned" | "insufficient" | "purchased" = "owned";
  db.withTransactionSync(() => {
    if (ownsMascot(studentId, mascotId)) return;
    const debit = db.runSync("UPDATE student SET coins = coins - ? WHERE id = ? AND coins >= ?", [price, studentId, price]);
    if (!debit.changes) { result = "insufficient"; return; }
    db.runSync("INSERT INTO owned_mascots (studentId, mascotId) VALUES (?, ?)", [studentId, mascotId]);
    db.runSync(
      "INSERT INTO student_profile_changes (studentId, coins, mascotId, operation) VALUES (?, ?, ?, ?)",
      [studentId, -price, mascotId, JSON.stringify({ type: "purchase", mascotId })],
    );
    addToSyncQueue("SYNC_STUDENT", { studentId });
    result = "purchased";
  });
  return result as "owned" | "insufficient" | "purchased";
}

export function getOwnedMascots(studentId: string) {
  return db.getAllSync(
    `
    SELECT mascotId
    FROM owned_mascots
    WHERE studentId = ?
    `,
    [studentId]
  ) as { mascotId: string }[];
}

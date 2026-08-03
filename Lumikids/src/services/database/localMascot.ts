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
  mascotId: string
) {
  db.runSync(
    `
    INSERT INTO owned_mascots
    (
      studentId,
      mascotId
    )
    VALUES (?, ?)
    `,
    [
      studentId,
      mascotId,
    ]
  );

addToSyncQueue(
  "SYNC_STUDENT",
  {
    studentId,
  }
);
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
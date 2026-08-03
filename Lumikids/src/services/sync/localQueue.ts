import { db } from "../database/database";

export function addToSyncQueue(
  action: string,
  payload: any
) {

  // Prevent duplicate student sync jobs
  if (action === "SYNC_STUDENT") {

    const existing = db.getFirstSync(
      `
      SELECT id
      FROM sync_queue
      WHERE action = ?
      AND synced = 0
      LIMIT 1
      `,
      [action]
    );

    if (existing) {
      return;
    }
  }

  db.runSync(
    `
    INSERT INTO sync_queue
    (
    action,
    payload,
    createdAt,
    synced
    )
    VALUES (?, ?, ?, 0)
    `,
    [
    action,
    JSON.stringify(payload),
    Date.now(),
    ]
  );
}

export function getPendingQueue() {
  return db.getAllSync(
    `
    SELECT *
    FROM sync_queue
    WHERE synced = 0
    ORDER BY createdAt ASC
    `
  );
}

export function markQueueSynced(id: number) {
  db.runSync(
    `
    UPDATE sync_queue
    SET synced = 1
    WHERE id = ?
    `,
    [id]
  );
}
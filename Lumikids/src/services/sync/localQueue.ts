import { db } from "../database/database";

export function addToSyncQueue(
  action: string,
  payload: any
) {
  if (action === "SYNC_STUDENT" && payload?.studentId) {
    const pendingJobs = db.getAllSync(
      `
      SELECT payload
      FROM sync_queue
      WHERE action = ?
        AND synced = 0
      `,
      [action]
    ) as Array<{ payload: string }>;

    const alreadyQueued = pendingJobs.some(job => {
      try {
        const existingPayload = JSON.parse(job.payload);
        return existingPayload.studentId === payload.studentId;
      } catch {
        return false;
      }
    });

    // Avoid duplicate jobs for this student only.
    if (alreadyQueued) {
      return;
    }
  }

  db.runSync(
    `
    INSERT INTO sync_queue (
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
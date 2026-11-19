import { db } from "../database/database";

export type QueueJob = { id: number; action: string; payload: string; revision: number };
export type QueuePayload = { studentId: string; instanceId?: string };

export function readQueuePayload(job: QueueJob): QueuePayload | null {
  try {
    const value = JSON.parse(job.payload);
    const validId = (id: unknown) => typeof id === "string" && id.trim().length > 0 && !id.includes("/");
    if (!validId(value?.studentId) || (job.action === "SYNC_WORKSHEET" && !validId(value.instanceId))) return null;
    return { studentId: value.studentId, instanceId: value.instanceId };
  } catch {
    return null;
  }
}

export function getPendingQueue(): QueueJob[] {
  return db.getAllSync<QueueJob>("SELECT id, action, payload, revision FROM sync_queue WHERE synced = 0 ORDER BY id");
}

export function addToSyncQueue(action: string, payload: QueuePayload) {
  const existing = getPendingQueue().find(job => {
    if (job.action !== action) return false;
    const current = readQueuePayload(job);
    return current?.studentId === payload.studentId && current.instanceId === payload.instanceId;
  });
  // A mutation during an upload advances the revision. Only the version that
  // the worker actually attempted can be acknowledged.
  if (existing) {
    db.runSync("UPDATE sync_queue SET revision = revision + 1 WHERE id = ?", [existing.id]);
    return;
  }
  db.runSync(
    "INSERT INTO sync_queue (action, payload, createdAt, synced) VALUES (?, ?, ?, 0)",
    [action, JSON.stringify(payload), Date.now()],
  );
}

export function markQueueSynced(job: QueueJob) {
  db.runSync("UPDATE sync_queue SET synced = 1 WHERE id = ? AND revision = ?", [job.id, job.revision]);
}

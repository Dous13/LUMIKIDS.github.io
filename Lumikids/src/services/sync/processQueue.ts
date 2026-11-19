import { blockQueueJob, getPendingQueue, markQueueSynced, readQueuePayload } from "./localQueue";
import { syncStudent } from "./syncStudent";
import { syncWorksheet } from "./syncWorksheet";

type Scope = (studentId: string, action: string) => boolean;
type WorksheetPublisher = (studentId: string, teacherId: string) => boolean;
let active: Promise<void> | undefined;

export function processQueue(canSync: Scope = () => true, canPublishWorksheet?: WorksheetPublisher): Promise<void> {
  if (!active) active = drainQueue(canSync, canPublishWorksheet).finally(() => { active = undefined; });
  return active;
}

async function drainQueue(canSync: Scope, canPublishWorksheet?: WorksheetPublisher) {
  const queue = getPendingQueue(true);
  // Publish worksheet results first. A failed result holds its dependent
  // student snapshot while unrelated jobs can still be attempted.
  const ordered = [...queue.filter(job => job.action === "SYNC_WORKSHEET"),
    ...queue.filter(job => job.action !== "SYNC_WORKSHEET")];
  for (const job of ordered) {
    const payload = readQueuePayload(job);
    if (!payload || !canSync(payload.studentId, job.action)) continue;
    try {
      if (job.action === "SYNC_WORKSHEET") {
        await syncWorksheet(payload.studentId, payload.instanceId!, canPublishWorksheet);
      } else if (job.action === "SYNC_STUDENT") {
        if (await syncStudent(payload.studentId) === "blocked") {
          blockQueueJob(job);
          continue;
        }
      } else continue;
      markQueueSynced(job);
    } catch (error) {
      console.warn(`[SYNC] Queue job ${job.id} remains pending.`, error);
    }
  }
}

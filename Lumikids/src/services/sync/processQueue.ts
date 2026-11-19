import { getPendingQueue, markQueueSynced, readQueuePayload } from "./localQueue";
import { syncStudent } from "./syncStudent";
import { syncWorksheet } from "./syncWorksheet";

type Scope = (studentId: string) => boolean;
type WorksheetPublisher = (studentId: string, teacherId: string) => boolean;
let active: Promise<void> | undefined;

export function processQueue(canSync: Scope = () => true, canPublishWorksheet?: WorksheetPublisher): Promise<void> {
  if (!active) active = drainQueue(canSync, canPublishWorksheet).finally(() => { active = undefined; });
  return active;
}

async function drainQueue(canSync: Scope, canPublishWorksheet?: WorksheetPublisher) {
  const queue = getPendingQueue();
  // Publish worksheet results first. A failed result holds its dependent
  // student snapshot while unrelated jobs can still be attempted.
  const ordered = [...queue.filter(job => job.action === "SYNC_WORKSHEET"),
    ...queue.filter(job => job.action !== "SYNC_WORKSHEET")];
  for (const job of ordered) {
    const payload = readQueuePayload(job);
    if (!payload || !canSync(payload.studentId)) continue;
    try {
      if (job.action === "SYNC_WORKSHEET") {
        await syncWorksheet(payload.studentId, payload.instanceId!, canPublishWorksheet);
      } else if (job.action === "SYNC_STUDENT") await syncStudent(payload.studentId);
      else continue;
      markQueueSynced(job);
    } catch (error) {
      console.warn(`[SYNC] Queue job ${job.id} remains pending.`, error);
    }
  }
}

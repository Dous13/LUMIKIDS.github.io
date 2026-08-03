import { getPendingQueue, markQueueSynced } from "./localQueue";
import { syncStudent } from "./syncStudent";

export async function processQueue() {
  const queue = getPendingQueue() as any[];

  for (const job of queue) {
    try {
      const payload = JSON.parse(job.payload);

      switch (job.action) {
        case "SYNC_STUDENT":
          await syncStudent(payload.studentId);
          break;

        default:
          console.log("Unknown sync action:", job.action);
      }

      markQueueSynced(job.id);

    } catch (error) {
      console.log("Queue sync failed:", error);
    }
  }
}
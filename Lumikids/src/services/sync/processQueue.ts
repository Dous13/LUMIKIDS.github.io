import { getPendingQueue, markQueueSynced } from "./localQueue";
import { syncStudent } from "./syncStudent";

let isProcessing = false;

export async function processQueue() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
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
            break;
        }

        markQueueSynced(job.id);
      } catch (error) {
        console.log(
          `[SYNC] Queue job ${job.id} failed:`,
          error
        );
      }
    }
  } finally {
    isProcessing = false;
  }
}
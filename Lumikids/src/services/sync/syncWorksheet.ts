import { doc, collection, getDocsFromServer, runTransaction } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { db } from "../database/database";
import { getWorksheetRecord, type WorksheetResult } from "../phygital/worksheetStore";
import { canonicalJson, worksheetIdentityBits } from "../phygital/worksheetLayout";
import type { WorksheetAnalysis } from "../phygital/worksheetAnalyzer";
import { syncStudent } from "./syncStudent";

function validCapture(value: unknown, instanceId: string): value is WorksheetAnalysis {
  if (!value || typeof value !== "object") return false;
  const capture = value as Partial<WorksheetAnalysis>;
  return capture.validated === true && capture.worksheetInstanceId === instanceId &&
    [capture.answers, capture.statuses, capture.confidence].every(list => Array.isArray(list) && list.length === 5);
}

function newerCapture(candidate: WorksheetAnalysis, existing: WorksheetAnalysis) {
  const timestamp = (capture: WorksheetAnalysis) => Date.parse(capture.capturedAt ?? "") || 0;
  const left = timestamp(candidate), right = timestamp(existing);
  return left > right || (left !== 0 && left === right && canonicalJson(candidate) > canonicalJson(existing));
}

export async function syncWorksheet(
  studentId: string, instanceId: string, canPublish?: (studentId: string, teacherId: string) => boolean,
) {
  const record = getWorksheetRecord(studentId, instanceId);
  const ref = doc(firestore, "students", studentId, "worksheetResults", instanceId);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.exists() ? snapshot.data() : undefined;
    if (existing && canonicalJson(existing.worksheet) !== canonicalJson(record.worksheet)) {
      throw new Error("The saved worksheet does not match this cloud copy.");
    }
    if (existing?.finalized) {
      if (record.finalized && canonicalJson(existing.finalized) !== canonicalJson(record.finalized)) {
        throw new Error("This worksheet was finalized differently on another device. Its queued result is preserved locally for review.");
      }
      return;
    }
    if (record.finalized && canPublish && !canPublish(studentId, record.finalized.teacherId)) {
      throw new Error("The reviewing teacher must sign in to publish this worksheet result.");
    }
    const olderCapture = record.capture && validCapture(existing?.capture, instanceId) &&
      newerCapture(existing.capture, record.capture);
    if (record.finalized && olderCapture) {
      throw new Error("A newer photo was saved for this worksheet. Its queued result is preserved locally for review.");
    }
    if (existing && !record.finalized && (!record.capture || olderCapture ||
        canonicalJson(existing.capture ?? null) === canonicalJson(record.capture))) return;
    transaction.set(ref, {
      worksheet: record.worksheet,
      ...(record.capture ? { capture: record.capture } : {}),
      ...(record.finalized ? { finalized: record.finalized } : {}),
    }, { merge: true });
  });
  // A failed progress upload keeps this result's job retryable. The result
  // transaction is idempotent and leaves finalized cloud data immutable.
  if (record.finalized) await syncStudent(studentId);
}

export async function restoreWorksheetHistory(studentId: string) {
  const snapshots = await getDocsFromServer(collection(firestore, "students", studentId, "worksheetResults"));
  db.withTransactionSync(() => {
    for (const snapshot of snapshots.docs) {
      const value = snapshot.data(), worksheet = value.worksheet;
      if (!worksheet || worksheet.studentId !== studentId || worksheet.instanceId !== snapshot.id) continue;
      try { worksheetIdentityBits(worksheet); }
      catch { continue; }

      const local = db.getFirstSync<{ worksheet: string; finalized: string | null; capture: string | null; review: string | null }>(
        "SELECT worksheet, finalized, capture, review FROM worksheet_instances WHERE studentId = ? AND instanceId = ?",
        [studentId, snapshot.id],
      );
      const capture = validCapture(value.capture, snapshot.id) ? value.capture : null;
      const candidate = value.finalized as WorksheetResult | undefined;
      const final = candidate?.studentId === studentId && candidate.instanceId === snapshot.id &&
        candidate.subject === worksheet.subject && candidate.lessonId === worksheet.lessonId &&
        candidate.total === 5 && Number.isInteger(candidate.score) && candidate.score >= 0 && candidate.score <= 5
        ? candidate : null;

      if (!local) {
        db.runSync(
          "INSERT INTO worksheet_instances (studentId, instanceId, worksheet, capture, finalized) VALUES (?, ?, ?, ?, ?)",
          [studentId, snapshot.id, JSON.stringify(worksheet), capture ? JSON.stringify(capture) : null, final ? JSON.stringify(final) : null],
        );
        continue;
      }
      if (local.finalized || canonicalJson(JSON.parse(local.worksheet)) !== canonicalJson(worksheet)) continue;
      if (final) {
        const replaceCapture = capture && (!local.capture || canonicalJson(JSON.parse(local.capture)) !== canonicalJson(capture));
        if (replaceCapture) {
          db.runSync(
            "UPDATE worksheet_instances SET finalized = ?, capture = ?, photoUri = NULL, review = NULL WHERE studentId = ? AND instanceId = ?",
            [JSON.stringify(final), JSON.stringify(capture), studentId, snapshot.id],
          );
        } else {
          db.runSync("UPDATE worksheet_instances SET finalized = ? WHERE studentId = ? AND instanceId = ?",
            [JSON.stringify(final), studentId, snapshot.id]);
        }
      } else if (capture && (!local.capture || (!local.review && newerCapture(capture, JSON.parse(local.capture))))) {
        db.runSync("UPDATE worksheet_instances SET capture = ?, photoUri = NULL WHERE studentId = ? AND instanceId = ?",
          [JSON.stringify(capture), studentId, snapshot.id]);
      }
    }
  });
}

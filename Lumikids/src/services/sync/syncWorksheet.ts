import { collection, getDocsFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db as firestore, functions } from "../firebase/firebase";
import { db } from "../database/database";
import { getWorksheetRecord, type WorksheetResult } from "../phygital/worksheetStore";
import { canonicalJson, worksheetIdentityBits, worksheetTimestamp } from "../phygital/worksheetLayout";
import type { WorksheetAnalysis } from "../phygital/worksheetAnalyzer";
import { invalidateStudentCloudSession } from "../student/studentLogin";
import { savedOperation, settleStudentProgress } from "./syncStudent";
import { readProfile, type CloudStudent } from "./studentProfile";

function decodeCapture(value: unknown, instanceId: string, count: number): WorksheetAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const capture = value as Partial<WorksheetAnalysis>;
  if (capture.validated !== true || capture.worksheetInstanceId !== instanceId ||
      ![capture.answers, capture.statuses, capture.confidence].every(list => Array.isArray(list) && list.length === count)) return null;
  const darkness = Array.isArray(capture.darkness) ? capture.darkness
    : Array.from({ length: count }, (_, index) => capture.darkness?.[index] ?? []);
  return { ...capture, darkness } as WorksheetAnalysis;
}

function newerCapture(candidate: WorksheetAnalysis, existing: WorksheetAnalysis) {
  const now = Date.now();
  const left = worksheetTimestamp(candidate.capturedAt, now) ?? 0;
  const right = worksheetTimestamp(existing.capturedAt, now) ?? 0;
  return left > right || (left !== 0 && left === right && canonicalJson(candidate) > canonicalJson(existing));
}

export async function syncWorksheet(
  studentId: string, instanceId: string, canPublish?: (studentId: string, teacherId: string) => boolean,
) {
  const record = getWorksheetRecord(studentId, instanceId);
  const final = record.finalized;
  const review = final && canPublish?.(studentId, final.teacherId)
    ? { answers: final.answers, writing: final.writing, finalizedAt: final.finalizedAt }
    : null;
  const request = { studentId, worksheet: record.worksheet, capture: record.capture, review };
  const call = httpsCallable<typeof request, { finalized: WorksheetResult | null; profile: CloudStudent }>(functions, "syncWorksheet");
  try {
    const { data } = await call(request);
    if (final) {
      if (!data.finalized || canonicalJson(data.finalized) !== canonicalJson(final)) {
        throw new Error("The reviewing teacher must publish the same worksheet result before sync can finish.");
      }
      const accepted = new Set(readProfile(studentId).changes.filter(change => {
        const operation = savedOperation(change);
        return operation?.type === "worksheet" && operation.instanceId === instanceId;
      }).map(change => change.id));
      settleStudentProgress(studentId, data.profile, accepted);
    }
  } catch (error) {
    await invalidateStudentCloudSession(studentId, error).catch(() => undefined);
    throw error;
  }
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
      const capture = decodeCapture(value.capture, snapshot.id, worksheet.questions.length);
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

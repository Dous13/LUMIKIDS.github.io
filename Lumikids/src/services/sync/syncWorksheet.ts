import { collection, getDocsFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db as firestore, functions } from "../firebase/firebase";
import { db } from "../database/database";
import { getWorksheetRecord, type WorksheetResult, type WorksheetRevision } from "../phygital/worksheetStore";
import { canonicalJson, worksheetCaptureKey, worksheetIdentityBits } from "../phygital/worksheetLayout";
import type { WorksheetAnalysis } from "../phygital/worksheetAnalyzer";
import { invalidateStudentCloudSession } from "../student/studentLogin";
import { savedOperation, settleStudentProgress } from "./syncStudent";
import { readProfile, type CloudStudent } from "./studentProfile";
import { addToSyncQueue } from "./localQueue";

function decodeCapture(value: unknown, instanceId: string, count: number): WorksheetAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const capture = value as Partial<WorksheetAnalysis>;
  if (capture.validated !== true || capture.worksheetInstanceId !== instanceId ||
      ![capture.answers, capture.statuses, capture.confidence].every(list => Array.isArray(list) && list.length === count)) return null;
  const darkness = Array.isArray(capture.darkness) ? capture.darkness
    : Array.from({ length: count }, (_, index) => capture.darkness?.[index] ?? []);
  return { ...capture, darkness } as WorksheetAnalysis;
}

function saveConflict(studentId: string, instanceId: string, result: WorksheetRevision) {
  db.runSync(`UPDATE worksheet_instances SET syncConflict = ?
    WHERE studentId = ? AND instanceId = ? AND captureRevision <= ?`, [
    JSON.stringify(result), studentId, instanceId, result.revision,
  ]);
}

export async function syncWorksheet(
  studentId: string, instanceId: string, canPublish?: (studentId: string, teacherId: string) => boolean,
  inScope = () => true,
) {
  const record = getWorksheetRecord(studentId, instanceId);
  if (record.syncConflict) return "blocked" as const;
  const user = auth?.currentUser;
  const canContinue = () => auth?.currentUser === user && inScope();
  const final = record.finalized;
  const review = final && canPublish?.(studentId, final.teacherId)
    ? { answers: final.answers, writing: final.writing, finalizedAt: final.finalizedAt }
    : null;
  const request = { studentId, worksheet: record.worksheet, capture: record.capture, review: null as typeof review,
    baseRevision: record.captureRevision };
  type Response = WorksheetRevision & { profile: CloudStudent; conflict?: true };
  const call = httpsCallable<typeof request, Response>(functions, "syncWorksheet");

  const readRevision = (data: Response): WorksheetRevision => {
    if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error("Invalid worksheet revision.");
    return { revision: data.revision, finalized: data.finalized,
      capture: decodeCapture(data.capture, instanceId, record.worksheet.questions.length) };
  };
  try {
    if (!canContinue()) throw new Error("The active account changed during synchronization.");
    let { data } = await call(request);
    const latest = readRevision(data);
    const revisionChanged = latest.revision !== record.captureRevision &&
      (record.captureSynced || latest.revision !== record.captureRevision + 1);
    if (data.conflict || (final && data.finalized && canonicalJson(data.finalized) !== canonicalJson(final)) ||
        (review && !data.finalized && revisionChanged)) {
      saveConflict(studentId, instanceId, latest);
      return "blocked" as const;
    }
    if (worksheetCaptureKey(latest.capture) === worksheetCaptureKey(record.capture)) {
      const sameLocal = worksheetCaptureKey(getWorksheetRecord(studentId, instanceId).capture) === worksheetCaptureKey(record.capture);
      db.runSync(`UPDATE worksheet_instances SET captureRevision = ?, captureSynced = ?
        WHERE studentId = ? AND instanceId = ? AND captureRevision = ?`,
      [latest.revision, sameLocal ? 1 : 0, studentId, instanceId, record.captureRevision]);
    }
    if (review && !data.finalized) {
      const current = getWorksheetRecord(studentId, instanceId);
      if (!canContinue() || !canPublish?.(studentId, final!.teacherId) ||
          canonicalJson(current.finalized) !== canonicalJson(final) ||
          worksheetCaptureKey(current.capture) !== worksheetCaptureKey(latest.capture) ||
          worksheetCaptureKey(record.capture) !== worksheetCaptureKey(latest.capture)) {
        throw new Error("The account or worksheet changed before the review could be published.");
      }
      ({ data } = await call({ ...request, review, baseRevision: latest.revision }));
      if (data.conflict) {
        saveConflict(studentId, instanceId, readRevision(data));
        return "blocked" as const;
      }
    }
    if (!final && data.finalized) {
      const current = getWorksheetRecord(studentId, instanceId);
      if (!current.review && !current.finalized && worksheetCaptureKey(current.capture) === worksheetCaptureKey(record.capture)) {
        const canonical = readRevision(data);
        const same = canonicalJson(current.capture) === canonicalJson(canonical.capture);
        db.runSync(`UPDATE worksheet_instances SET capture = ?, captureRevision = ?, captureSynced = 1, finalized = ?,
          photoUri = CASE WHEN ? THEN photoUri ELSE NULL END WHERE studentId = ? AND instanceId = ?`, [
          canonical.capture && JSON.stringify(canonical.capture), canonical.revision, JSON.stringify(canonical.finalized),
          same ? 1 : 0, studentId, instanceId,
        ]);
      } else {
        saveConflict(studentId, instanceId, readRevision(data));
        return "blocked" as const;
      }
    }
    if (final) {
      if (!data.finalized || canonicalJson(data.finalized) !== canonicalJson(final)) {
        throw new Error("The reviewing teacher must publish the same worksheet result before sync can finish.");
      }
      const accepted = new Set(readProfile(studentId).changes.filter(change => {
        const operation = savedOperation(change);
        return operation?.type === "worksheet" && operation.instanceId === instanceId;
      }).map(change => change.id));
      settleStudentProgress(studentId, data.profile, accepted);
      const job = db.getFirstSync(`SELECT 1 FROM sync_queue WHERE action = 'SYNC_STUDENT' AND synced = 0 AND blocked = 1
        AND CASE WHEN json_valid(payload) THEN json_extract(payload, '$.studentId') = ? ELSE 0 END`, [studentId]);
      if (job) addToSyncQueue("SYNC_STUDENT", { studentId });
    }
  } catch (error) {
    if (auth?.currentUser === user) await invalidateStudentCloudSession(studentId, error).catch(() => undefined);
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

      const local = db.getFirstSync<{ worksheet: string; finalized: string | null; capture: string | null; review: string | null;
        photoUri: string | null; captureRevision: number; syncConflict: string | null }>(
        "SELECT * FROM worksheet_instances WHERE studentId = ? AND instanceId = ?", [studentId, snapshot.id],
      );
      const revision = Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision as number : 0;
      const capture = decodeCapture(value.capture, snapshot.id, worksheet.questions.length);
      const candidate = value.finalized as WorksheetResult | undefined;
      const final = candidate?.studentId === studentId && candidate.instanceId === snapshot.id &&
        candidate.subject === worksheet.subject && candidate.lessonId === worksheet.lessonId &&
        candidate.total === 5 && Number.isInteger(candidate.score) && candidate.score >= 0 && candidate.score <= 5
        ? candidate : null;

      if (!local) {
        db.runSync(
          "INSERT INTO worksheet_instances (studentId, instanceId, worksheet, capture, finalized, captureRevision, captureSynced) VALUES (?, ?, ?, ?, ?, ?, 1)",
          [studentId, snapshot.id, JSON.stringify(worksheet), capture ? JSON.stringify(capture) : null, final ? JSON.stringify(final) : null, revision],
        );
        continue;
      }
      if (canonicalJson(JSON.parse(local.worksheet)) !== canonicalJson(worksheet) || revision < local.captureRevision) continue;
      if (local.finalized && (final ? canonicalJson(JSON.parse(local.finalized)) === canonicalJson(final)
        : !local.syncConflict && revision <= local.captureRevision)) continue;
      const previous = local.capture ? JSON.parse(local.capture) as WorksheetAnalysis : null;
      const same = worksheetCaptureKey(capture) === worksheetCaptureKey(previous);
      if (local.syncConflict || local.finalized || (local.review && (!same || revision > local.captureRevision)) || (!final && !same && local.photoUri)) {
        if (capture && (revision > local.captureRevision || final || local.syncConflict)) {
          saveConflict(studentId, snapshot.id, { revision, capture, finalized: final });
        }
        continue;
      }
      if (capture || final) {
        const samePhoto = canonicalJson(capture) === canonicalJson(previous);
        db.runSync(`UPDATE worksheet_instances SET capture = ?, captureRevision = ?, captureSynced = 1, finalized = ?,
          photoUri = CASE WHEN ? THEN photoUri ELSE NULL END WHERE studentId = ? AND instanceId = ?`, [
          capture && JSON.stringify(capture), revision, final && JSON.stringify(final), samePhoto ? 1 : 0, studentId, snapshot.id,
        ]);
      }
    }
  });
}

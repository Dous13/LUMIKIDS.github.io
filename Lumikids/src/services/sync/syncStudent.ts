import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { db } from "../database/database";
import { getAllMistakes } from "../database/localMistakes";
import type { WorksheetResult } from "../phygital/worksheetStore";
import { canonicalJson } from "../phygital/worksheetLayout";
import { getPendingQueue, readQueuePayload } from "./localQueue";
import { applyLocalProgress, mergeProgress, progressTables, readLocalProgress } from "./progressMerge";
import { mergeStudentProfile, profileRevision, readProfile, rememberConfirmedProfile, saveRestoredProfile, type CloudStudent } from "./studentProfile";

const active = new Map<string, Promise<void>>();

export function syncStudent(studentId: string): Promise<void> {
  const pending = active.get(studentId);
  if (pending) return pending;
  const work = uploadStudent(studentId).finally(() => active.delete(studentId));
  active.set(studentId, work);
  return work;
}

async function uploadStudent(studentId: string) {
  const profile = readProfile(studentId);
  const localProgress = readLocalProgress(studentId);
  const studentJobs = () => getPendingQueue().filter(job =>
    job.action === "SYNC_STUDENT" && readQueuePayload(job)?.studentId === studentId);
  const revision = JSON.stringify(studentJobs());
  const results = getPendingQueue().flatMap(job => {
    if (job.action !== "SYNC_WORKSHEET") return [];
    const payload = readQueuePayload(job);
    if (payload?.studentId !== studentId || !payload.instanceId) return [];
    const row = db.getFirstSync<{ finalized: string | null }>(
      "SELECT finalized FROM worksheet_instances WHERE studentId = ? AND instanceId = ?", [studentId, payload.instanceId],
    );
    return row?.finalized ? [JSON.parse(row.finalized) as WorksheetResult] : [];
  });
  const mistakes = Object.fromEntries(getAllMistakes(studentId).map(mistake => [
    `${mistake.subject}_${mistake.lessonId}_${mistake.questionKey}`,
    {
      subject: mistake.subject, lessonId: mistake.lessonId, questionKey: mistake.questionKey,
      question: mistake.question, selectedAnswer: mistake.selectedAnswer, correctAnswer: mistake.correctAnswer,
      count: mistake.count,
    },
  ]));

  const root = doc(firestore, "students", studentId);
  const confirmed = await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(root);
    if (!snapshot.exists()) throw new Error("The cloud student profile does not exist.");
    const cloud = snapshot.data() as CloudStudent & { mistakes?: typeof mistakes };
    for (const result of results) {
      const remote = await transaction.get(doc(firestore, "students", studentId, "worksheetResults", result.instanceId));
      const finalized = remote.exists() ? remote.data().finalized : undefined;
      if (!finalized || canonicalJson(finalized) !== canonicalJson(result)) {
        throw new Error("Worksheet finalization is pending. Student progress will retry after the result is published.");
      }
    }
    const mergedProfile = mergeStudentProfile(studentId, cloud, profile);
    const progress = mergeProgress(cloud, localProgress);
    const previousReceipt = cloud.profileReceipts?.[profile.state.deviceId];
    const oldReceipt = typeof previousReceipt === "number" && Number.isSafeInteger(previousReceipt) ? previousReceipt : 0;
    const receipt = Math.max(oldReceipt, profile.changes[profile.changes.length - 1]?.id ?? 0);
    const mergedMistakes = { ...cloud.mistakes };
    for (const [key, mistake] of Object.entries(mistakes)) {
      if ((mergedMistakes[key]?.count ?? 0) <= mistake.count) mergedMistakes[key] = mistake;
    }

    const summary = { ...progress, ...mergedProfile, mistakes: mergedMistakes, updatedAt: serverTimestamp() };
    // A single commit couples the receipt, root profile, and teacher roster.
    // Keep receipt metadata on the root document only.
    const profileReceipts = { ...cloud.profileReceipts, [profile.state.deviceId]: receipt };
    const revision = Math.max(profileRevision(cloud), profileRevision(profile.confirmed ?? {})) + 1;
    const rootSummary = { ...summary, profileReceipts, profileRevision: revision };
    transaction.set(root, rootSummary, { mergeFields: Object.keys(rootSummary) });
    transaction.set(doc(firestore, "classes", mergedProfile.classCode, "students", studentId), summary,
      { mergeFields: Object.keys(summary) });
    return { ...mergedProfile, ...progress, profileReceipts, profileRevision: revision };
  });

  db.withTransactionSync(() => {
    // Reapply mutations made during the network request to the acknowledged
    // profile. Keep each new mutation and its queue entry for the next pass.
    const current = readProfile(studentId);
    saveRestoredProfile(mergeStudentProfile(studentId, confirmed, current));
    rememberConfirmedProfile(studentId, confirmed, current.confirmed);
    applyLocalProgress(studentId, confirmed);
    db.runSync("UPDATE student_profile_sync SET legacyProfile = NULL WHERE studentId = ?", [studentId]);
    db.runSync("DELETE FROM student_profile_changes WHERE studentId = ? AND id <= ?", [
      studentId, confirmed.profileReceipts[profile.state.deviceId],
    ]);
    if (JSON.stringify(studentJobs()) === revision) {
      for (const table of [...Object.values(progressTables), "mistakes"]) {
        db.runSync(`UPDATE ${table} SET synced = 1 WHERE studentId = ?`, [studentId]);
      }
    }
  });
}

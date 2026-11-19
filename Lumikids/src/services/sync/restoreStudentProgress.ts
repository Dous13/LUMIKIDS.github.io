import { doc, getDocFromServer } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { db } from "../database/database";
import { getLocalStudent } from "../database/localStudent";
import { initializeStudentProgress } from "../database/localProgress";
import { initializeWritingProgress } from "../database/localWriting";
import { initializeMathProgress } from "../database/localMath";
import { addToSyncQueue } from "./localQueue";
import { applyLocalProgress } from "./progressMerge";
import { mergeStudentProfile, profileRevision, readProfile, rememberConfirmedProfile, saveRestoredProfile, type CloudStudent } from "./studentProfile";

export async function fetchStudentProfile(studentId: string): Promise<(CloudStudent & { preferredNameLower?: string }) | null> {
  const snapshot = await getDocFromServer(doc(firestore, "students", studentId));
  return snapshot.data() ?? null;
}

export async function restoreStudentProgress(studentId: string) {
  const profile = await fetchStudentProfile(studentId);
  if (!profile) throw new Error("The student profile does not exist.");
  restoreStudentSnapshot(studentId, profile);
}

export function restoreStudentSnapshot(studentId: string, data: CloudStudent) {
  db.withTransactionSync(() => {
    const previouslySaved = getLocalStudent(studentId);
    const local = previouslySaved ? readProfile(studentId) : undefined;
    const profile = mergeStudentProfile(studentId, data, local);
    saveRestoredProfile(profile);
    rememberConfirmedProfile(studentId, data, local?.confirmed);
    initializeStudentProgress(studentId);
    initializeWritingProgress(studentId);
    initializeMathProgress(studentId);
    const progressAhead = applyLocalProgress(studentId, data);
    const unsyncedMascots = local?.mascots.some(mascot => mascot !== "default" &&
      !(Array.isArray(data.ownedMascots) && data.ownedMascots.includes(mascot)));
    const staleProfile = local?.confirmed && profileRevision(data) <= profileRevision(local.confirmed) &&
      (profileRevision(data) < profileRevision(local.confirmed) || profile.coins !== data.coins || profile.avatar !== data.avatar);
    if (progressAhead || unsyncedMascots || staleProfile || local?.changes.length || local?.state.legacyProfile ||
        (previouslySaved && (profile.xp !== data.xp || profile.readingXP !== data.readingXP ||
          profile.writingXP !== data.writingXP || profile.mathXP !== data.mathXP))) {
      addToSyncQueue("SYNC_STUDENT", { studentId });
    }
  });
}

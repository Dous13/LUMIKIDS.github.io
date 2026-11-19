import { httpsCallable } from "firebase/functions";
import { Buffer } from "buffer";
import { auth, functions } from "../firebase/firebase";
import { db } from "../database/database";
import { invalidateStudentCloudSession } from "../student/studentLogin";
import { type LearningOperation, type LocalLearningOperation } from "./learningOperation";
import { applyLocalProgress, flag, mergeProgress, progressTables, readLocalProgress } from "./progressMerge";
import { hasConfirmedWallet, mergeStudentProfile, profileRevision, readProfile, rememberConfirmedProfile, saveRestoredProfile, type CloudStudent } from "./studentProfile";
import { fetchStudentProfile } from "./restoreStudentProgress";

const active = new Map<string, Promise<"blocked" | void>>();
type Change = ReturnType<typeof readProfile>["changes"][number];
type Upload = { studentId: string; operations: { id: string; operation: LearningOperation }[] };
type Rejection = { id: string; reason: "invalid-operation" | "receipt-conflict" | "dependency" };
type Acknowledgement = { accepted: string[]; supersededEquip?: string[]; rejected?: Rejection[]; profile: CloudStudent };

export function syncStudent(studentId: string, inScope = () => true): Promise<"blocked" | void> {
  const pending = active.get(studentId);
  if (pending) return pending;
  const user = auth?.currentUser;
  const work = uploadStudent(studentId, () => auth?.currentUser === user && inScope()).catch(async error => {
    if (auth?.currentUser === user) await invalidateStudentCloudSession(studentId, error).catch(() => undefined);
    throw error;
  }).finally(() => active.delete(studentId));
  active.set(studentId, work);
  return work;
}

export function savedOperation(change: Change): LocalLearningOperation | undefined {
  if (change.operation) {
    try { return JSON.parse(change.operation) as LocalLearningOperation; }
    catch { return undefined; }
  }
  // Legacy wallet changes still have a verifiable catalogue item. The server
  // supplies the price and checks ownership and balance.
  if (change.mascotId) return { type: "purchase", mascotId: change.mascotId };
  if (change.avatar) return { type: "equip", mascotId: change.avatar };
}

export function settleStudentProgress(studentId: string, cloud: CloudStudent, accepted: Set<number>, rejected = new Map<number, string>()) {
  if (cloud.id !== studentId) throw new Error("The server returned another account's progress.");
  db.withTransactionSync(() => {
    const current = readProfile(studentId);
    const confirmed = new Set(accepted);
    const newestEquip = current.changes.reduce((newest, change) =>
      accepted.has(change.id) && savedOperation(change)?.type === "equip" ? Math.max(newest, change.id) : newest, 0);
    if (current.state.legacyProfile && hasConfirmedWallet(cloud) &&
        (!current.confirmed || profileRevision(cloud) >= profileRevision(current.confirmed))) {
      const legacy = JSON.parse(current.state.legacyProfile) as CloudStudent;
      const outstanding = Object.fromEntries((["xp", "readingXP", "writingXP", "mathXP"] as const)
        .filter(field => (legacy[field] ?? 0) > (cloud[field] ?? 0))
        .map(field => [field, legacy[field]]));
      const baseline = Object.keys(outstanding).length ? JSON.stringify(outstanding) : null;
      db.runSync("UPDATE student_profile_sync SET legacyProfile = ? WHERE studentId = ?", [baseline, studentId]);
      current.state.legacyProfile = baseline;
    }
    const progress = mergeProgress({}, cloud);
    for (const change of current.changes) {
      // An acknowledged newer selection replaces only older, still-pending equipment choices.
      if (!change.syncRejection && !rejected.has(change.id) && change.id < newestEquip && savedOperation(change)?.type === "equip") {
        confirmed.add(change.id);
        continue;
      }
      const rejection = rejected.get(change.id);
      if (rejection) {
        db.runSync("UPDATE student_profile_changes SET syncRejection = ? WHERE studentId = ? AND id = ?", [rejection, studentId, change.id]);
        change.syncRejection = rejection;
      }
      // The server may already have confirmed this pre-upgrade completion
      // through a replay, worksheet review, or trusted historical import.
      if (!change.syncRejection && change.operation === null && change.subject && change.lessonId &&
          flag(progress[change.subject + "Progress" as keyof typeof progress]?.[change.lessonId]?.completed)) {
        confirmed.add(change.id);
      }
    }
    saveRestoredProfile(mergeStudentProfile(studentId, cloud, current, confirmed));
    rememberConfirmedProfile(studentId, cloud, current.confirmed);
    applyLocalProgress(studentId, cloud);
    for (const mistake of Object.values(cloud.mistakes ?? {})) {
      if (!mistake || typeof mistake.subject !== "string" || typeof mistake.lessonId !== "string" ||
          typeof mistake.questionKey !== "string" || !Number.isSafeInteger(mistake.count)) continue;
      db.runSync(`UPDATE mistakes SET synced = 1
        WHERE studentId = ? AND subject = ? AND lessonId = ? AND questionKey = ? AND count <= ?`,
      [studentId, mistake.subject, mistake.lessonId, mistake.questionKey, mistake.count]);
    }
    for (const id of confirmed) db.runSync("DELETE FROM student_profile_changes WHERE studentId = ? AND id = ?", [studentId, id]);
  });
}

async function uploadStudent(studentId: string, inScope: () => boolean) {
  const snapshot = readProfile(studentId);
  let operations: Upload["operations"] = [];
  const maxBytes = 1_400_000;
  let bytes = 2;
  let cloud: CloudStudent | undefined;
  let localRejections = new Map<number, string>();
  const requireScope = () => { if (!inScope()) throw new Error("The active account changed during synchronization."); };
  const flush = async () => {
    requireScope();
    const call = httpsCallable<Upload, Acknowledgement>(functions, "syncStudentLearning");
    const { data } = await call({ studentId, operations });
    const pending = new Map(operations.map(item => [item.id, Number(item.id.split("-")[1])]));
    const take = (id: string) => {
      const row = pending.get(id);
      if (row === undefined) throw new Error("Invalid learning acknowledgement.");
      pending.delete(id);
      return row;
    };
    if (!Array.isArray(data.accepted) || (data.rejected !== undefined && !Array.isArray(data.rejected))) {
      throw new Error("Invalid learning acknowledgement.");
    }
    if (data.supersededEquip !== undefined && (!Array.isArray(data.supersededEquip) ||
        new Set(data.supersededEquip).size !== data.supersededEquip.length ||
        !data.supersededEquip.every(id => data.accepted.includes(id) &&
          operations.some(item => item.id === id && item.operation.type === "equip")))) {
      throw new Error("Invalid superseded equipment acknowledgement.");
    }
    const accepted = new Set(data.accepted.map(take));
    for (const entry of data.rejected ?? []) {
      if (!entry || !["invalid-operation", "receipt-conflict", "dependency"].includes(entry.reason)) {
        throw new Error("Invalid learning acknowledgement.");
      }
      const id = take(entry.id);
      if (entry.reason !== "dependency") localRejections.set(id, entry.reason);
    }
    settleStudentProgress(studentId, data.profile, accepted, localRejections);
    cloud = data.profile;
    operations = [];
    localRejections = new Map();
    bytes = 2;
  };

  // Each snapshot row gets at most one attempt per drain. Dependencies stay
  // in journal order and may be retried after later work reaches the server.
  for (const change of snapshot.changes) {
    if (change.syncRejection) continue;
    const operation = savedOperation(change);
    if (!operation) {
      if (change.operation !== null) localRejections.set(change.id, "invalid-local-operation");
      continue;
    }
    if (operation.type === "worksheet") continue;
    const entry = { id: snapshot.state.deviceId + "-" + change.id, operation };
    const size = Buffer.byteLength(JSON.stringify(entry), "utf8") + 1;
    if (size + 2 > maxBytes) {
      localRejections.set(change.id, "operation-too-large");
      continue;
    }
    if (operations.length >= 24 || bytes + size > maxBytes) await flush();
    operations.push(entry);
    bytes += size;
  }
  if (operations.length) await flush();
  if (!cloud) {
    requireScope();
    const profile = await fetchStudentProfile(studentId);
    if (!profile) throw new Error("The cloud student profile does not exist.");
    cloud = profile;
    settleStudentProgress(studentId, cloud, new Set(), localRejections);
  } else if (localRejections.size) {
    settleStudentProgress(studentId, cloud, new Set(), localRejections);
  }

  const local = readProfile(studentId);
  const serverProgress = mergeProgress({}, cloud);
  const progress = mergeProgress(serverProgress, readLocalProgress(studentId));
  const unverifiedAssessment = Object.keys(progressTables).some(key => {
    const subject = key as keyof typeof progressTables;
    return Object.entries(progress[subject]).some(([lessonId, entry]) => {
      const remote = serverProgress[subject][lessonId];
      if (!flag(entry.completed) && (entry.quizTotal ?? 0) === 0 && (entry.quizScore ?? 0) === 0) return false;
      return flag(entry.completed) !== flag(remote?.completed) || (entry.stars ?? 0) > (remote?.stars ?? 0) ||
        (entry.quizScore ?? 0) !== (remote?.quizScore ?? 0) || (entry.quizTotal ?? 0) !== (remote?.quizTotal ?? 0);
    });
  });
  if (local.changes.length || local.state.legacyProfile || unverifiedAssessment) {
    if (!local.changes.some(change => {
      const operation = savedOperation(change);
      return !change.syncRejection && operation && operation.type !== "worksheet";
    })) return "blocked" as const;
    throw new Error("Some learning changes are still pending verification.");
  }
  for (const table of Object.values(progressTables)) {
    db.runSync("UPDATE " + table + " SET synced = 1 WHERE studentId = ?", [studentId]);
  }
}

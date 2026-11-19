import { db } from "../database/database";
import { getLocalStudent } from "../database/localStudent";
import { getOwnedMascots } from "../database/localMascot";
import { getLevel } from "../../utils/xp";
import { flag, mergeProgress, type StudentProgress } from "./progressMerge";
import type { Student } from "../../models/Student";

const counters = ["xp", "readingXP", "writingXP", "mathXP", "coins"] as const;
type Counters = Pick<Student, typeof counters[number]>;
type Profile = Counters & Pick<Student, "id" | "name" | "classCode" | "avatar" | "streak" | "level"> & { ownedMascots: string[] };
export type CloudStudent = Partial<Omit<Profile, "ownedMascots"> & StudentProgress> & {
  teacherId?: string;
  ownedMascots?: unknown;
  profileReceipts?: Record<string, number>;
  profileRevision?: number;
};

type Change = {
  id: number;
  subject: "reading" | "writing" | "math" | null;
  lessonId: string | null;
  xp: number;
  coins: number;
  avatar: string | null;
  mascotId: string | null;
};

const progressKey = { reading: "readingProgress", writing: "writingProgress", math: "mathProgress" } as const;
const safeNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isSafeInteger(value) ? value : fallback;
export const profileRevision = (cloud: CloudStudent) => Math.max(0, safeNumber(cloud.profileRevision, 0));

export function readProfile(studentId: string) {
  const local = getLocalStudent(studentId);
  if (!local) throw new Error("Student not found on this device.");
  db.runSync("INSERT OR IGNORE INTO student_profile_sync (studentId) VALUES (?)", [studentId]);
  const state = db.getFirstSync<{ deviceId: string; legacyProfile: string | null; confirmedProfile: string | null }>(
    "SELECT deviceId, legacyProfile, confirmedProfile FROM student_profile_sync WHERE studentId = ?", [studentId],
  )!;
  const changes = db.getAllSync<Change>(
    "SELECT * FROM student_profile_changes WHERE studentId = ? ORDER BY id", [studentId],
  );
  const confirmed = state.confirmedProfile ? JSON.parse(state.confirmedProfile) as CloudStudent : undefined;
  return { local, state, confirmed, changes, mascots: getOwnedMascots(studentId).map(item => item.mascotId) };
}

export function mergeStudentProfile(studentId: string, cloud: CloudStudent, snapshot?: ReturnType<typeof readProfile>) {
  if ((cloud.id !== undefined && cloud.id !== studentId) ||
    (cloud.classCode !== undefined && snapshot && cloud.classCode !== snapshot.local.classCode)) {
    throw new Error("Student identity or classroom does not match the saved account.");
  }
  const classCode = cloud.classCode ?? snapshot?.local.classCode;
  const name = cloud.name ?? snapshot?.local.name;
  if (typeof classCode !== "string" || !classCode || classCode.includes("/") || typeof name !== "string" || !name.trim()) {
    throw new Error("Student profile has no valid name or classroom.");
  }

  const { local, state, confirmed, changes, mascots } = snapshot ?? {
    local: undefined, state: undefined, confirmed: undefined, changes: [], mascots: [],
  };
  const authority = confirmed && profileRevision(cloud) <= profileRevision(confirmed) ? confirmed : cloud;
  const receipt = state ? safeNumber(cloud.profileReceipts?.[state.deviceId], -1) : -1;
  const legacy = state?.legacyProfile && receipt < 0
    ? JSON.parse(state.legacyProfile) as Partial<Counters & { avatar: string }>
    : undefined;
  const deltas: Counters = { xp: 0, readingXP: 0, writingXP: 0, mathXP: 0, coins: 0 };
  for (const change of changes) {
    deltas.xp += change.xp;
    deltas.coins += change.coins;
    if (change.subject) deltas[`${change.subject}XP`] += change.xp;
  }

  const values = { ...deltas };
  for (const field of counters) {
    const localBase = safeNumber(local?.[field], 0) - deltas[field];
    const remote = safeNumber(authority[field], localBase);
    values[field] = field === "coins"
      ? safeNumber(legacy?.coins, remote)
      : Math.max(localBase, remote, safeNumber(legacy?.[field], 0));
  }

  const remoteMascots = new Set<string>(["default"]);
  if (Array.isArray(cloud.ownedMascots)) {
    for (const mascot of cloud.ownedMascots) if (typeof mascot === "string" && mascot) remoteMascots.add(mascot);
  }
  let avatar = legacy?.avatar ?? authority.avatar ?? local?.avatar ?? "default";
  const cloudProgress = mergeProgress({}, cloud);
  for (const change of changes) {
    if (change.id <= receipt) continue;
    if (change.subject && change.lessonId) {
      const remoteProgress = cloudProgress[progressKey[change.subject]];
      if (flag(remoteProgress?.[change.lessonId]?.completed)) continue;
    }
    if (change.mascotId) {
      if (remoteMascots.has(change.mascotId)) continue;
      remoteMascots.add(change.mascotId);
    }
    values.xp += change.xp;
    values.coins += change.coins;
    if (change.subject) values[`${change.subject}XP`] += change.xp;
    if (change.avatar) avatar = change.avatar;
  }
  for (const mascot of mascots) remoteMascots.add(mascot);
  if (typeof avatar !== "string" || !remoteMascots.has(avatar)) avatar = "default";
  const profile: Profile = {
    id: studentId, name, classCode, ...values, avatar, ownedMascots: [...remoteMascots].sort(),
    level: getLevel(values.xp), streak: safeNumber(cloud.streak, local?.streak ?? 0),
  };
  return profile;
}

export function rememberConfirmedProfile(studentId: string, cloud: CloudStudent, previous?: CloudStudent) {
  if (profileRevision(cloud) <= (previous ? profileRevision(previous) : 0)) return;
  const { xp, coins, readingXP, writingXP, mathXP, avatar, profileRevision: revision } = cloud;
  db.runSync(
    `INSERT INTO student_profile_sync (studentId, confirmedProfile) VALUES (?, ?)
     ON CONFLICT(studentId) DO UPDATE SET confirmedProfile = excluded.confirmedProfile`,
    [studentId, JSON.stringify({ xp, coins, readingXP, writingXP, mathXP, avatar, profileRevision: revision })],
  );
}

export function saveRestoredProfile(profile: Profile) {
  db.runSync(
    `INSERT INTO student (id, name, classCode, xp, coins, readingXP, writingXP, mathXP, level, streak, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, xp = excluded.xp, coins = excluded.coins,
       readingXP = excluded.readingXP, writingXP = excluded.writingXP, mathXP = excluded.mathXP,
       level = excluded.level, streak = excluded.streak, avatar = excluded.avatar`,
    [profile.id, profile.name, profile.classCode, profile.xp, profile.coins, profile.readingXP, profile.writingXP,
      profile.mathXP, profile.level, profile.streak, profile.avatar],
  );
  for (const mascot of profile.ownedMascots) {
    db.runSync("INSERT OR IGNORE INTO owned_mascots (studentId, mascotId) VALUES (?, ?)", [profile.id, mascot]);
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocalStudent } from "../database/localStudent";

const KEY = "studentSession";
const REMEMBER_DURATION = 30 * 24 * 60 * 60_000;
const LEGACY_DURATION = 24 * 60 * 60_000;

type StudentSession = Readonly<{
  version: 1;
  studentId: string;
  classCode: string;
  remember: boolean;
  expiresAt: number;
  roster: boolean;
  legacy?: true;
}>;

let current: StudentSession | null = null;
let revision = 0;

export function getActiveStudentSession() {
  return current && current.expiresAt > Date.now() ? current : null;
}

export async function getSession() {
  const session = getActiveStudentSession();
  return session ? { studentId: session.studentId } : null;
}

export async function startStudentSession(details: Pick<StudentSession, "studentId" | "classCode" | "remember" | "roster">) {
  const session: StudentSession = { ...details, version: 1, expiresAt: Date.now() + REMEMBER_DURATION };
  const attempt = ++revision;
  if (session.remember) await AsyncStorage.setItem(KEY, JSON.stringify(session));
  if (revision !== attempt) throw new Error("The student session changed.");
  current = session;
  return session;
}

export async function restoreRememberedSession() {
  if (current) return getActiveStudentSession();
  const attempt = revision;
  const stored = await AsyncStorage.getItem(KEY);
  if (!stored || attempt !== revision) return getActiveStudentSession();

  let value: Partial<StudentSession> | null = null;
  try { value = JSON.parse(stored); }
  catch { /* Invalid saved sessions are cleared below. */ }

  if (value?.remember === true && typeof value.studentId === "string" && value.studentId &&
      !value.studentId.includes("/") && value.studentId !== "." && value.studentId !== "..") {
    const profile = getLocalStudent(value.studentId);
    const now = Date.now();
    if (profile?.classCode && value.version === 1 && value.classCode === profile.classCode &&
        typeof value.roster === "boolean" && (value.legacy === undefined || value.legacy === true) &&
        typeof value.expiresAt === "number" && Number.isSafeInteger(value.expiresAt) &&
        value.expiresAt > now && value.expiresAt <= now + (value.legacy ? LEGACY_DURATION : REMEMBER_DURATION)) {
      current = value as StudentSession;
      return current;
    }
    // Older builds stored only the selected student ID and Remember Me.
    // Allow a bounded offline resume for that same saved local student.
    if (profile?.classCode && value.version === undefined &&
        Object.keys(value).length === 2 && /^[A-Z0-9]+$/.test(profile.classCode)) {
      const session: StudentSession = {
        version: 1, studentId: profile.id, classCode: profile.classCode, remember: true,
        expiresAt: now + LEGACY_DURATION, roster: false, legacy: true,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(session));
      if (attempt === revision) current = session;
      return getActiveStudentSession();
    }
  }
  await clearSession();
  return null;
}

export async function clearSession() {
  ++revision;
  current = null;
  await AsyncStorage.removeItem(KEY);
}

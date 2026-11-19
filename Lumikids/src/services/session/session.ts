import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocalStudent } from "../database/localStudent";

const KEY = "studentSession";
const REMEMBER_DURATION = 30 * 24 * 60 * 60_000;
const LEGACY_DURATION = 24 * 60 * 60_000;
type StudentSession = Readonly<{ version: 2; studentId: string; remember: boolean; expiresAt: number }>;

let current: StudentSession | null = null;
let revision = 0;

export function getActiveStudentSession() {
  return current && current.expiresAt > Date.now() ? current : null;
}

export async function getSession() {
  const session = getActiveStudentSession();
  return session ? { studentId: session.studentId } : null;
}

export async function startStudentSession(studentId: string, remember: boolean) {
  if (!getLocalStudent(studentId)) throw new Error("The student profile was not saved.");
  const session: StudentSession = { studentId, remember, version: 2, expiresAt: Date.now() + REMEMBER_DURATION };
  const attempt = ++revision;
  if (remember) await AsyncStorage.setItem(KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(KEY);
  if (attempt !== revision) throw new Error("The student session changed.");
  current = session;
  return session;
}

export async function restoreRememberedSession() {
  if (current) return getActiveStudentSession();
  const attempt = revision;
  const stored = await AsyncStorage.getItem(KEY);
  if (!stored || attempt !== revision) return getActiveStudentSession();

  let value;
  try { value = JSON.parse(stored); } catch { value = null; }
  if (value?.remember === true && typeof value.studentId === "string" &&
      /^[A-Za-z0-9_-]{1,96}$/.test(value.studentId)) {
    const profile = getLocalStudent(value.studentId);
    const now = Date.now();
    const expiresAt = value.version === undefined && Object.keys(value).length === 2
      ? now + LEGACY_DURATION : value.expiresAt;
    if (profile?.classCode &&
        (value.version === 2 || (value.version === 1 && value.classCode === profile.classCode) ||
          (value.version === undefined && Object.keys(value).length === 2)) &&
        Number.isSafeInteger(expiresAt) && expiresAt > now && expiresAt <= now + REMEMBER_DURATION) {
      const session: StudentSession = { version: 2, studentId: profile.id, remember: true, expiresAt };
      if (value.version !== 2) await AsyncStorage.setItem(KEY, JSON.stringify(session));
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

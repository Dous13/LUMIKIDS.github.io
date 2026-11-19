import { signInWithCustomToken, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase/firebase";
import { clearSession, getActiveStudentSession, startStudentSession } from "../session/session";
import { withSignIn } from "../session/verifiedIdentity";
import { fetchStudentProfile, restoreStudentSnapshot } from "../sync/restoreStudentProgress";

type OnlineSession = {
  user: User;
  local: NonNullable<ReturnType<typeof getActiveStudentSession>>;
  expiresAt: number;
  nextCheck: number;
};
let online: OnlineSession | null = null;
let checking: OnlineSession | null = null;

export async function loginStudent(nameInput: string, codeInput: string, remember: boolean) {
  const name = nameInput.trim();
  const classCode = codeInput.trim().toUpperCase();
  if (!name || !classCode) throw new Error("Enter your student name and classroom code.");

  try {
    await withSignIn(async () => {
      online = null;
      const login = httpsCallable<{ name: string; classCode: string }, { studentId: string; token: string }>(functions, "loginStudent");
      const { data } = await login({ name, classCode });
      if (typeof data.studentId !== "string" || typeof data.token !== "string") throw new Error("Invalid login response.");
      const { user } = await signInWithCustomToken(auth, data.token);
      const token = await user.getIdTokenResult();
      const expiresAt = Date.parse(token.expirationTime);
      if (user.uid !== "student:" + data.studentId || token.claims.role !== "student" ||
          token.claims.studentId !== data.studentId || token.claims.classCode !== classCode ||
          !Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error("Invalid student identity.");
      const profile = await fetchStudentProfile(data.studentId);
      if (!profile || profile.id !== data.studentId || profile.classCode !== classCode || auth.currentUser !== user) {
        throw new Error("Invalid student enrollment.");
      }
      restoreStudentSnapshot(data.studentId, profile);
      const local = await startStudentSession(data.studentId, remember);
      online = { user, local, expiresAt, nextCheck: Date.now() + 5 * 60_000 };
    }, true);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (["unavailable", "deadline-exceeded", "functions/unavailable", "functions/deadline-exceeded", "auth/network-request-failed"].includes(code ?? "")) {
      throw new Error("Connect to the internet to verify your name and classroom code.");
    }
    throw new Error("We could not verify your name and classroom code. Check with your teacher or try again.");
  }
}

export function hasStudentCloudSession(studentId: string) {
  const local = getActiveStudentSession();
  return !!online && local?.studentId === studentId && local === online.local &&
    auth.currentUser === online.user && online.expiresAt > Date.now();
}

export function canSyncStudentSession(studentId: string) {
  return hasStudentCloudSession(studentId) && online !== checking;
}

export async function invalidateStudentCloudSession(studentId: string, error: unknown) {
  const code = (error as { code?: string })?.code;
  const active = online;
  if (!active || active.local.studentId !== studentId || active.user !== auth.currentUser ||
      !["permission-denied", "unauthenticated", "functions/unauthenticated", "functions/permission-denied",
        "auth/user-token-expired", "auth/user-disabled", "auth/user-not-found"].includes(code ?? "")) return;
  online = null;
  await auth.signOut();
}

export async function refreshStudentSession() {
  const active = online;
  if (!active || active === checking || active.local !== getActiveStudentSession() || active.user !== auth.currentUser ||
      Date.now() < active.nextCheck) return;
  checking = active;
  active.nextCheck = Date.now() + 30_000;
  try {
    const token = await active.user.getIdTokenResult(true);
    const profile = await fetchStudentProfile(active.local.studentId);
    if (online !== active || active.local !== getActiveStudentSession() || active.user !== auth.currentUser) return;
    if (!profile || profile.id !== active.local.studentId || token.claims.studentId !== profile.id ||
        token.claims.classCode !== profile.classCode || token.claims.role !== "student") {
      await invalidateStudentCloudSession(active.local.studentId, { code: "permission-denied" });
      return;
    }
    restoreStudentSnapshot(active.local.studentId, profile);
    active.expiresAt = Date.parse(token.expirationTime);
    active.nextCheck = Date.now() + 5 * 60_000;
  } catch (error) {
    if (online === active) await invalidateStudentCloudSession(active.local.studentId, error);
  } finally {
    if (checking === active) checking = null;
  }
}

export async function logoutStudent() {
  online = null;
  try { await clearSession(); }
  finally {
    if (auth.currentUser?.uid.startsWith("student:")) await auth.signOut();
  }
}

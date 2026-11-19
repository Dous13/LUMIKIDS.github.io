import { collection, doc, getDocFromServer, getDocsFromServer, limit, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { clearSession, getActiveStudentSession, startStudentSession } from "../session/session";
import { withSignIn } from "../session/verifiedIdentity";
import { fetchStudentProfile, restoreStudentSnapshot } from "../sync/restoreStudentProgress";
import type { CloudStudent } from "../sync/studentProfile";

class StudentAccountError extends Error {}

async function readClass(classCode: string) {
  const classroom = await getDocFromServer(doc(db, "classes", classCode));
  const data = classroom.data();
  if (!data || (data.code !== undefined && data.code !== classCode)) {
    throw new StudentAccountError("That classroom code was not found. Check the code with your teacher.");
  }
  return typeof data.teacherId === "string" ? data.teacherId : undefined;
}

function validateEnrollment(data: CloudStudent, studentId: string, classCode: string, teacherId?: string) {
  if ((data.id !== undefined && data.id !== studentId) || data.classCode !== classCode ||
      (teacherId && data.teacherId !== undefined && data.teacherId !== teacherId)) {
    throw new StudentAccountError("This student record does not match the classroom. Ask your teacher to check it.");
  }
}

async function readStudent(studentId: string, classCode: string, teacherId: string | undefined) {
  const profile = await fetchStudentProfile(studentId);
  if (!profile) throw new StudentAccountError("The student profile does not exist. Ask your teacher to check it.");
  validateEnrollment(profile, studentId, classCode, teacherId);
  return profile;
}

let lastCheckedSession: ReturnType<typeof getActiveStudentSession> = null;
let verifiedForSync: ReturnType<typeof getActiveStudentSession> = null;
let nextCheck = 0;
let checking: ReturnType<typeof getActiveStudentSession> = null;

export async function loginStudent(nameInput: string, codeInput: string, remember: boolean) {
  const name = nameInput.trim();
  const classCode = codeInput.trim().toUpperCase();
  if (!name) throw new StudentAccountError("Enter your student name.");
  if (!classCode) throw new StudentAccountError("Enter your classroom code.");
  if (!/^[A-Z0-9]{1,64}$/.test(classCode)) throw new StudentAccountError("Enter a valid classroom code.");

  try {
    await withSignIn(async () => {
      const teacherId = await readClass(classCode);
      const roster = await getDocsFromServer(query(
        collection(db, "classes", classCode, "students"),
        where("preferredNameLower", "==", name.toLowerCase()),
        limit(2),
      ));
      // Keep the original exact-name fallback for older records without a
      // normalized roster entry. Both lookups are scoped to this classroom.
      const matches = roster.empty ? await getDocsFromServer(query(
        collection(db, "students"),
        where("classCode", "==", classCode),
        where("name", "==", name),
        limit(2),
      )) : roster;
      if (matches.empty) throw new StudentAccountError("No student with that name was found in this classroom.");
      if (matches.docs.length !== 1) {
        throw new StudentAccountError("More than one student matches that name. Ask your teacher to check the roster.");
      }
      const match = matches.docs[0];
      const entry = match.data();
      if (roster.empty && entry.preferredNameLower !== undefined) {
        throw new StudentAccountError("This student is missing from the classroom roster. Ask your teacher to check it.");
      }
      validateEnrollment(entry, match.id, classCode, teacherId);
      const profile = await readStudent(match.id, classCode, teacherId);
      restoreStudentSnapshot(match.id, profile);
      lastCheckedSession = await startStudentSession({ studentId: match.id, classCode, remember, roster: !roster.empty });
      verifiedForSync = lastCheckedSession;
      nextCheck = Date.now() + 5 * 60_000;
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (error instanceof StudentAccountError) throw error;
    if (code === "unavailable" || code === "deadline-exceeded") {
      throw new StudentAccountError("You are offline. Connect to the internet to verify your name and classroom code.");
    }
    throw new StudentAccountError("We could not verify this student account. Try again or ask your teacher for help.");
  }
}

export async function refreshStudentSession() {
  const session = getActiveStudentSession();
  if (!session || checking === session || (lastCheckedSession === session && Date.now() < nextCheck)) return;
  checking = session;
  lastCheckedSession = session;
  nextCheck = Date.now() + 30_000;
  try {
    const { studentId, classCode } = session;
    const teacherId = await readClass(classCode);
    const profile = await readStudent(studentId, classCode, teacherId);
    const requiresRoster = session.roster || profile.preferredNameLower !== undefined;
    if (requiresRoster) {
      const roster = await getDocFromServer(doc(db, "classes", classCode, "students", studentId));
      const entry = roster.data();
      if (!entry) throw new StudentAccountError("The student is no longer registered in this classroom.");
      validateEnrollment(entry, studentId, classCode, teacherId);
    }
    if (getActiveStudentSession() !== session) return;
    restoreStudentSnapshot(studentId, profile);
    if (session.legacy) {
      const upgraded = await startStudentSession({
        studentId, classCode, remember: true, roster: requiresRoster,
      });
      if (getActiveStudentSession() !== upgraded) return;
      lastCheckedSession = upgraded;
    }
    verifiedForSync = lastCheckedSession;
    nextCheck = Date.now() + 5 * 60_000;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (getActiveStudentSession() === session &&
        (error instanceof StudentAccountError || code === "permission-denied" || code === "unauthenticated")) {
      await clearSession();
    }
  } finally {
    if (checking === session) checking = null;
  }
}

export function canSyncStudentSession(studentId: string) {
  const session = getActiveStudentSession();
  return session?.studentId === studentId && session === verifiedForSync && session !== checking;
}

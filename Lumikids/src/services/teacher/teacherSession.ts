import type { User } from "firebase/auth";
import { clearVerifiedIdentity, getVerifiedIdentity, setVerifiedIdentity } from "../session/verifiedIdentity";
import { revokeWorksheetReviewAccess } from "../phygital/worksheetStore";

export type TeacherSession = { teacherId: string; email: string; name: string };
let session: TeacherSession | null = null;

export async function saveTeacherSession(user: User, details: TeacherSession) {
  const token = await user.getIdTokenResult();
  if (user.uid !== details.teacherId) {
    throw new Error("This account is not a teacher account.");
  }
  revokeWorksheetReviewAccess(details.teacherId);
  setVerifiedIdentity({ user, expiresAt: Date.parse(token.expirationTime) });
  session = details;
}

export async function getTeacherSession(): Promise<TeacherSession | null> {
  const identity = getVerifiedIdentity();
  return identity && identity.user.uid === session?.teacherId ? session : null;
}

export async function clearTeacherSession() {
  clearVerifiedIdentity();
  session = null;
}

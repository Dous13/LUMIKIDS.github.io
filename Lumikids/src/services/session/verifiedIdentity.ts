import type { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { clearSession } from "./session";

type Identity = { user: User; expiresAt: number };
let current: Identity | null = null;
let nextCheck = 0;
let signingIn = false;

export function getVerifiedIdentity() {
  return current && current.user === auth.currentUser && Date.now() < current.expiresAt ? current : null;
}

export function setVerifiedIdentity(identity: Identity) {
  if (identity.user !== auth.currentUser || !Number.isFinite(identity.expiresAt) || identity.expiresAt <= Date.now()) {
    throw new Error("This sign-in has expired.");
  }
  current = identity;
  nextCheck = Date.now() + 5 * 60_000;
}

export function clearVerifiedIdentity() {
  current = null;
}

export async function withSignIn<T>(signIn: () => Promise<T>): Promise<T> {
  if (signingIn) throw new Error("A sign-in is already in progress.");
  signingIn = true;
  clearVerifiedIdentity();
  try {
    await clearSession();
    if (auth.currentUser) await auth.signOut();
    return await signIn();
  } catch (error) {
    if (auth.currentUser) await auth.signOut().catch(() => undefined);
    throw error;
  } finally {
    signingIn = false;
  }
}

export async function refreshVerifiedIdentity() {
  const identity = current;
  if (!identity || identity.user !== auth.currentUser) return;
  if (Date.now() >= identity.expiresAt) {
    clearVerifiedIdentity();
    await auth.signOut();
    return;
  }
  if (Date.now() < nextCheck) return;
  nextCheck = Date.now() + 60_000;
  try {
    const token = await identity.user.getIdTokenResult(true);
    if (current !== identity || auth.currentUser !== identity.user) return;
    setVerifiedIdentity({ ...identity, expiresAt: Date.parse(token.expirationTime) });
  } catch (error) {
    if (current !== identity || auth.currentUser !== identity.user) return;
    const code = (error as { code?: string })?.code;
    if (code !== "auth/network-request-failed" && code !== "auth/too-many-requests") {
      clearVerifiedIdentity();
      await auth.signOut();
    }
  }
}

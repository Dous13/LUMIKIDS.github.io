import * as Crypto from "expo-crypto";

/**
 * Generates a unique student ID.
 */
export function generateStudentId(): string {
  return Crypto.randomUUID();
}

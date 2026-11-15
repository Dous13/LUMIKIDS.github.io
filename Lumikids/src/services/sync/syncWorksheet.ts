import { doc, setDoc, collection, getDocs, runTransaction } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { db } from "../database/database";
import { getWorksheetRecord } from "../phygital/worksheetStore";
import { canonicalJson, worksheetIdentityBits } from "../phygital/worksheetLayout";
import { syncStudent } from "./syncStudent";

export async function syncWorksheet(studentId: string, instanceId: string) {
  const record = getWorksheetRecord(studentId, instanceId);
  // Stable document IDs make interrupted/retried uploads idempotent. A draft
  // upload never writes finalized:null over an already finalized result.
  const ref = doc(firestore, "students", studentId, "worksheetResults", instanceId);
  const payload = {
    worksheet: record.worksheet,
    ...(record.capture ? { capture: record.capture } : {}),
    ...(record.finalized ? { finalized: record.finalized } : {}),
  };
  if (record.finalized) {
    await runTransaction(firestore, async transaction => {
      const snapshot = await transaction.get(ref);
      const existing = snapshot.exists() ? snapshot.data().finalized : null;
      if (existing && canonicalJson(existing) !== canonicalJson(record.finalized)) {
        throw new Error("This worksheet was finalized differently on another device. Its queued result is preserved locally for review.");
      }
      transaction.set(ref, payload, { merge: true });
    });
  } else await setDoc(ref, payload, { merge: true });
  // Keep this job pending if the progress upload is interrupted. It must not
  // rely only on a separate, possibly already-running deduplicated student job.
  if (record.finalized) await syncStudent(studentId);
}

export async function restoreWorksheetHistory(studentId: string) {
  const snapshots = await getDocs(collection(firestore, "students", studentId, "worksheetResults"));
  db.withTransactionSync(() => {
    for (const snapshot of snapshots.docs) {
      const value = snapshot.data(), worksheet = value.worksheet;
      if (!worksheet || worksheet.studentId !== studentId || worksheet.instanceId !== snapshot.id) continue;
      worksheetIdentityBits(worksheet);
      const local = db.getFirstSync<{ finalized: string | null; capture: string | null }>(
        "SELECT finalized, capture FROM worksheet_instances WHERE studentId = ? AND instanceId = ?", [studentId, snapshot.id]);
      const final = value.finalized?.studentId === studentId && value.finalized?.instanceId === snapshot.id ? value.finalized : null;
      if (!local) {
        db.runSync("INSERT INTO worksheet_instances (studentId, instanceId, worksheet, capture, finalized) VALUES (?, ?, ?, ?, ?)",
          [studentId, snapshot.id, JSON.stringify(worksheet), value.capture ? JSON.stringify(value.capture) : null, final ? JSON.stringify(final) : null]);
      } else if (!local.finalized && final) {
        db.runSync("UPDATE worksheet_instances SET finalized = ? WHERE studentId = ? AND instanceId = ?", [JSON.stringify(final), studentId, snapshot.id]);
      } else if (!local.capture && value.capture && !local.finalized) {
        db.runSync("UPDATE worksheet_instances SET capture = ? WHERE studentId = ? AND instanceId = ?", [JSON.stringify(value.capture), studentId, snapshot.id]);
      }
    }
  });
}

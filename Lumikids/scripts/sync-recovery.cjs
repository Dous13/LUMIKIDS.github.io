const { readFileSync, statSync } = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

function inspect(db, studentId) {
  return db.prepare(`SELECT c.id, s.deviceId || '-' || c.id AS operationId, c.operation,
    c.subject, c.lessonId, c.mascotId, c.avatar, c.syncRejection AS reason, c.replacementId,
    CASE WHEN c.syncRejection IS NOT NULL THEN 'quarantined'
         WHEN c.operation IS NULL AND c.mascotId IS NULL AND c.avatar IS NULL THEN 'historical'
         ELSE 'eligible' END AS status
    FROM student_profile_changes c JOIN student_profile_sync s ON c.studentId = s.studentId
    WHERE c.studentId = ? ORDER BY c.id`).all(studentId);
}

function sameTarget(row, replacement) {
  let original;
  try { original = JSON.parse(row.operation); } catch { /* Use the journal metadata. */ }
  if (!replacement || typeof replacement !== "object") return false;
  if (row.mascotId || row.avatar) {
    return replacement.type === (row.mascotId ? "purchase" : "equip") && replacement.mascotId === (row.mascotId || row.avatar);
  }
  if (row.subject && row.lessonId) {
    return replacement.lessonId === row.lessonId && (row.subject === "writing" ? replacement.type === "trace" :
      replacement.type === "quiz" && replacement.subject === row.subject);
  }
  if (!original || original.type !== replacement.type) return false;
  if (original.type === "purchase" || original.type === "equip") return replacement.mascotId === original.mascotId;
  if (original.type === "trace") return replacement.lessonId === original.lessonId;
  return ["quiz", "mistake"].includes(original.type) && replacement.subject === original.subject &&
    replacement.lessonId === original.lessonId && (original.type !== "mistake" || replacement.questionIndex === original.questionIndex);
}

function stageCorrection(db, studentId, id, replacement) {
  const { applyOperation, InvalidOperation, profileSummary } = require("../backend/functions/learning.cjs");
  db.exec("BEGIN IMMEDIATE");
  try {
    const original = db.prepare("SELECT * FROM student_profile_changes WHERE studentId = ? AND id = ?").get(studentId, id);
    if (!original?.syncRejection) throw new Error("Select a quarantined operation for this student.");
    if (original.replacementId !== null) throw new Error(`A correction was already queued as row ${original.replacementId}.`);
    if (!sameTarget(original, replacement)) throw new Error("The correction must describe the same identifiable activity or wallet item.");
    try { applyOperation(profileSummary({}), replacement); }
    catch (error) {
      if (!(error instanceof InvalidOperation && error.reason === "dependency")) throw error;
    }
    const queued = db.prepare("INSERT INTO student_profile_changes (studentId, operation) VALUES (?, ?)")
      .run(studentId, JSON.stringify(replacement));
    const replacementId = Number(queued.lastInsertRowid);
    db.prepare("UPDATE student_profile_changes SET replacementId = ? WHERE studentId = ? AND id = ?")
      .run(replacementId, studentId, id);
    const job = db.prepare(`SELECT id FROM sync_queue WHERE action = 'SYNC_STUDENT' AND synced = 0
      AND CASE WHEN json_valid(payload) THEN json_extract(payload, '$.studentId') = ? ELSE 0 END ORDER BY id LIMIT 1`).get(studentId);
    if (job) db.prepare("UPDATE sync_queue SET blocked = 0, revision = revision + 1 WHERE id = ?").run(job.id);
    else db.prepare("INSERT INTO sync_queue (action, payload, createdAt, synced) VALUES ('SYNC_STUDENT', ?, ?, 0)")
      .run(JSON.stringify({ studentId }), Date.now());
    db.exec("COMMIT");
    return replacementId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

if (require.main === module) {
  const [command, file, studentId, row, correction] = process.argv.slice(2);
  try {
    if (!["inspect", "stage"].includes(command) || !file || !studentId ||
        (command === "stage" && (!/^[1-9]\d*$/.test(row ?? "") || !Number.isSafeInteger(Number(row)) || !correction))) {
      throw new Error("Usage: sync-recovery.cjs inspect <db> <studentId> | stage <db> <studentId> <rowId> <correction.json>");
    }
    if (!statSync(file).isFile()) throw new Error("Choose an existing SQLite database.");
    const db = new DatabaseSync(file, { readOnly: command === "inspect" });
    try {
      const result = command === "inspect" ? inspect(db, studentId) :
        { replacementId: stageCorrection(db, studentId, Number(row), JSON.parse(readFileSync(correction, "utf8"))) };
      console.log(JSON.stringify(result, null, 2));
    } finally { db.close(); }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { inspect, stageCorrection };

const { canonicalJson, worksheetCaptureKey } = require("./curriculum/services/phygital/worksheetLayout");
const { InvalidOperation, verifyWorksheet, verifyCapture, applyWorksheet } = require("./learning.cjs");

function syncWorksheetRevision(existing, data, profile, actorId, now) {
  const worksheet = verifyWorksheet(data.worksheet, data.studentId, now, existing?.worksheet);
  if (existing && canonicalJson(existing.worksheet) !== canonicalJson(worksheet)) {
    throw new InvalidOperation("The worksheet identity has changed.");
  }
  const revision = existing?.revision ?? 0;
  const result = { revision, capture: existing?.capture ?? null, finalized: existing?.finalized ?? null, profile };
  const conflict = { result: { ...result, conflict: true } };
  const { review, baseRevision } = data;
  if (existing?.finalized) {
    const previous = existing.finalized;
    if (review !== null && (baseRevision !== revision || previous.teacherId !== actorId ||
        previous.finalizedAt !== review.finalizedAt || canonicalJson(previous.answers) !== canonicalJson(review.answers) ||
        canonicalJson(previous.writing) !== canonicalJson(review.writing) || worksheetCaptureKey(data.capture) !== worksheetCaptureKey(existing.capture))) {
      return conflict;
    }
    return { result };
  }
  const sameCapture = worksheetCaptureKey(data.capture) === worksheetCaptureKey(existing?.capture);
  // A stored pre-revision capture may contain old clock data. Only its exact
  // review content qualifies as an existing capture, never a new replacement.
  if (data.capture && !sameCapture) verifyCapture(data.capture, worksheet, now);
  if (review !== null) {
    if (!existing?.capture || !data.capture || baseRevision !== revision || !sameCapture) return conflict;
    const finalized = applyWorksheet(profile, worksheet, review, actorId, now);
    return { write: { worksheet, capture: existing.capture, revision, finalized }, result: { ...result, finalized }, award: true };
  }
  if (!data.capture || sameCapture) return { write: existing ? undefined : { worksheet, revision }, result };
  if (baseRevision !== revision) return conflict;
  const capture = { ...data.capture, darkness: { ...data.capture.darkness } };
  return {
    write: { worksheet, capture, revision: revision + 1 },
    result: { ...result, capture, revision: revision + 1 },
  };
}

module.exports = { syncWorksheetRevision };

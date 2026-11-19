const { createHash } = require("node:crypto");
const { isIP } = require("node:net");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { canonicalJson } = require("./curriculum/services/phygital/worksheetLayout");
const {
  InvalidOperation, exact, profileSummary, applyOperation, verifyWorksheet, verifyCapture, isOlderWorksheetCapture, applyWorksheet,
} = require("./learning.cjs");

initializeApp();
const auth = getAuth();
const db = getFirestore();
const options = { maxInstances: 10, timeoutSeconds: 30 };
const hash = value => createHash("sha256").update(value).digest("hex");
const validStudentId = id => typeof id === "string" && /^[A-Za-z0-9_-]{1,96}$/.test(id);
const validClassCode = value => typeof value === "string" && /^[A-Z0-9]{1,64}$/.test(value);
const studentUid = id => "student:" + id;
const denied = () => new HttpsError("permission-denied", "This account cannot access the requested record.");
const loginDenied = () => new HttpsError("permission-denied", "We could not verify your name and classroom code.");
const sameEnrollment = (entry, studentId, classCode, teacherId) =>
  entry?.id === studentId && entry.classCode === classCode && entry.teacherId === teacherId;

function loginSource(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const lastHop = typeof forwarded === "string" ? forwarded.slice(forwarded.lastIndexOf(",") + 1).trim() : "";
  const address = !process.env.FUNCTIONS_EMULATOR && isIP(lastHop) ? lastHop : request.socket.remoteAddress;
  return address?.replace(/^::ffff:/i, "").toLowerCase() || "unknown";
}

const LOGIN_WINDOW = 300_000;
const FAILED_LOGINS_PER_SOURCE = 120;
const FAILED_LOGINS_PER_NAME_SLOT = 12;
const ISSUES_PER_STUDENT_AND_SOURCE = 12;
const loginBucket = key => db.doc("loginLimits/" + hash(key));
const attemptsIn = (bucket, window) => bucket?.window === window ? bucket.count : 0;
const limitState = (window, count) => ({ window, count, expiresAt: new Date((window + 2) * LOGIN_WINDOW) });

async function enrollment(tx, studentId) {
  if (!validStudentId(studentId)) throw denied();
  const rootRef = db.doc("students/" + studentId);
  const student = (await tx.get(rootRef)).data();
  if (!student || student.id !== studentId || !validClassCode(student.classCode) ||
      typeof student.teacherId !== "string" || !student.teacherId || student.teacherId.includes("/") ||
      typeof student.name !== "string" || !student.name.trim()) throw denied();
  const { classCode, teacherId } = student;
  const rosterRef = db.doc("classes/" + classCode + "/students/" + studentId);
  const [classroom, roster, teacher, access] = await tx.getAll(
    db.doc("classes/" + classCode), rosterRef, db.doc("teachers/" + teacherId), db.doc("studentAccess/" + studentId),
  );
  const policy = access.data();
  const version = policy ? policy.version : 0;
  if (classroom.data()?.code !== classCode || classroom.data()?.teacherId !== teacherId ||
      teacher.data()?.id !== teacherId || (roster.exists
        ? !sameEnrollment(roster.data(), studentId, classCode, teacherId)
        : student.preferredNameLower !== undefined) ||
      (policy && policy.enabled !== true) || !Number.isSafeInteger(version) || version < 0) throw denied();
  return { student, rootRef, rosterRef, rosterExists: roster.exists, version };
}

async function resolveStudentLogin(tx, name, code) {
  const classroom = (await tx.get(db.doc("classes/" + code))).data();
  if (classroom?.code !== code) return null;
  const matches = await tx.get(db.collection("classes/" + code + "/students")
    .where("preferredNameLower", "==", name.toLowerCase()).limit(2));
  const legacy = matches.empty;
  const candidates = legacy
    ? await tx.get(db.collection("students").where("classCode", "==", code).where("name", "==", name).limit(2))
    : matches;
  if (candidates.size !== 1) return null;
  const match = candidates.docs[0];
  try {
    const { student, version } = await enrollment(tx, match.id);
    if (!sameEnrollment(match.data(), match.id, code, classroom.teacherId) ||
        student.classCode !== code || student.teacherId !== classroom.teacherId ||
        (legacy ? student.preferredNameLower !== undefined || student.name !== name
          : student.preferredNameLower !== name.toLowerCase())) return null;
    return { studentId: match.id, classCode: code, version };
  } catch (error) {
    if (error instanceof HttpsError && error.code === "permission-denied") return null;
    throw error;
  }
}

exports.loginStudent = onCall(options, async request => {
  const name = typeof request.data?.name === "string" && request.data.name.length <= 128 ? request.data.name.trim() : "";
  const code = typeof request.data?.classCode === "string" && request.data.classCode.length <= 80
    ? request.data.classCode.trim().toUpperCase() : "";
  const valid = exact(request.data, ["name", "classCode"]) && name.length > 0 && name.length <= 100 && validClassCode(code);
  const source = loginSource(request.rawRequest);
  const failures = loginBucket("failed:" + source);
  // A fixed set of slots keeps repeated guesses for one name from spending
  // the shared source budget and prevents arbitrary names creating documents.
  const slot = hash(name.toLowerCase()).slice(0, 2);
  const window = Math.floor(Date.now() / LOGIN_WINDOW);
  const identity = await db.runTransaction(async tx => {
    const state = (await tx.get(failures)).data();
    const failed = attemptsIn(state, window);
    const slots = state?.window === window ? state.slots ?? {} : {};
    const failedForSlot = slots[slot] ?? 0;
    if (failed >= FAILED_LOGINS_PER_SOURCE || failedForSlot >= FAILED_LOGINS_PER_NAME_SLOT) return null;
    const match = valid ? await resolveStudentLogin(tx, name, code) : null;
    if (!match) {
      tx.set(failures, { ...limitState(window, failed + 1), slots: { ...slots, [slot]: failedForSlot + 1 } });
      return null;
    }
    const issued = loginBucket("issued:" + source + ":" + match.studentId);
    const count = attemptsIn((await tx.get(issued)).data(), window);
    if (count >= ISSUES_PER_STUDENT_AND_SOURCE) return null;
    tx.set(issued, limitState(window, count + 1));
    return match;
  });
  if (!identity) throw loginDenied();
  const { studentId, classCode, version } = identity;
  return {
    studentId,
    token: await auth.createCustomToken(studentUid(studentId), { role: "student", studentId, classCode, sessionVersion: version }),
  };
});

async function verifiedCaller(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to continue.");
  const header = request.rawRequest.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) throw denied();
  let caller;
  try { caller = await auth.verifyIdToken(header.slice(7), true); }
  catch { throw new HttpsError("unauthenticated", "Sign in to continue."); }
  if (caller.uid !== request.auth.uid) throw denied();
  return caller;
}

function authorize(caller, context, teacherAllowed) {
  const { student, version } = context;
  if (caller.role === "student") {
    if (caller.uid !== studentUid(student.id) || caller.studentId !== student.id ||
        caller.classCode !== student.classCode || caller.sessionVersion !== version) throw denied();
    return "student";
  }
  if (!teacherAllowed || caller.firebase?.sign_in_provider !== "password" ||
      caller.uid.startsWith("student:") || caller.uid !== student.teacherId) throw denied();
  return "teacher";
}

function writeSummary(tx, context, profile) {
  profile.profileRevision++;
  const summary = { ...profile, updatedAt: FieldValue.serverTimestamp() };
  tx.set(context.rootRef, summary, { mergeFields: Object.keys(summary) });
  if (!context.rosterExists) {
    // Only verified historical root-only enrollments can be repaired here.
    const { profileReceipts, ...existing } = context.student;
    tx.create(context.rosterRef, { ...existing, ...summary });
  } else {
    tx.set(context.rosterRef, summary, { mergeFields: Object.keys(summary) });
  }
}

exports.syncStudentLearning = onCall(options, async request => {
  const caller = await verifiedCaller(request);
  const data = request.data;
  if (!exact(data, ["studentId", "operations"]) || !validStudentId(data.studentId) ||
      caller.role !== "student" || caller.studentId !== data.studentId || caller.uid !== studentUid(data.studentId)) throw denied();
  const { studentId, operations } = data;
  if (!Array.isArray(operations) || operations.length < 1 || operations.length > 24 ||
      !operations.every(item => exact(item, ["id", "operation"]) && typeof item.id === "string" &&
        /^[a-f0-9]{32}-[1-9]\d{0,15}$/.test(item.id)) ||
      new Set(operations.map(item => item.id)).size !== operations.length ||
      Buffer.byteLength(JSON.stringify(operations)) > 1_500_000) {
    throw new HttpsError("invalid-argument", "Invalid learning batch.");
  }
  return db.runTransaction(async tx => {
    const context = await enrollment(tx, studentId);
    authorize(caller, context, false);
    const refs = operations.map(item => context.rootRef.collection("syncReceipts").doc(item.id));
    const receipts = await tx.getAll(...refs);
    let profile = profileSummary(context.student);
    const accepted = [];
    const rejected = [];
    let changed = false;
    for (const [index, item] of operations.entries()) {
      let digest;
      try { digest = hash(canonicalJson(item.operation)); }
      catch (error) {
        if (!(error instanceof RangeError)) throw error;
        rejected.push({ id: item.id, reason: "invalid-operation" });
        continue;
      }
      if (receipts[index].exists) {
        if (receipts[index].data().digest === digest) accepted.push(item.id);
        else rejected.push({ id: item.id, reason: "receipt-conflict" });
        continue;
      }
      const candidate = structuredClone(profile);
      try { applyOperation(candidate, item.operation); }
      catch (error) {
        if (error instanceof InvalidOperation) {
          rejected.push({ id: item.id, reason: error.reason });
          continue;
        }
        throw error;
      }
      profile = candidate;
      tx.create(refs[index], { digest, committedAt: FieldValue.serverTimestamp() });
      accepted.push(item.id);
      changed = true;
    }
    if (changed) writeSummary(tx, context, profile);
    return { accepted, rejected, profile };
  });
});

function sameReview(result, review, teacherId) {
  return result.teacherId === teacherId && result.finalizedAt === review.finalizedAt &&
    canonicalJson(result.answers) === canonicalJson(review.answers) && canonicalJson(result.writing) === canonicalJson(review.writing);
}

exports.syncWorksheet = onCall(options, async request => {
  const caller = await verifiedCaller(request);
  const data = request.data;
  if (!exact(data, ["studentId", "worksheet", "capture", "review"]) || !validStudentId(data.studentId) ||
      (caller.role === "student" && (caller.studentId !== data.studentId || data.review !== null))) throw denied();
  try {
    const now = Date.now();
    const worksheet = verifyWorksheet(data.worksheet, data.studentId, now);
    const capture = data.capture === null ? null : verifyCapture(data.capture, worksheet, now);
    // Firestore does not accept arrays nested directly inside arrays.
    const storedCapture = capture && { ...capture, darkness: Object.fromEntries(capture.darkness.entries()) };
    return await db.runTransaction(async tx => {
      const context = await enrollment(tx, data.studentId);
      const role = authorize(caller, context, true);
      if (data.review !== null && role !== "teacher") throw denied();
      const ref = context.rootRef.collection("worksheetResults").doc(worksheet.instanceId);
      const existing = (await tx.get(ref)).data();
      if (existing && canonicalJson(existing.worksheet) !== canonicalJson(worksheet)) {
        throw new InvalidOperation("The worksheet identity has changed.");
      }
      let profile = profileSummary(context.student);
      if (existing?.finalized) {
        if (data.review !== null && !sameReview(existing.finalized, data.review, caller.uid)) {
          throw new InvalidOperation("This worksheet was finalized with a different review.");
        }
        return { finalized: existing.finalized, profile };
      }
      const older = isOlderWorksheetCapture(existing?.capture, storedCapture, now);
      if (data.review === null) {
        if (!existing || (capture && !older && canonicalJson(existing.capture ?? null) !== canonicalJson(storedCapture))) {
          tx.set(ref, { worksheet, ...(storedCapture ? { capture: storedCapture } : {}) }, { merge: true });
        }
        return { finalized: null, profile };
      }
      if (!capture || older) throw new InvalidOperation("Review the most recent capture before finalizing.");
      const finalized = applyWorksheet(profile, worksheet, data.review, caller.uid, now);
      tx.set(ref, { worksheet, capture: storedCapture, finalized });
      writeSummary(tx, context, profile);
      return { finalized, profile };
    });
  } catch (error) {
    if (error instanceof InvalidOperation) throw new HttpsError("failed-precondition", error.message);
    throw error;
  }
});

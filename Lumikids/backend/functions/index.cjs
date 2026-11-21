const { createHash } = require("node:crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { InvalidOperation, exact, profileSummary, isWorksheetInstanceId } = require("./learning.cjs");
const { applyLearningBatch, equipDevice, operationSequence } = require("./learningBatch.cjs");
const { syncWorksheetRevision } = require("./worksheetRevision.cjs");
const { loginSource } = require("./loginSource.cjs");
if (!getApps().some(app => app.name === "[DEFAULT]")) initializeApp();
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
  if (!source) throw loginDenied();
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
      !operations.every(item => exact(item, ["id", "operation"]) && operationSequence(item.id) !== null) ||
      new Set(operations.map(item => item.id)).size !== operations.length ||
      Buffer.byteLength(JSON.stringify(operations)) > 1_500_000) {
    throw new HttpsError("invalid-argument", "Invalid learning batch.");
  }
  return db.runTransaction(async tx => {
    const context = await enrollment(tx, studentId);
    authorize(caller, context, false);
    const collection = context.rootRef.collection("syncReceipts");
    const refs = operations.map(item => collection.doc(item.id));
    const devices = [...new Set(operations.map(equipDevice).filter(Boolean))];
    const head = collection.doc("wallet-version");
    const checkpoints = devices.map(device => collection.doc("wallet-" + device));
    const snapshots = await tx.getAll(...refs, ...(devices.length ? [head, ...checkpoints] : []));
    const stored = snapshots.slice(0, refs.length).map(snapshot => snapshot.data());
    const wallet = snapshots[refs.length]?.data() ?? { version: 0 };
    const storedCheckpoints = new Map(devices.map((device, index) => [device, snapshots[refs.length + index + 1].data()]));
    const batch = applyLearningBatch(profileSummary(context.student), operations, stored, wallet, storedCheckpoints);
    for (const [id, receipt] of batch.receipts) {
      const stamp = receipt.waitingAt === undefined ? { committedAt: FieldValue.serverTimestamp() } : {};
      tx.set(collection.doc(id), { ...receipt, ...stamp });
    }
    if (batch.walletChanged) tx.set(head, batch.wallet);
    for (const [device, checkpoint] of batch.checkpoints) tx.set(collection.doc("wallet-" + device), checkpoint);
    if (batch.changed) writeSummary(tx, context, batch.profile);
    return { accepted: batch.accepted, supersededEquip: batch.supersededEquip, rejected: batch.rejected, profile: batch.profile };
  });
});

exports.syncWorksheet = onCall(options, async request => {
  const caller = await verifiedCaller(request);
  const data = request.data;
  if (!exact(data, ["studentId", "worksheet", "capture", "review", "baseRevision"]) || !validStudentId(data.studentId) ||
      !isWorksheetInstanceId(data.worksheet?.instanceId) || !Number.isSafeInteger(data.baseRevision) || data.baseRevision < 0 ||
      (caller.role === "student" && (caller.studentId !== data.studentId || data.review !== null))) throw denied();
  try {
    const now = Date.now();
    return await db.runTransaction(async tx => {
      const context = await enrollment(tx, data.studentId);
      const role = authorize(caller, context, true);
      if (data.review !== null && role !== "teacher") throw denied();
      const ref = context.rootRef.collection("worksheetResults").doc(data.worksheet.instanceId);
      const existing = (await tx.get(ref)).data();
      const update = syncWorksheetRevision(existing, data, profileSummary(context.student), caller.uid, now);
      if (update.write) tx.set(ref, update.write);
      if (update.award) writeSummary(tx, context, update.result.profile);
      return update.result;
    });
  } catch (error) {
    if (error instanceof InvalidOperation) throw new HttpsError("failed-precondition", error.message);
    throw error;
  }
});

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { createRequire } = require("node:module");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  initializeAuth, inMemoryPersistence, connectAuthEmulator, createUserWithEmailAndPassword,
  signInWithCustomToken, signInWithEmailAndPassword, signOut,
} = require("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, collection, getDocFromServer, getDocsFromServer, setDoc,
  updateDoc, writeBatch, query, where, serverTimestamp } = require("firebase/firestore");
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require("firebase/functions");
const { readingQuizzes } = require("../backend/functions/curriculum/data/readingQuizzes");
const { createWorksheet } = require("../backend/functions/curriculum/data/phygitalWorksheets");
const { loader, sqlite, root } = require("./runtime.cjs");
const { quizProof, traceProof } = require("./cloud-fixture.cjs");
const path = require("node:path");
const requireFunctions = createRequire(require.resolve("../backend/functions/package.json"));

const projectId = "demo-lumikids";
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.GCLOUD_PROJECT !== projectId) {
  throw new Error("Run this suite through Firebase emulators:exec with project demo-lumikids.");
}
const [firestoreHost, firestorePort] = process.env.FIRESTORE_EMULATOR_HOST.split(":");

function client(name) {
  const app = initializeApp({ projectId, apiKey: "demo-api-key", authDomain: projectId + ".firebaseapp.com" }, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, "http://" + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreHost, Number(firestorePort));
  const functions = getFunctions(app);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  return { app, auth, db, functions, call: async (fn, data) => (await httpsCallable(functions, fn)(data)).data };
}

async function teacherAccount(client, suffix, code, learner, name) {
  const email = suffix + "@example.test";
  const { user } = await createUserWithEmailAndPassword(client.auth, email, "emulator-only-demo");
  const teacherId = user.uid;
  await setDoc(doc(client.db, "teachers", teacherId), { id: teacherId, name: suffix, email, createdAt: serverTimestamp() });
  await setDoc(doc(client.db, "classes", code), {
    code, teacherId, teacherName: suffix, name: suffix + " classroom", createdAt: serverTimestamp(),
  });
  await addLearner(client, teacherId, code, learner, name);
  return teacherId;
}

async function addLearner(client, teacherId, code, learner, name) {
  const data = {
    id: learner, classCode: code, teacherId, fullName: name + " Learner", name, preferredName: name,
    preferredNameLower: name.toLowerCase(), xp: 0, coins: 0, level: 1, streak: 0,
    readingXP: 0, writingXP: 0, mathXP: 0, avatar: "default", createdAt: serverTimestamp(),
  };
  const batch = writeBatch(client.db);
  batch.set(doc(client.db, "students", learner), data);
  batch.set(doc(client.db, "classes", code, "students", learner), data);
  await batch.commit();
}

async function login(client, name, classCode) {
  const result = await client.call("loginStudent", { name, classCode });
  assert.deepEqual(Object.keys(result).sort(), ["studentId", "token"]);
  return { result, credential: await signInWithCustomToken(client.auth, result.token) };
}

test("Firestore, Auth and callable Functions use the same demo authorization boundary", async t => {
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { host: firestoreHost, port: Number(firestorePort), rules: readFileSync("firestore.rules", "utf8") },
  });
  const a = client("teacher-a"), b = client("teacher-b"), student = client("student"), guest = client("guest");
  t.after(async () => {
    await Promise.all([a, b, student, guest].map(item => deleteApp(item.app)));
    await env.cleanup();
  });

  const teacherA = await teacherAccount(a, "teacher-a", "ROOMA2", "learner-a", "Ari");
  await teacherAccount(b, "teacher-b", "ROOMB2", "learner-b", "Ari");
  let quiz, worksheet, capture, review;

  await t.test("unsigned users and forged login fields are denied uniformly", async () => {
    await assertFails(getDocFromServer(doc(guest.db, "students/learner-a")));
    await assertFails(getDocFromServer(doc(guest.db, "classes/ROOMA2")));
    for (const data of [
      { name: "Unknown", classCode: "ROOMA2" },
      { name: "Ari", classCode: "OTHER2" },
      { name: "Ari", classCode: "ROOMA2", studentId: "learner-b" },
    ]) {
      await assert.rejects(guest.call("loginStudent", data), {
        code: "functions/permission-denied", message: "We could not verify your name and classroom code.",
      });
    }
    await assert.rejects(guest.call("syncStudentLearning", { studentId: "learner-a", operations: [] }),
      { code: "functions/unauthenticated" });
  });

  await t.test("registration, assigned classroom, roster and student reads preserve teacher access", async () => {
    await assertSucceeds(getDocFromServer(doc(a.db, "classes/ROOMA2")));
    const classes = await getDocsFromServer(query(collection(a.db, "classes"), where("teacherId", "==", teacherA)));
    assert.deepEqual(classes.docs.map(item => item.id), ["ROOMA2"]);
    await assertSucceeds(getDocsFromServer(query(collection(a.db, "classes/ROOMA2/students"), where("teacherId", "==", teacherA))));
    await assertSucceeds(getDocFromServer(doc(a.db, "students/learner-a")));
    await assertFails(getDocFromServer(doc(a.db, "classes/ROOMB2")));
    await assertFails(getDocFromServer(doc(a.db, "students/learner-b")));
    await assertFails(updateDoc(doc(a.db, "classes/ROOMB2"), { teacherId: teacherA }));
    await assertFails(updateDoc(doc(a.db, "students/learner-b"), { xp: 100 }));
    await assertFails(updateDoc(doc(a.db, "students/learner-a"), { xp: 100 }));
    const forged = { ...(await getDocFromServer(doc(a.db, "students/learner-a"))).data(),
      id: "forged-learner", xp: 500, createdAt: serverTimestamp() };
    const batch = writeBatch(a.db);
    batch.set(doc(a.db, "students/forged-learner"), forged);
    batch.set(doc(a.db, "classes/ROOMA2/students/forged-learner"), forged);
    await assertFails(batch.commit());
  });

  await t.test("custom-token enrollment grants only the exact student profile", async () => {
    const { result, credential } = await login(student, "  aRI  ", " rooma2 ");
    assert.equal(result.studentId, "learner-a");
    const { claims } = await credential.user.getIdTokenResult(true);
    assert.equal(claims.studentId, "learner-a");
    assert.equal(claims.role, "student");
    await assertSucceeds(getDocFromServer(doc(student.db, "students/learner-a")));
    await assertFails(getDocFromServer(doc(student.db, "students/learner-b")));
    await assertFails(getDocsFromServer(collection(student.db, "classes/ROOMA2/students")));
    await assertFails(getDocFromServer(doc(student.db, "classes/ROOMB2")));
    await assertFails(updateDoc(doc(student.db, "students/learner-b"), { xp: 500 }));
    await assertFails(updateDoc(doc(student.db, "students/learner-a"), { coins: 100, classCode: "ROOMB2" }));
    await assertFails(setDoc(doc(student.db, "students/learner-a/syncReceipts/fake"), { digest: "fake" }));
    await assertFails(setDoc(doc(student.db, "teachers/" + credential.user.uid), { id: credential.user.uid }));
  });

  await t.test("password authentication cannot grant the teacher role to a reserved student UID", async t => {
    const reserved = client("reserved-password");
    const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireFunctions("firebase-admin/app");
    const { getAuth: adminAuth } = requireFunctions("firebase-admin/auth");
    const admin = initializeAdmin({ projectId }, "role-test");
    const uid = "student:reserved";
    const email = "reserved@example.test";
    const password = "test-reserved-password";
    t.after(async () => { await deleteApp(reserved.app); await deleteAdmin(admin); });
    await adminAuth(admin).createUser({ uid, email, password });
    await signInWithEmailAndPassword(reserved.auth, email, password);
    assert.equal((await reserved.auth.currentUser.getIdTokenResult()).signInProvider, "password");
    const marker = { id: uid, name: "Reserved", email };
    await assertFails(setDoc(doc(reserved.db, "teachers", uid), { ...marker, createdAt: serverTimestamp() }));
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const record = { id: "role-test-learner", name: "Learner", classCode: "ROLEA2", teacherId: uid };
      await setDoc(doc(db, "teachers", uid), marker);
      await setDoc(doc(db, "classes", "ROLEA2"), { code: "ROLEA2", teacherId: uid });
      await setDoc(doc(db, "students", record.id), record);
    });
    await assertFails(getDocFromServer(doc(reserved.db, "classes", "ROLEA2")));
    await assertFails(getDocFromServer(doc(reserved.db, "students", "role-test-learner")));
    const claimedStudent = env.authenticatedContext(teacherA, { role: "student", firebase: { sign_in_provider: "password" } });
    await assertFails(getDocFromServer(doc(claimedStudent.firestore(), "classes", "ROOMA2")));
    const proposed = JSON.parse(JSON.stringify({ ...createWorksheet("math", 1), studentId: "role-test-learner",
      instanceId: "11554433-1234-1234-1234-123456789012", templateVersion: 2 }));
    await assert.rejects(reserved.call("syncWorksheet", { studentId: "role-test-learner", worksheet: proposed, capture: null, review: null }),
      { code: "functions/permission-denied" });
  });

  await t.test("student sync rejects mismatched identity and unverified values, then computes and acknowledges real attempts", async () => {
    const valid = { type: "quiz", subject: "reading", lessonId: "A", answers: readingQuizzes.A.map(question => question.answer) };
    quiz = { id: "ab".repeat(16) + "-1", operation: valid };
    await assert.rejects(student.call("syncStudentLearning", { studentId: "learner-b", operations: [quiz] }),
      { code: "functions/permission-denied" });
    await assert.rejects(student.call("syncStudentLearning", { studentId: "learner-a", classCode: "ROOMB2", operations: [quiz] }),
      { code: "functions/permission-denied" });
    const forged = await student.call("syncStudentLearning", {
      studentId: "learner-a", operations: [
        { ...quiz, operation: { ...valid, score: 100, xp: 999, receipts: { first: 30 } } },
        { id: "ab".repeat(16) + "-2", operation: { type: "purchase", mascotId: "lion" } },
      ],
    });
    assert.deepEqual(forged.accepted, []);
    assert.deepEqual(forged.rejected, [{ id: quiz.id, reason: "invalid-operation" },
      { id: "ab".repeat(16) + "-2", reason: "dependency" }]);
    assert.equal(forged.profile.coins, 0);
    const first = await student.call("syncStudentLearning", { studentId: "learner-a", operations: [quiz] });
    assert.deepEqual(first.accepted, [quiz.id]);
    assert.equal(first.profile.readingProgress.A.quizScore, 4);
    assert.equal(first.profile.readingProgress.B.unlocked, true);
    assert.equal(first.profile.xp, 25);
    const replay = await student.call("syncStudentLearning", { studentId: "learner-a", operations: [quiz] });
    assert.deepEqual(replay.accepted, [quiz.id]);
    assert.equal(replay.profile.xp, 25);
    assert.equal(replay.profile.profileRevision, first.profile.profileRevision);
    const conflict = await student.call("syncStudentLearning", { studentId: "learner-a", operations: [
      { ...quiz, operation: { type: "equip", mascotId: "default" } },
    ] });
    assert.deepEqual(conflict.rejected, [{ id: quiz.id, reason: "receipt-conflict" }]);
    assert.equal(conflict.profile.profileRevision, first.profile.profileRevision);
    const mirrored = (await getDocFromServer(doc(a.db, "classes/ROOMA2/students/learner-a"))).data();
    assert.equal(mirrored.xp, 25);
    assert.equal(mirrored.readingProgress.A.completed, true);
  });

  await t.test("malformed, oversized and disproportionate traces are rejected before progress is awarded", async () => {
    const operations = [
      trace => Object.assign(trace, { width: 4096, height: 1 }),
      trace => Object.assign(trace, { width: 1, height: 4096 }),
      trace => { trace.strokes[0][0] = { x: "1", y: 0 }; },
      trace => { trace.strokes[0] = Array(4001).fill(trace.strokes[0][0]); },
    ].map((mutate, i) => {
      const operation = traceProof("A");
      mutate(operation.phases[0][0]);
      return { id: "cd".repeat(16) + "-" + (i + 1), operation };
    });
    const rejected = await student.call("syncStudentLearning", { studentId: "learner-a", operations });
    assert.deepEqual(rejected.rejected, operations.map(({ id }) => ({ id, reason: "invalid-operation" })));
    assert.deepEqual(rejected.accepted, []);
    assert.equal(rejected.profile.writingXP, 0);
  });

  await t.test("only the assigned teacher finalizes a worksheet and the server derives a stable result", async () => {
    const instanceId = "12345678-1234-1234-1234-123456789012";
    worksheet = JSON.parse(JSON.stringify({
      ...createWorksheet("math", 1), instanceId, studentId: "learner-a", templateVersion: 2,
    }));
    capture = {
      worksheetInstanceId: instanceId, validated: true, answers: worksheet.questions.map(question => question.correctAnswer),
      confidence: Array(5).fill(1), statuses: Array(5).fill("recognized"),
      darkness: Array.from({ length: 5 }, () => [1, 0, 0]), imageWidth: 900, imageHeight: 1200,
      quality: { paperBrightness: 210, edgeSharpness: 100 }, capturedAt: new Date().toISOString(),
    };
    review = { answers: capture.answers, writing: [], finalizedAt: new Date().toISOString() };
    const data = { studentId: "learner-a", worksheet, capture, review };
    await student.call("syncWorksheet", { ...data, review: null });
    await assert.rejects(student.call("syncWorksheet", data), { code: "functions/permission-denied" });
    await assert.rejects(b.call("syncWorksheet", data), { code: "functions/permission-denied" });
    await assertFails(updateDoc(doc(student.db, "students/learner-a/worksheetResults/" + instanceId), { finalized: { score: 5 } }));
    const result = await a.call("syncWorksheet", data);
    assert.equal(result.finalized.teacherId, teacherA);
    assert.equal(result.finalized.score, 5);
    assert.equal(result.profile.mathXP, 50);
    const replay = await a.call("syncWorksheet", data);
    assert.deepEqual(replay.finalized, result.finalized);
    assert.equal(replay.profile.xp, result.profile.xp);
    await assert.rejects(a.call("syncWorksheet", { ...data, review: { ...review, answers: Array(5).fill(null) } }),
      { code: "functions/failed-precondition" });
    assert.equal((await getDocsFromServer(collection(student.db, "students/learner-a/worksheetResults"))).size, 1);

    const tracingId = "87654321-1234-1234-1234-123456789012";
    const tracing = JSON.parse(JSON.stringify({
      ...createWorksheet("writing", "A"), instanceId: tracingId, studentId: "learner-a", templateVersion: 2,
    }));
    const writing = await a.call("syncWorksheet", {
      studentId: "learner-a", worksheet: tracing,
      capture: { ...capture, worksheetInstanceId: tracingId, answers: [], confidence: [], statuses: [], darkness: [] },
      review: { answers: [], writing: Array(5).fill(true), finalizedAt: review.finalizedAt },
    });
    assert.equal(writing.finalized.score, 5);
    assert.equal(writing.profile.writingProgress.A.completed, true);
  });

  await t.test("worksheet ordering accepts offline work and replacements without trusting future timestamps", async () => {
    const now = Date.now();
    const day = 86_400_000;
    const at = offset => new Date(now + offset).toISOString();
    const instanceId = "55667788-1234-1234-1234-123456789012";
    const offlineSheet = JSON.parse(JSON.stringify({ ...createWorksheet("math", 1), instanceId, studentId: "learner-a",
      templateVersion: 2, createdAt: at(-8 * day) }));
    const offlineCapture = { ...capture, worksheetInstanceId: instanceId, capturedAt: at(-7 * day) };
    const draft = { studentId: "learner-a", worksheet: offlineSheet, capture: offlineCapture, review: null };
    const call = (caller, overrides) => caller.call("syncWorksheet", { ...draft, ...overrides });
    const fail = { code: "functions/failed-precondition" };
    await assert.rejects(call(student, { worksheet: { ...offlineSheet, createdAt: at(day) } }), fail);
    await assert.rejects(call(student, { capture: { ...offlineCapture, capturedAt: at(day) } }), fail);
    await call(student);
    const record = doc(a.db, "students", "learner-a", "worksheetResults", instanceId);
    assert.equal((await getDocFromServer(record)).data().capture.capturedAt, at(-7 * day));

    const replacement = { ...offlineCapture, capturedAt: at(-6 * day) };
    await call(student, { capture: replacement });
    await call(student);
    assert.equal((await getDocFromServer(record)).data().capture.capturedAt, at(-6 * day));
    const finalReview = { answers: replacement.answers, writing: [], finalizedAt: at(-5 * day) };
    await assert.rejects(call(a, { review: finalReview }), fail);
    await assert.rejects(call(a, { capture: replacement, review: { ...finalReview, finalizedAt: at(day) } }), fail);
    await assert.rejects(call(b, { capture: replacement, review: finalReview }), { code: "functions/permission-denied" });

    // A pre-upgrade draft with a future timestamp must not block a legitimate review.
    await env.withSecurityRulesDisabled(context => updateDoc(
      doc(context.firestore(), "students", "learner-a", "worksheetResults", instanceId), { "capture.capturedAt": at(day) },
    ));
    const finalized = await call(a, { capture: replacement, review: finalReview });
    assert.equal(finalized.finalized.score, 5);
    assert.equal(finalized.finalized.teacherId, teacherA);
    assert.equal((await getDocFromServer(record)).data().capture.capturedAt, replacement.capturedAt);
    await call(student, { capture: { ...replacement, capturedAt: at(-4 * day) } });
    assert.deepEqual((await getDocFromServer(record)).data().finalized, finalized.finalized);
  });

  await t.test("revocation and account switching prevent stale cloud access", async () => {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "studentAccess/learner-a"), { enabled: false, version: 1 });
    });
    await assertFails(getDocFromServer(doc(student.db, "students/learner-a")));
    await assert.rejects(student.call("syncStudentLearning", { studentId: "learner-a", operations: [quiz] }),
      { code: "functions/permission-denied" });
    await signOut(student.auth);
    const { result } = await login(student, "Ari", "ROOMB2");
    assert.equal(result.studentId, "learner-b");
    await assertFails(getDocFromServer(doc(student.db, "students/learner-a")));
    await assertSucceeds(getDocFromServer(doc(student.db, "students/learner-b")));
  });

  await t.test("the app keeps SQLite work after denied sync and uploads it after a cold restart and reauthentication", async t => {
    const storage = sqlite();
    const saved = new Map();
    const first = client("mobile-first"), reopened = client("mobile-reopened");
    t.after(async () => {
      storage.raw.close();
      await Promise.all([deleteApp(first.app), deleteApp(reopened.app)]);
    });
    function mobile(firebase) {
      const load = loader({
        "expo-sqlite": { openDatabaseSync: () => storage.db },
        [path.join(root, "src/services/firebase/firebase.ts")]: firebase,
        "@react-native-async-storage/async-storage": {
          getItem: async key => saved.get(key) ?? null,
          setItem: async (key, value) => { saved.set(key, value); },
          removeItem: async key => { saved.delete(key); },
        },
      });
      const svc = name => load("src/services/" + name + ".ts");
      svc("database/database").initializeDatabase();
      return { svc, login: svc("student/studentLogin"), sessions: svc("session/session"), queue: svc("sync/processQueue") };
    }
    const old = mobile(first);
    await old.login.loginStudent("Ari", "ROOMB2", true);
    assert.equal(JSON.parse(saved.get("studentSession")).classCode, undefined);
    old.svc("database/localProgress").saveReadingAssessment("learner-b", "A", 4, 4, false, quizProof("reading", "A"));
    old.svc("database/localWriting").completeWritingLesson("learner-b", "A", 3, false, traceProof("A"));
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "studentAccess/learner-b"), { enabled: false, version: 1 });
    });
    await old.queue.processQueue(old.login.canSyncStudentSession);
    assert.equal(first.auth.currentUser, null);
    assert.equal(old.svc("database/localStudent").getLocalStudent("learner-b").xp, 50);
    assert.ok(old.svc("sync/localQueue").getPendingQueue().length > 0);

    const current = mobile(reopened);
    assert.equal(reopened.auth.currentUser, null);
    assert.equal((await current.sessions.restoreRememberedSession()).studentId, "learner-b");
    assert.equal(current.login.canSyncStudentSession("learner-b"), false);
    await assert.rejects(current.login.loginStudent("Ari", "ROOMB2", true), /could not verify/);
    assert.deepEqual(await current.sessions.getSession(), { studentId: "learner-b" });
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "studentAccess/learner-b"), { enabled: true, version: 2 });
    });
    await current.login.loginStudent("Ari", "ROOMB2", true);
    await current.queue.processQueue(current.login.canSyncStudentSession);
    const result = (await getDocFromServer(doc(reopened.db, "students/learner-b"))).data();
    assert.equal(result.readingProgress.A.completed, true);
    assert.equal(result.writingProgress.A.completed, true);
    assert.equal(result.xp, 50);
    assert.equal(current.svc("sync/localQueue").getPendingQueue().length, 0);
    await current.login.logoutStudent();
    assert.equal(reopened.auth.currentUser, null);
    assert.equal(await current.sessions.getSession(), null);
    assert.equal(saved.has("studentSession"), false);
  });

  await t.test("shared-IP classmates have independent issuance budgets and unknown codes share a bounded guessing budget", async () => {
    for (const name of ["Tess", "Rae", "Lou"]) await addLearner(a, teacherA, "ROOMA2", name.toLowerCase(), name);
    const denial = { code: "functions/permission-denied", message: "We could not verify your name and classroom code." };
    const submit = (caller, name, classCode = "ROOMA2") => caller.call("loginStudent", { name, classCode });
    const sharedSource = [guest, student, b];
    for (let i = 0; i < 12; i++) assert.equal((await submit(sharedSource[i % 3], "Tess")).studentId, "tess");
    await assert.rejects(submit(b, "Tess"), denial);
    for (let i = 0; i < 9; i++) {
      assert.equal((await submit(guest, "Rae")).studentId, "rae");
      assert.equal((await submit(student, "Lou")).studentId, "lou");
    }
    async function buckets() {
      const result = new Map();
      await env.withSecurityRulesDisabled(async context => {
        const snapshot = await getDocsFromServer(collection(context.firestore(), "loginLimits"));
        for (const item of snapshot.docs) result.set(item.id, item.data());
      });
      return result;
    }
    const before = await buckets();
    for (const code of ["UNKNOWN1", "UNKNOWN2", "UNKNOWN3"]) await assert.rejects(submit(guest, "Tess", code), denial);
    const after = await buckets();
    const changed = [...after].filter(([id, value]) => before.get(id)?.count !== value.count);
    assert.equal(changed.length, 1);
    assert.ok(after.size <= before.size + 1);
    const [ipBucket, value] = changed[0];
    assert.equal(value.count, (before.get(ipBucket)?.window === value.window ? before.get(ipBucket).count : 0) + 3);
    for (let i = 0; i < 15; i++) await assert.rejects(submit(sharedSource[i % 3], "Tess", "UNKNOWN2"), denial);
    const saturated = (await buckets()).get(ipBucket);
    assert.equal(saturated.count, value.count + 9);
    assert.equal((await submit(b, "Rae")).studentId, "rae");
    await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), "loginLimits", ipBucket), { count: 119 }));
    await assert.rejects(submit(student, "Unknown"), denial);
    assert.equal((await buckets()).get(ipBucket).count, 120);
    await assert.rejects(submit(b, "Rae"), denial);
  });
});

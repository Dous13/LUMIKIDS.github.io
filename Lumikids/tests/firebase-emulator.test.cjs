const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { once } = require("node:events");
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
const { canonicalJson } = require("../backend/functions/curriculum/services/phygital/worksheetLayout");
const { loader, sqlite, root } = require("./runtime.cjs");
const { quizProof, traceProof } = require("./cloud-fixture.cjs");
const { loginSource, EMULATOR_SOURCE_HEADER } = require("../backend/functions/loginSource.cjs");
const path = require("node:path");
const { addLearner, createClassroom, createTeacherProfile } = require("../scripts/firebase-emulator-fixtures.cjs");
const requireFunctions = createRequire(require.resolve("../backend/functions/package.json"));

const projectId = "demo-lumikids";
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.GCLOUD_PROJECT !== projectId) {
  throw new Error("Run this suite through Firebase emulators:exec with project demo-lumikids.");
}
const [firestoreHost, firestorePort] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
const standalone = process.env.LUMIKIDS_STANDALONE_TEST === "1";
let standaloneOrigin;

if (standalone) {
  test("standalone configuration keeps live Firebase and emulator settings separate", () => {
    const { readConfig } = require("../backend/functions/server.cjs");
    const demo = { LUMIKIDS_BACKEND_MODE: "emulator" }, live = { LUMIKIDS_BACKEND_MODE: "live" };
    assert.equal(readConfig(demo).projectId, "demo-lumikids");
    assert.equal(readConfig(live).projectId, "lumikids-a94d8");
    assert.throws(() => readConfig({}), /LUMIKIDS_BACKEND_MODE/);
    assert.throws(() => readConfig({ ...demo, GCLOUD_PROJECT: "lumikids-a94d8" }), /does not match/);
    assert.throws(() => readConfig({ ...demo, FIRESTORE_EMULATOR_HOST: "example.test:8080" }), /127\.0\.0\.1/);
    assert.throws(() => readConfig({ ...demo, GOOGLE_APPLICATION_CREDENTIALS: "configured" }), /credentials/);
    assert.throws(() => readConfig({ ...demo, LOGIN_TRUSTED_SOURCE_HEADER: "1" }), /trusted ingress/);
    assert.throws(() => readConfig({ ...live, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" }), /emulator settings/);
    assert.throws(() => readConfig({ ...live, FIREBASE_DEBUG_FEATURES: "{}" }), /debug flags/);
    assert.throws(() => readConfig({ ...live, LUMIKIDS_ALLOWED_ORIGINS: "*" }), /exact HTTPS origins/);
    const key = { LUMIKIDS_SERVICE_ACCOUNT_KEY_PATH: "server-only.json" };
    const tls = { LUMIKIDS_BACKEND_TLS_CERT_PATH: "server.crt", LUMIKIDS_BACKEND_TLS_KEY_PATH: "server.key" };
    const lan = { LUMIKIDS_BACKEND_HOST: "192.0.2.10" };
    assert.equal(readConfig(demo).host, "127.0.0.1");
    assert.equal(readConfig({ ...live, ...lan, ...tls, ...key }).host, "192.0.2.10");
    assert.throws(() => readConfig({ ...live, ...lan }), /direct HTTPS/);
    assert.throws(() => readConfig({ ...demo, ...lan, ...tls }), /loopback/);
    assert.throws(() => readConfig({ ...live, LUMIKIDS_BACKEND_TLS_KEY_PATH: "server.key" }), /both TLS files/);
    assert.throws(() => readConfig({ ...live, ...tls, LOGIN_TRUSTED_SOURCE_HEADER: "1" }), /socket peer/);
    assert.throws(() => readConfig({ ...demo, ...key }), /credentials/);
    assert.throws(() => readConfig({ ...live, ...key, GOOGLE_APPLICATION_CREDENTIALS: "adc.json" }), /Choose a service-account key/);
  });

  test("app Firebase configuration selects the Functions emulator or the configured standalone origin", t => {
    const emulatorKey = "EXPO_PUBLIC_FIREBASE_EMULATOR_HOST", backendKey = "EXPO_PUBLIC_LUMIKIDS_BACKEND_URL";
    const previous = [process.env[emulatorKey], process.env[backendKey], global.__DEV__];
    const set = (key, value) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    t.after(() => {
      set(emulatorKey, previous[0]);
      set(backendKey, previous[1]);
      if (previous[2] === undefined) delete global.__DEV__;
      else global.__DEV__ = previous[2];
    });
    const configure = (dev, emulator, backend) => {
      global.__DEV__ = dev;
      set(emulatorKey, emulator);
      set(backendKey, backend);
      const calls = [];
      const load = loader({
        "firebase/app": { initializeApp: config => config },
        "firebase/auth": { initializeAuth: () => ({}), connectAuthEmulator: (_, ...args) => calls.push(["auth", args[0]]) },
        "firebase/firestore": { getFirestore: () => ({}), connectFirestoreEmulator: (_, ...args) => calls.push(["firestore", ...args]) },
        "firebase/functions": {
          getFunctions: (app, origin) => ({ project: app.projectId, origin }),
          connectFunctionsEmulator: (_, ...args) => calls.push(["functions", ...args]),
        },
        "@react-native-async-storage/async-storage": {},
      });
      const { functions } = load("src/services/firebase/firebase.ts");
      return { ...functions, calls };
    };
    const local = "10.0.2.2", http = "http://10.0.2.2:5002", https = "https://backend.example.test";
    const demoServices = [["auth", "http://10.0.2.2:9099"], ["firestore", local, 8080]];
    assert.deepEqual(configure(true, local, undefined),
      { project: "demo-lumikids", origin: undefined, calls: [...demoServices, ["functions", local, 5001]] });
    assert.deepEqual(configure(true, local, http), { project: "demo-lumikids", origin: http, calls: demoServices });
    assert.deepEqual(configure(false, undefined, https), { project: "lumikids-a94d8", origin: https, calls: [] });
    const localHttps = "https://10.0.2.2:5002";
    assert.deepEqual(configure(true, undefined, localHttps), { project: "lumikids-a94d8", origin: localHttps, calls: [] });
    assert.throws(() => configure(false, undefined, localHttps), /matching local HTTP backend/);
    assert.throws(() => configure(true, undefined, http), /matching local HTTP backend/);
    assert.throws(() => configure(false, local, http), /matching local HTTP backend/);
    assert.throws(() => configure(true, local, https), /matching local HTTP backend/);
    assert.throws(() => configure(true, local, "http://127.0.0.1:5002"), /matching local HTTP backend/);
    assert.throws(() => configure(false, undefined, https + "/loginStudent"), /matching local HTTP backend/);
  });
}

test("source simulation is restricted to the loopback demo emulator", () => {
  const peer = "192.0.2.10", simulated = "198.51.100.20", ingress = "203.0.113.30";
  const headers = { [EMULATOR_SOURCE_HEADER]: simulated, "x-forwarded-for": simulated,
    "x-real-ip": simulated, "x-lumikids-client-ip": ingress };
  const request = { headers, socket: { remoteAddress: "::ffff:" + peer } };
  const pipeRequest = { headers, socket: {} };
  const demo = { GCLOUD_PROJECT: projectId, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" };

  assert.equal(loginSource(request, {}), peer);
  assert.equal(loginSource(request, { ...demo, FUNCTIONS_EMULATOR: "false" }), peer);
  assert.equal(loginSource(pipeRequest, demo), null);
  const deployed = { LOGIN_TRUSTED_SOURCE_HEADER: "1" };
  assert.equal(loginSource(request, deployed), ingress);
  for (const invalid of [undefined, "not-an-ip", `${ingress}, ${simulated}`, [ingress, simulated]]) {
    assert.equal(loginSource({ ...request, headers: { ...headers, "x-lumikids-client-ip": invalid } }, deployed), null);
  }

  const emulated = { ...demo, FUNCTIONS_EMULATOR: "true" };
  assert.equal(loginSource({ ...pipeRequest, headers: {} }, emulated), "127.0.0.1");
  assert.equal(loginSource({ ...request, headers: { "x-forwarded-for": simulated } }, emulated), peer);
  assert.equal(loginSource(pipeRequest, emulated), simulated);
  assert.equal(loginSource(pipeRequest, { ...emulated, GCLOUD_PROJECT: "another-project" }), "127.0.0.1");
  assert.equal(loginSource(pipeRequest, { ...emulated, FIRESTORE_EMULATOR_HOST: "192.0.2.20:8080" }), "127.0.0.1");
});

async function loginFromTestSource(name, classCode, source) {
  const response = await fetch(`http://127.0.0.1:5001/${projectId}/us-central1/loginStudent`, {
    method: "POST",
    headers: { "content-type": "application/json", [EMULATOR_SOURCE_HEADER]: source },
    body: JSON.stringify({ data: { name, classCode } }),
  });
  return { status: response.status, body: await response.json() };
}

function client(name) {
  const app = initializeApp({ projectId, apiKey: "demo-api-key", authDomain: projectId + ".firebaseapp.com" }, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, "http://" + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreHost, Number(firestorePort));
  const functions = getFunctions(app, standaloneOrigin);
  if (!standaloneOrigin) connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  return { app, auth, db, functions, call: async (fn, data) => (await httpsCallable(functions, fn)(data)).data };
}

async function teacherAccount(client, suffix, code, learner, name) {
  const email = suffix + "@example.test";
  const { user } = await createUserWithEmailAndPassword(client.auth, email, "emulator-only-demo");
  const teacherId = user.uid;
  await createTeacherProfile(client.db, teacherId, suffix, email);
  await createClassroom(client.db, teacherId, suffix, code);
  await addLearner(client, teacherId, code, learner, name);
  return teacherId;
}

async function login(client, name, classCode) {
  const result = await client.call("loginStudent", { name, classCode });
  assert.deepEqual(Object.keys(result).sort(), ["studentId", "token"]);
  return { result, credential: await signInWithCustomToken(client.auth, result.token) };
}

function mobileRuntime(firebase, storage, saved) {
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

test("Firestore, Auth and callable Functions use the same demo authorization boundary", async t => {
  if (standalone) {
    const { startStandalone } = require("../backend/functions/server.cjs");
    const server = startStandalone();
    await once(server, "listening");
    t.after(() => new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    }));
    assert.equal(server.address().address, "127.0.0.1");
    standaloneOrigin = "http://127.0.0.1:" + server.address().port;
  }
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { host: firestoreHost, port: Number(firestorePort), rules: readFileSync(path.join(root, "firestore.rules"), "utf8") },
  });
  const a = client("teacher-a"), b = client("teacher-b"), student = client("student"), guest = client("guest");
  t.after(async () => {
    await Promise.all([a, b, student, guest].map(item => deleteApp(item.app)));
    await env.cleanup();
  });

  const teacherA = await teacherAccount(a, "teacher-a", "ROOMA2", "learner-a", "Ari");
  await teacherAccount(b, "teacher-b", "ROOMB2", "learner-b", "Ari");
  let quiz, worksheet, capture, review;

  if (standalone) {
    await t.test("standalone HTTP boundary enforces routes, callable errors, preflight, and body limits", async () => {
      const request = (route, options) => fetch(standaloneOrigin + route, options);
      const post = (body, headers = {}) => ({
        method: "POST", headers: { "content-type": "application/json", ...headers }, body,
      });
      const expectError = async (response, httpStatus, status) => {
        assert.equal(response.status, httpStatus);
        assert.equal((await response.json()).error.status, status);
      };
      const health = await request("/healthz");
      assert.equal(health.status, 200);
      assert.match(health.headers.get("content-type"), /^text\/plain\b/);
      assert.equal(health.headers.get("cache-control"), "no-store");
      assert.equal(await health.text(), "ok");
      const healthHead = await request("/healthz", { method: "HEAD" });
      assert.equal(healthHead.status, 200);
      assert.equal(await healthHead.text(), "");
      await expectError(await request("/healthz", post('{"data":{}}')), 404, "NOT_FOUND");
      await expectError(await request("/other", post('{"data":{}}')), 404, "NOT_FOUND");
      await expectError(await request("/loginStudent"), 405, "INVALID_ARGUMENT");
      await expectError(await request("/loginStudent", post('{"data":')), 400, "INVALID_ARGUMENT");
      await expectError(await request("/loginStudent", post('{"data":{},"extra":1}')), 400, "INVALID_ARGUMENT");
      await expectError(await request("/loginStudent", post(JSON.stringify({ data: "x".repeat(1_600_001) }))),
        413, "RESOURCE_EXHAUSTED");
      await expectError(await request("/loginStudent", post('{"data":{}}', { "content-encoding": "gzip" })),
        415, "INVALID_ARGUMENT");
      for (const route of ["/syncStudentLearning", "/syncWorksheet"]) {
        await expectError(await request(route, post('{"data":{}}')), 401, "UNAUTHENTICATED");
        await expectError(await request(route, post('{"data":{}}', { authorization: "Bearer invalid" })), 401, "UNAUTHENTICATED");
      }
      const preflight = (origin) => request("/loginStudent", {
        method: "OPTIONS", headers: {
          origin, "access-control-request-method": "POST", "access-control-request-headers": "content-type,authorization",
        },
      });
      const allowed = await preflight("http://localhost:8081");
      assert.equal(allowed.status, 204);
      assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:8081");
      assert.match(allowed.headers.get("access-control-allow-methods"), /POST/);
      const denied = await preflight("https://another.example");
      assert.equal(denied.headers.get("access-control-allow-origin"), null);
      await expectError(denied, 403, "PERMISSION_DENIED");
      await expectError(await request("/loginStudent", post('{"data":{}}', { origin: "https://another.example" })),
        403, "PERMISSION_DENIED");
    });

    await t.test("Mira and Leo keep separate Auth identities, SQLite progress, and cloud rewards", async t => {
      const classroom = "LUMI26";
      const teacher = client("standalone-teacher");
      t.after(() => deleteApp(teacher.app));
      const teacherId = await teacherAccount(teacher, "standalone-teacher", classroom, "standalone-mira", "Mira");
      await addLearner(teacher, teacherId, classroom, "standalone-leo", "Leo");
      const transport = client("standalone-mobile"), storage = sqlite();
      t.after(async () => {
        storage.raw.close();
        await deleteApp(transport.app);
      });
      const mobile = mobileRuntime(transport, storage, new Map());
      const local = id => mobile.svc("database/localStudent").getLocalStudent(id);
      const profile = async id => (await getDocFromServer(doc(transport.db, "students", id))).data();

      await mobile.login.loginStudent("Mira", classroom, true);
      assert.equal(transport.auth.currentUser.uid, "student:standalone-mira");
      mobile.svc("database/localProgress").saveReadingAssessment("standalone-mira", "A", 4, 4, false, quizProof("reading", "A"));
      await mobile.queue.processQueue(mobile.login.canSyncStudentSession);
      const mira = await profile("standalone-mira");
      assert.deepEqual([mira.xp, mira.coins], [25, 15]);
      await assertFails(getDocFromServer(doc(transport.db, "students/standalone-leo")));

      await mobile.login.logoutStudent();
      await mobile.login.loginStudent("Leo", classroom, true);
      assert.equal(transport.auth.currentUser.uid, "student:standalone-leo");
      assert.deepEqual(await mobile.sessions.getSession(), { studentId: "standalone-leo" });
      assert.deepEqual([local("standalone-leo").name, local("standalone-leo").xp, local("standalone-leo").coins], ["Leo", 0, 0]);
      const leo = await profile("standalone-leo");
      assert.deepEqual([leo.xp, leo.coins], [0, 0]);
      await assertFails(getDocFromServer(doc(transport.db, "students/standalone-mira")));
      await mobile.login.logoutStudent();

      await mobile.login.loginStudent("Mira", classroom, true);
      assert.deepEqual(await mobile.sessions.getSession(), { studentId: "standalone-mira" });
      assert.deepEqual([local("standalone-mira").name, local("standalone-mira").xp, local("standalone-mira").coins], ["Mira", 25, 15]);
      await mobile.login.logoutStudent();
    });
  }

  await t.test("unsigned users and forged login fields are denied uniformly", async () => {
    await assertFails(getDocFromServer(doc(guest.db, "students/learner-a")));
    await assertFails(getDocFromServer(doc(guest.db, "classes/ROOMA2")));
    await assertFails(updateDoc(doc(guest.db, "students/learner-a"), { coins: 100 }));
    await assertFails(setDoc(doc(guest.db, "students/guest-learner"), { id: "guest-learner" }));
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
    await assertSucceeds(getDocFromServer(doc(a.db, "teachers", teacherA)));
    await assertSucceeds(getDocFromServer(doc(a.db, "classes/ROOMA2")));
    const classes = await getDocsFromServer(query(collection(a.db, "classes"), where("teacherId", "==", teacherA)));
    assert.deepEqual(classes.docs.map(item => item.id), ["ROOMA2"]);
    await assertSucceeds(getDocsFromServer(query(collection(a.db, "classes/ROOMA2/students"), where("teacherId", "==", teacherA))));
    const matching = await assertSucceeds(getDocsFromServer(query(collection(a.db, "classes/ROOMA2/students"),
      where("teacherId", "==", teacherA), where("preferredNameLower", "==", "ari"))));
    assert.deepEqual(matching.docs.map(item => item.id), ["learner-a"]);
    await assertFails(getDocsFromServer(query(collection(b.db, "classes/ROOMA2/students"), where("teacherId", "==", teacherA))));
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
    const { claims, signInProvider } = await credential.user.getIdTokenResult(true);
    assert.equal(signInProvider, "custom");
    assert.equal(claims.studentId, "learner-a");
    assert.equal(claims.role, "student");
    await assertSucceeds(getDocFromServer(doc(student.db, "students/learner-a")));
    await assertFails(getDocFromServer(doc(student.db, "students/learner-b")));
    await assertFails(getDocsFromServer(collection(student.db, "classes/ROOMA2/students")));
    await assertFails(getDocFromServer(doc(student.db, "classes/ROOMB2")));
    await assertFails(updateDoc(doc(student.db, "teachers", teacherA), { name: "Replacement" }));
    await assertFails(updateDoc(doc(student.db, "classes/ROOMA2/students/learner-a"), { teacherId: "replacement" }));
    await assertFails(updateDoc(doc(student.db, "students/learner-b"), { xp: 500 }));
    await assertFails(updateDoc(doc(student.db, "students/learner-a"), { coins: 100, classCode: "ROOMB2" }));
    await assertFails(setDoc(doc(student.db, "students/learner-a/syncReceipts/fake"), { digest: "fake" }));
    await assertFails(setDoc(doc(student.db, "teachers/" + credential.user.uid), { id: credential.user.uid }));
  });

  await t.test("student profile and worksheet reads require the custom provider and matching identity claims", async () => {
    const claims = { role: "student", studentId: "learner-a", classCode: "ROOMA2", sessionVersion: 0,
      firebase: { sign_in_provider: "custom" } };
    const uid = "student:learner-a";
    const authorized = env.authenticatedContext(uid, claims).firestore();
    await assertSucceeds(getDocFromServer(doc(authorized, "students/learner-a")));
    await assertSucceeds(getDocsFromServer(collection(authorized, "students/learner-a/worksheetResults")));
    for (const [userId, token] of [
      [uid, { ...claims, firebase: { sign_in_provider: "password" } }],
      ["student:learner-b", claims],
      [uid, { ...claims, studentId: "learner-b" }],
      [uid, { ...claims, classCode: "ROOMB2" }],
      [uid, { ...claims, role: "teacher" }],
      [uid, { ...claims, sessionVersion: 1 }],
    ]) {
      const db = env.authenticatedContext(userId, token).firestore();
      await assertFails(getDocFromServer(doc(db, "students/learner-a")));
      await assertFails(getDocsFromServer(collection(db, "students/learner-a/worksheetResults")));
    }
  });

  await t.test("legacy enrollment is readable only with a consistent teacher and a valid access version", async () => {
    const teacherId = "rules-legacy-teacher", id = "rules-legacy-learner", classCode = "RULES2";
    const seed = action => env.withSecurityRulesDisabled(context => action(context.firestore()));
    await seed(async db => {
      await setDoc(doc(db, "teachers", teacherId), { id: "nonmatching-teacher" });
      await setDoc(doc(db, "classes", classCode), { code: classCode, teacherId });
      await setDoc(doc(db, "students", id), { id, classCode, teacherId, name: "Legacy Learner" });
    });
    const studentDb = sessionVersion => env.authenticatedContext("student:" + id, {
      role: "student", studentId: id, classCode, sessionVersion, firebase: { sign_in_provider: "custom" },
    }).firestore();
    const profile = db => getDocFromServer(doc(db, "students", id));
    const teacherDb = env.authenticatedContext(teacherId, { firebase: { sign_in_provider: "password" } }).firestore();
    const classroom = () => getDocFromServer(doc(teacherDb, "classes", classCode));
    await assertFails(profile(studentDb(0)));
    await assertFails(classroom());
    await seed(db => setDoc(doc(db, "teachers", teacherId), { id: teacherId }));
    await assertSucceeds(profile(studentDb(0)));
    await assertSucceeds(classroom());

    for (const invalidVersion of [-1, 0.5, "7", 9_007_199_254_740_992]) {
      await seed(db => setDoc(doc(db, "studentAccess", id), { enabled: true, version: invalidVersion }));
      await assertFails(profile(studentDb(invalidVersion)));
    }
    await seed(db => setDoc(doc(db, "studentAccess", id), { enabled: true, version: 7 }));
    await assertFails(profile(studentDb(0)));
    await assertSucceeds(profile(studentDb(7)));
    await seed(db => updateDoc(doc(db, "students", id), { preferredNameLower: "legacy learner" }));
    await assertFails(profile(studentDb(7)));
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
    await assert.rejects(reserved.call("syncWorksheet", { studentId: "role-test-learner", worksheet: proposed, capture: null, review: null, baseRevision: 0 }),
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
    for (const { db } of [student, a]) {
      await assertFails(getDocFromServer(doc(db, "students", "learner-a", "syncReceipts", quiz.id)));
      await assertFails(setDoc(doc(db, "students/learner-a/syncReceipts/wallet-version"), { version: 0 }));
      await assertFails(updateDoc(doc(db, "students/learner-a"), { coins: 100, avatar: "replacement" }));
    }
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

  await t.test("delayed equipment receipts preserve newer choices across batches and devices", async t => {
    await addLearner(a, teacherA, "ROOMA2", "wallet-learner", "Mira");
    const wallet = client("wallet-learner");
    t.after(() => deleteApp(wallet.app));
    await login(wallet, "Mira", "ROOMA2");
    const op = (device, sequence, operation) => ({ id: device.repeat(16) + "-" + sequence, operation });
    const equip = (device, sequence, mascotId) => op(device, sequence, { type: "equip", mascotId });
    const delayed = equip("aa", 3, "frog");
    const send = (...operations) => wallet.call("syncStudentLearning", { studentId: "wallet-learner", operations });
    assert.deepEqual((await send(delayed)).rejected, [{ id: delayed.id, reason: "dependency" }]);
    const newer = equip("bb", 1, "default");
    const confirmed = await send(newer);
    assert.deepEqual(confirmed.accepted, [newer.id]);
    // The latest writer is again the deferred operation's device, but the intervening
    // confirmation by another device must still protect the wallet from a stale retry.
    await send(equip("aa", 2, "default"));
    await send(op("cc", 1, quizProof("reading", "A")), op("cc", 2, quizProof("reading", "B")));
    const purchase = op("aa", 4, { type: "purchase", mascotId: "frog" });
    const result = await send(purchase, delayed);
    assert.deepEqual(result.supersededEquip, [delayed.id]);
    assert.equal(result.profile.avatar, "default");
    assert.equal(result.profile.coins, 5);
    assert.ok(result.profile.ownedMascots.includes("frog"));
    const retried = await send(purchase, delayed);
    assert.deepEqual(retried.accepted, [purchase.id, delayed.id]);
    assert.deepEqual(retried.supersededEquip, [delayed.id]);
    assert.equal(retried.profile.profileRevision, result.profile.profileRevision);
    assert.equal(retried.profile.coins, 5);
    const latest = await send(equip("aa", 6, "default"));
    assert.equal((await send(equip("aa", 5, "frog"))).profile.avatar, "default");
    assert.equal((await send(equip("aa", 5, "frog"))).profile.profileRevision, latest.profile.profileRevision);
  });

  await t.test("two deferred choices from one device apply in sequence when both purchases become eligible", async t => {
    const studentId = "deferred-wallet-learner";
    await addLearner(a, teacherA, "ROOMA2", studentId, "Dee");
    const wallet = client(studentId);
    t.after(() => deleteApp(wallet.app));
    await login(wallet, "Dee", "ROOMA2");
    const device = "de".repeat(16);
    const op = (sequence, type, mascotId) => ({ id: `${device}-${sequence}`, operation: { type, mascotId } });
    const operations = [op(1, "purchase", "frog"), op(2, "equip", "frog"), op(3, "purchase", "fox"), op(5, "equip", "fox")];
    const send = entries => wallet.call("syncStudentLearning", { studentId, operations: entries });
    const receipt = (db, id) => doc(db, "students", studentId, "syncReceipts", id);
    const walletState = ({ avatar, coins, ownedMascots, profileRevision }) => ({ avatar, coins, ownedMascots, profileRevision });
    const pending = await send(operations);
    assert.deepEqual(pending.accepted, []);
    assert.deepEqual(pending.rejected, operations.map(({ id }) => ({ id, reason: "dependency" })));
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      for (const item of operations) {
        const snap = await getDocFromServer(receipt(db, item.id));
        if (item.operation.type === "equip") assert.equal(snap.data().waitingAt, 0);
        else assert.equal(snap.exists(), false);
      }
      await updateDoc(doc(db, "students", studentId), { coins: 100 });
    });

    const applied = await send(operations);
    assert.deepEqual(applied.accepted, operations.map(({ id }) => id));
    assert.deepEqual(applied.supersededEquip, []);
    assert.deepEqual(applied.rejected, []);
    assert.equal(applied.profile.avatar, "fox");
    assert.equal(applied.profile.coins, 25);
    assert.deepEqual(applied.profile.ownedMascots.slice().sort(), ["default", "fox", "frog"]);

    // Drop the first acknowledgement from the client perspective and resend identical IDs.
    const replay = await send(operations);
    assert.deepEqual(replay.accepted, applied.accepted);
    assert.deepEqual(replay.supersededEquip, []);
    assert.deepEqual(replay.rejected, []);
    assert.deepEqual(walletState(replay.profile), walletState(applied.profile));
    const late = op(4, "equip", "frog");
    const superseded = await send([late]);
    assert.deepEqual(superseded.accepted, [late.id]);
    assert.deepEqual(superseded.supersededEquip, [late.id]);
    assert.deepEqual(walletState(superseded.profile), walletState(applied.profile));
    assert.deepEqual(await send([late]), superseded);

    const invalid = op(6, "equip", "not-a-mascot");
    const wrong = await send([invalid]);
    assert.deepEqual(wrong.accepted, []);
    assert.deepEqual(wrong.rejected, [{ id: invalid.id, reason: "invalid-operation" }]);
    await assert.rejects(wallet.call("syncStudentLearning", { studentId: "learner-a", operations: [op(7, "equip", "default")] }),
      { code: "functions/permission-denied" });

    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      for (const item of [...operations, late]) {
        const data = (await getDocFromServer(receipt(db, item.id))).data();
        assert.equal(data.digest, createHash("sha256").update(canonicalJson(item.operation)).digest("hex"));
        assert.ok(data.committedAt);
        assert.equal(data.waitingAt, undefined);
        assert.equal(data.superseded === true, item.id === late.id);
      }
      assert.equal((await getDocFromServer(receipt(db, invalid.id))).exists(), false);
      assert.deepEqual((await getDocFromServer(receipt(db, "wallet-version"))).data(), { version: 2, device, otherDeviceVersion: 0 });
    });
  });

  await t.test("a superseded equip persists its terminal sequence without changing the wallet", async t => {
    const studentId = "terminal-wallet-learner";
    await addLearner(a, teacherA, "ROOMA2", studentId, "Lex");
    const wallet = client(studentId);
    t.after(() => deleteApp(wallet.app));
    await login(wallet, "Lex", "ROOMA2");
    const deviceA = "e1".repeat(16), deviceB = "e2".repeat(16), legacyDevice = "e3".repeat(16);
    const op = (device, sequence, type, mascotId) => ({ id: `${device}-${sequence}`, operation: { type, mascotId } });
    const receipt = (db, id) => doc(db, "students", studentId, "syncReceipts", id);
    const readReceipt = async id => {
      let data;
      await env.withSecurityRulesDisabled(async context => {
        data = (await getDocFromServer(receipt(context.firestore(), id))).data();
      });
      return data;
    };
    const send = operations => wallet.call("syncStudentLearning", { studentId, operations });
    const deferred = op(deviceA, 2, "equip", "frog");
    const older = op(deviceA, 1, "equip", "default");
    const checkpointA = `wallet-${deviceA}`;
    assert.deepEqual((await send([deferred])).rejected, [{ id: deferred.id, reason: "dependency" }]);
    assert.equal(await readReceipt(checkpointA), undefined);

    await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), "students", studentId), { coins: 100 }));
    const purchase = op(deviceB, 1, "purchase", "fox");
    const deviceBEquip = op(deviceB, 2, "equip", "fox");
    const other = await send([purchase, deviceBEquip]);
    assert.deepEqual(other.accepted, [purchase.id, deviceBEquip.id]);
    assert.deepEqual([other.profile.avatar, other.profile.coins], ["fox", 50]);
    const head = await readReceipt("wallet-version");

    const retired = await send([deferred]);
    assert.deepEqual(retired.accepted, [deferred.id]);
    assert.deepEqual(retired.supersededEquip, [deferred.id]);
    assert.deepEqual([retired.profile.avatar, retired.profile.coins, retired.profile.profileRevision],
      ["fox", 50, other.profile.profileRevision]);
    assert.deepEqual(await readReceipt(checkpointA), { sequence: 0, terminalSequence: 2 });
    assert.deepEqual(await readReceipt("wallet-version"), head);
    const terminalReceipt = await readReceipt(deferred.id);
    assert.equal(terminalReceipt.superseded, true);
    assert.equal(terminalReceipt.waitingAt, undefined);

    const late = await send([older]);
    assert.deepEqual(late.accepted, [older.id]);
    assert.deepEqual(late.supersededEquip, [older.id]);
    assert.deepEqual([late.profile.avatar, late.profile.coins, late.profile.profileRevision],
      ["fox", 50, other.profile.profileRevision]);
    const replay = await send([purchase, deferred, older]);
    assert.deepEqual(replay.accepted, [purchase.id, deferred.id, older.id]);
    assert.deepEqual(replay.supersededEquip, [deferred.id, older.id]);
    assert.equal(replay.profile.coins, 50);
    assert.deepEqual(await readReceipt(deferred.id), terminalReceipt);
    assert.deepEqual(await readReceipt(checkpointA), { sequence: 0, terminalSequence: 2 });
    assert.deepEqual(await readReceipt("wallet-version"), head);

    const invalid = op(deviceA, 20, "equip", "not-a-mascot");
    assert.deepEqual((await send([invalid])).rejected, [{ id: invalid.id, reason: "invalid-operation" }]);
    const unauthorized = op(deviceA, 21, "equip", "default");
    await assert.rejects(student.call("syncStudentLearning", { studentId, operations: [unauthorized] }),
      { code: "functions/permission-denied" });
    assert.deepEqual(await readReceipt(checkpointA), { sequence: 0, terminalSequence: 2 });
    assert.equal(await readReceipt(invalid.id), undefined);
    assert.equal(await readReceipt(unauthorized.id), undefined);

    const newest = op(deviceA, 3, "equip", "default");
    const applied = await send([newest]);
    assert.deepEqual(applied.accepted, [newest.id]);
    assert.deepEqual(applied.supersededEquip, []);
    assert.equal(applied.profile.avatar, "default");
    assert.deepEqual(await readReceipt(checkpointA), { sequence: 3, terminalSequence: 3 });

    // Checkpoints written before terminal sequences existed still floor deferred and fresh retries.
    const legacyCheckpoint = `wallet-${legacyDevice}`;
    await env.withSecurityRulesDisabled(context => setDoc(receipt(context.firestore(), legacyCheckpoint), { sequence: 5 }));
    assert.deepEqual((await send([op(legacyDevice, 4, "equip", "fox")])).supersededEquip, [`${legacyDevice}-4`]);
    assert.deepEqual(await readReceipt(legacyCheckpoint), { sequence: 5 });
    assert.equal((await send([op(legacyDevice, 6, "equip", "fox")])).profile.avatar, "fox");
    assert.deepEqual(await readReceipt(legacyCheckpoint), { sequence: 6, terminalSequence: 6 });
  });

  await t.test("invalid operation sequences are rejected and concurrent wallet commits preserve the latest equip", async t => {
    const studentId = "concurrent-wallet-learner";
    await addLearner(a, teacherA, "ROOMA2", studentId, "Zoe");
    const wallet = client(studentId);
    t.after(() => deleteApp(wallet.app));
    await login(wallet, "Zoe", "ROOMA2");
    const device = "e4".repeat(16), boundaryDevice = "e5".repeat(16);
    const op = (source, sequence, type, mascotId) => ({ id: `${source}-${sequence}`, operation: { type, mascotId } });
    const send = operations => wallet.call("syncStudentLearning", { studentId, operations });
    const receipt = (db, id) => doc(db, "students", studentId, "syncReceipts", id);
    const invalidSequences = ["9007199254740992", "9007199254740993", "01", "1e3", "1.2", "1\n"];
    for (const sequence of invalidSequences) {
      await assert.rejects(send([op(boundaryDevice, sequence, "equip", "default")]), { code: "functions/invalid-argument" });
    }
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      assert.equal((await getDocFromServer(receipt(db, `wallet-${boundaryDevice}`))).exists(), false);
      await updateDoc(doc(db, "students", studentId), { coins: 100 });
    });
    const max = op(boundaryDevice, Number.MAX_SAFE_INTEGER, "equip", "default");
    assert.deepEqual((await send([max])).accepted, [max.id]);

    const purchase = op(device, 1, "purchase", "frog");
    const purchases = await Promise.all([send([purchase]), send([purchase])]);
    for (const result of purchases) {
      assert.deepEqual(result.accepted, [purchase.id]);
      assert.equal(result.profile.coins, 75);
      assert.equal(result.profile.profileRevision, 2);
    }
    const equips = [op(device, 2, "equip", "frog"), op(device, 3, "equip", "default")];
    const outcomes = await Promise.all(equips.map(item => send([item])));
    outcomes.forEach((result, index) => {
      assert.deepEqual(result.accepted, [equips[index].id]);
      assert.equal(result.profile.coins, 75);
    });
    assert.deepEqual(outcomes[1].supersededEquip, []);
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const state = (await getDocFromServer(doc(db, "students", studentId))).data();
      assert.deepEqual([state.avatar, state.coins, state.profileRevision],
        ["default", 75, 4 - outcomes[0].supersededEquip.length]);
      assert.deepEqual((await getDocFromServer(receipt(db, `wallet-${device}`))).data(), { sequence: 3, terminalSequence: 3 });
      assert.deepEqual((await getDocFromServer(receipt(db, `wallet-${boundaryDevice}`))).data(),
        { sequence: Number.MAX_SAFE_INTEGER, terminalSequence: Number.MAX_SAFE_INTEGER });
      for (const item of [purchase, ...equips, max]) assert.ok((await getDocFromServer(receipt(db, item.id))).data().committedAt);
    });
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
    const data = { studentId: "learner-a", worksheet, capture, review, baseRevision: 1 };
    const draft = await student.call("syncWorksheet", { ...data, review: null, baseRevision: 0 });
    assert.equal(draft.revision, 1);
    await assert.rejects(student.call("syncWorksheet", data), { code: "functions/permission-denied" });
    await assert.rejects(b.call("syncWorksheet", data), { code: "functions/permission-denied" });
    await assertFails(updateDoc(doc(student.db, "students/learner-a/worksheetResults/" + instanceId), { finalized: { score: 5 } }));
    const result = await a.call("syncWorksheet", data);
    assert.equal(result.finalized.teacherId, teacherA);
    assert.equal(result.finalized.score, 5);
    assert.equal(result.profile.mathXP, 50);
    const saved = await assertSucceeds(getDocFromServer(doc(a.db, "students/learner-a/worksheetResults", instanceId)));
    assert.equal(saved.data().finalized.score, 5);
    await assertSucceeds(getDocsFromServer(collection(a.db, "students/learner-a/worksheetResults")));
    await assertFails(getDocFromServer(doc(b.db, "students/learner-a/worksheetResults", instanceId)));
    await assertFails(getDocsFromServer(collection(b.db, "students/learner-a/worksheetResults")));
    await assertFails(updateDoc(doc(a.db, "students/learner-a/worksheetResults", instanceId), { finalized: { score: 0 } }));
    const replay = await a.call("syncWorksheet", data);
    assert.deepEqual(replay.finalized, result.finalized);
    assert.equal(replay.profile.xp, result.profile.xp);
    const changedReview = await a.call("syncWorksheet", { ...data, review: { ...review, answers: Array(5).fill(null) } });
    assert.equal(changedReview.conflict, true);
    assert.deepEqual(changedReview.finalized, result.finalized);
    assert.equal((await getDocsFromServer(collection(student.db, "students/learner-a/worksheetResults"))).size, 1);

    const tracingId = "87654321-1234-1234-1234-123456789012";
    const tracing = JSON.parse(JSON.stringify({
      ...createWorksheet("writing", "A"), instanceId: tracingId, studentId: "learner-a", templateVersion: 2,
    }));
    const writingDraft = {
      studentId: "learner-a", worksheet: tracing,
      capture: { ...capture, worksheetInstanceId: tracingId, answers: [], confidence: [], statuses: [], darkness: [] },
      baseRevision: 0, review: null,
    };
    const uploaded = await a.call("syncWorksheet", writingDraft);
    const writing = await a.call("syncWorksheet", {
      ...writingDraft, baseRevision: uploaded.revision,
      review: { answers: [], writing: Array(5).fill(true), finalizedAt: review.finalizedAt },
    });
    assert.equal(writing.finalized.score, 5);
    assert.equal(writing.profile.writingProgress.A.completed, true);
  });

  await t.test("worksheet revisions resolve out-of-order drafts, timestamps, concurrent review and lost acknowledgements", async () => {
    const now = Date.now();
    const day = 86_400_000;
    const at = offset => new Date(now + offset).toISOString();
    const instanceId = "55667788-1234-1234-1234-123456789012";
    const offlineSheet = JSON.parse(JSON.stringify({ ...createWorksheet("math", 1), instanceId, studentId: "learner-a",
      templateVersion: 2, createdAt: at(-8 * day) }));
    const oldCapture = { ...capture, worksheetInstanceId: instanceId, capturedAt: at(-7 * day) };
    const draft = { studentId: "learner-a", worksheet: offlineSheet, capture: oldCapture, review: null, baseRevision: 0 };
    const call = (caller, overrides) => caller.call("syncWorksheet", { ...draft, ...overrides });
    const invalid = { code: "functions/failed-precondition" };
    await assert.rejects(call(student, { worksheet: { ...offlineSheet, createdAt: at(day) } }), invalid);
    await assert.rejects(call(student, { capture: { ...oldCapture, capturedAt: at(day) } }), invalid);
    assert.equal((await call(student)).revision, 1);
    assert.equal((await call(student)).revision, 1, "a lost draft acknowledgement does not advance the revision");
    for (const offset of [220_000, 230_000, 240_000]) {
      assert.equal((await call(student, { capture: { ...oldCapture, capturedAt: at(offset) }, baseRevision: 1 })).revision, 1);
    }
    const replacement = { ...oldCapture, answers: [null, ...oldCapture.answers.slice(1)], capturedAt: at(-8 * day) };
    assert.equal((await call(student, { capture: replacement, baseRevision: 1 })).revision, 2, "timestamps cannot determine replacement order");
    const late = await call(student, { capture: { ...oldCapture, capturedAt: at(245_000) }, baseRevision: 1 });
    assert.equal(late.conflict, true);
    assert.equal(late.revision, 2);
    assert.deepEqual(late.capture.answers, replacement.answers);

    const finalReview = { answers: oldCapture.answers, writing: [], finalizedAt: at(-5 * day) };
    const stale = await call(a, { baseRevision: 1, review: finalReview });
    assert.equal(stale.conflict, true);
    assert.equal(stale.finalized, null);
    await assert.rejects(call(a, { capture: replacement, baseRevision: 2, review: { ...finalReview, finalizedAt: at(day) } }), invalid);
    await assert.rejects(call(student, { capture: replacement, baseRevision: 2, review: finalReview }), { code: "functions/permission-denied" });
    await assert.rejects(call(b, { capture: replacement, baseRevision: 2, review: finalReview }), { code: "functions/permission-denied" });
    const submitted = { baseRevision: 2, capture: replacement, review: finalReview };
    const finalized = await call(a, submitted);
    assert.equal(finalized.finalized.score, 5);
    assert.equal(finalized.finalized.teacherId, teacherA);
    assert.equal(finalized.revision, 2);
    const replay = await call(a, submitted);
    assert.deepEqual(replay.finalized, finalized.finalized);
    assert.equal(replay.profile.profileRevision, finalized.profile.profileRevision);
    const after = await call(student, { capture: oldCapture, baseRevision: 2 });
    assert.deepEqual(after.finalized, finalized.finalized);
  });

  await t.test("legacy finalized worksheets retain their original timestamps and result", async () => {
    const instanceId = "10101010-1234-1234-1234-123456789012";
    const oldClock = new Date(Date.now() + 86_400_000).toISOString();
    const legacySheet = { ...worksheet, instanceId, createdAt: oldClock };
    const legacyCapture = { ...capture, worksheetInstanceId: instanceId, capturedAt: oldClock };
    const legacyReview = { ...review, finalizedAt: oldClock };
    const final = { ...legacyReview, teacherId: teacherA, studentId: "learner-a", instanceId, subject: "math",
      lessonId: "1", score: 5, total: 5, passed: true, stars: 3 };
    const request = { studentId: "learner-a", worksheet: legacySheet, capture: legacyCapture, baseRevision: 0, review: null };
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), "students/learner-a/worksheetResults/" + instanceId), {
      worksheet: legacySheet, capture: { ...legacyCapture, darkness: { ...legacyCapture.darkness } }, finalized: final,
    }));
    const existing = await student.call("syncWorksheet", request);
    assert.equal(existing.revision, 0);
    assert.deepEqual(existing.finalized, final);
    await assert.rejects(b.call("syncWorksheet", request), { code: "functions/permission-denied" });
    assert.deepEqual((await a.call("syncWorksheet", { ...request, review: legacyReview })).finalized, final);
    assert.equal((await a.call("syncWorksheet", { ...request, review: legacyReview, baseRevision: 1 })).conflict, true);
    await assert.rejects(a.call("syncWorksheet", { ...request, worksheet: { ...legacySheet, createdAt: new Date().toISOString() } }),
      { code: "functions/failed-precondition" });
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
    const old = mobileRuntime(first, storage, saved);
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

    const current = mobileRuntime(reopened, storage, saved);
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
      const peers = await Promise.all([submit(guest, "Rae"), submit(student, "Lou")]);
      assert.deepEqual(peers.map(result => result.studentId), ["rae", "lou"]);
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
    await Promise.all(["Unknown", "Another", "Missing", "Unmatched", "Absent", "Different"].map((name, i) =>
      assert.rejects(submit(sharedSource[i % 3], name), denial)));
    assert.equal((await buckets()).get(ipBucket).count, 120);
    assert.equal((await buckets()).size, after.size);
    await assert.rejects(submit(b, "Rae"), denial);
  });

  await t.test("simulated classmates share source quotas and separate sources remain independent", { skip: standalone }, async () => {
    const sourceA = "198.51.100.10", sourceB = "198.51.100.11";
    const submit = (name, source, classCode = "ROOMA2") => loginFromTestSource(name, classCode, source);
    const deny = { status: 403, body: { error: { status: "PERMISSION_DENIED",
      message: "We could not verify your name and classroom code." } } };
    for (let i = 0; i < 12; i++) {
      const { status, body } = await submit("Tess", sourceA);
      assert.equal(status, 200);
      assert.equal(body.result.studentId, "tess");
    }
    assert.deepEqual(await submit("Tess", sourceA), deny);
    assert.equal((await submit("Rae", sourceA)).body.result.studentId, "rae");
    assert.equal((await submit("Tess", sourceB)).body.result.studentId, "tess");

    assert.deepEqual(await submit("Unknown", sourceA, "UNKNOWN1"), deny);
    const failurePath = "loginLimits/" + createHash("sha256").update("failed:" + sourceA).digest("hex");
    await env.withSecurityRulesDisabled(async context => {
      const ref = doc(context.firestore(), failurePath);
      assert.equal((await getDocFromServer(ref)).data().count, 1);
      await updateDoc(ref, { count: 119 });
    });
    assert.deepEqual(await submit("Unknown", sourceA, "UNKNOWN1"), deny);
    assert.deepEqual(await submit("Rae", sourceA), deny);
    assert.deepEqual(await submit("Lou", sourceA), deny);
    assert.equal((await submit("Rae", sourceB)).body.result.studentId, "rae");
    assert.equal((await submit("Lou", sourceB)).body.result.studentId, "lou");
  });
});

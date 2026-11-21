const { createRequire } = require("node:module");
const { initializeApp, deleteApp } = require("firebase/app");
const { initializeAuth, inMemoryPersistence, connectAuthEmulator,
  signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, connectFirestoreEmulator, collection, doc, getDocFromServer,
  getDocsFromServer, query, where } = require("firebase/firestore");
const { addLearner, createClassroom, createTeacherProfile } = require("./firebase-emulator-fixtures.cjs");

const projectId = "demo-lumikids";
const firestoreHost = "127.0.0.1";
const firestorePort = 8080;
const teacherName = "Sam Demo";
const email = "teacher@lumikids.example";
const password = "Lumikids-Demo-482!";
const code = "LUMI26";
const learners = [
  { id: "demo-lumi-mira", name: "Mira" },
  { id: "demo-lumi-leo", name: "Leo" },
];

async function seedAccessGrants() {
  // This privileged seeding step only targets the fixed local demo database.
  process.env.FIRESTORE_EMULATOR_HOST = `${firestoreHost}:${firestorePort}`;
  process.env.METADATA_SERVER_DETECTION = "none";
  const requireFunctions = createRequire(require.resolve("../backend/functions/package.json"));
  const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireFunctions("firebase-admin/app");
  const { getFirestore: getAdminFirestore } = requireFunctions("firebase-admin/firestore");
  const app = initializeAdmin({ projectId }, "demoAccessGrants");
  const db = getAdminFirestore(app);
  try {
    const grants = learners.map(({ id }) => db.collection("studentAccess").doc(id));
    await db.runTransaction(async transaction => {
      const snapshots = await transaction.getAll(...grants);
      for (const snapshot of snapshots) {
        if (!snapshot.exists) {
          transaction.create(snapshot.ref, { enabled: true, version: 0 });
          continue;
        }
        const { enabled, version } = snapshot.data();
        if (enabled !== true || !Number.isSafeInteger(version) || version < 0) {
          throw new Error("The existing access grant for " + snapshot.id + " is disabled or invalid.");
        }
      }
    });
  } finally {
    await Promise.all([db.terminate(), deleteAdmin(app)]);
  }
}

async function seed() {
  const app = initializeApp({ projectId, apiKey: "demo-api-key", authDomain: projectId + ".firebaseapp.com" });
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreHost, firestorePort);

  try {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code !== "auth/invalid-credential" && error.code !== "auth/user-not-found") throw error;
      credential = await createUserWithEmailAndPassword(auth, email, password);
    }
    const { uid } = credential.user;
    const teacher = await getDocFromServer(doc(db, "teachers", uid));
    if (!teacher.exists()) await createTeacherProfile(db, uid, teacherName, email);

    const owned = ref => getDocsFromServer(query(ref, where("teacherId", "==", uid)));
    const classrooms = await owned(collection(db, "classes"));
    if (!classrooms.docs.some(classroom => classroom.id === code && classroom.data().code === code)) {
      await createClassroom(db, uid, teacherName, code);
    }
    const roster = await owned(collection(db, "classes", code, "students"));
    for (const { id, name } of learners) {
      const existing = roster.docs.find(student => student.id === id);
      if (!existing) {
        await addLearner({ db }, uid, code, id, name);
        continue;
      }
      const root = (await getDocFromServer(doc(db, "students", id))).data();
      for (const record of [existing.data(), root]) {
        if (record?.id !== id || record.name !== name || record.preferredNameLower !== name.toLowerCase() ||
            record.classCode !== code || record.teacherId !== uid) {
          throw new Error("The existing enrollment for " + id + " differs from the demo fixture.");
        }
      }
    }
    await seedAccessGrants();
    console.log("Teacher: " + email + " / " + password);
    console.log("Students: " + learners.map(learner => learner.name).join(", ") + " / " + code);
  } finally {
    await deleteApp(app);
  }
}

seed().catch(error => {
  console.error("Could not seed the local demo:", error.message);
  process.exitCode = 1;
});

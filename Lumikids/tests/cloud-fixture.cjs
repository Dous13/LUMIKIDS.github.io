// The app regression suite uses SQLite with a deterministic callable transport.
// Authorization is exercised separately against all three Firebase emulators.
const { profileSummary } = require("../backend/functions/learning.cjs");
const { applyLearningBatch, equipDevice } = require("../backend/functions/learningBatch.cjs");
const { syncWorksheetRevision } = require("../backend/functions/worksheetRevision.cjs");
const { readingQuizzes } = require("../backend/functions/curriculum/data/readingQuizzes");
const { mathQuizzes } = require("../backend/functions/curriculum/data/mathQuizzes");
const { writingLessons } = require("../backend/functions/curriculum/data/writingLessons");
const { writingStrokeTemplates } = require("../backend/functions/curriculum/data/writingStrokeTemplates");

function quizProof(subject, lessonId) {
  const items = subject === "reading" ? readingQuizzes[lessonId] : mathQuizzes.filter(item => item.lessonId === Number(lessonId));
  return { type: "quiz", subject, lessonId: String(lessonId), answers: items.map(item => item.answer ?? item.correctAnswer) };
}

function traceProof(lessonId) {
  const lesson = writingLessons.find(item => item.id === lessonId);
  const phases = [lesson.letter, lesson.letter.toLowerCase(), lesson.word].map(target => Array.from(target).map(letter => ({
    width: 300, height: 380,
    strokes: writingStrokeTemplates[letter].map(stroke => stroke.map(point => ({ x: point.x * 300, y: point.y * 380 }))),
  })));
  return { type: "trace", lessonId, phases };
}

const authError = () => Object.assign(new Error("Could not verify enrollment."), { code: "functions/permission-denied" });
function fakeFirebase(cloud, { network = () => {}, commit, auth, teacherId = "teacher", onLearning }) {
  const tickets = new Map();
  const ref = (id, prefix = "students/") => prefix + id;
  return {
    authMock: {
      signInWithEmailAndPassword() { throw new Error("Student login must use a custom token."); },
      async signInWithCustomToken(instance, token) {
        const claims = tickets.get(token);
        if (!claims) throw authError();
        const user = {
          uid: "student:" + claims.studentId,
          async getIdTokenResult() {
            network();
            return { claims, expirationTime: new Date(Date.now() + 3_600_000).toISOString() };
          },
        };
        instance.currentUser = user;
        return { user };
      },
    },
    functionsMock: {
      httpsCallable(_functions, name) {
        return async input => {
          network();
          const { studentId } = input;
          if (name === "loginStudent") {
            const code = input.classCode;
            const classRoom = cloud.get("classes/" + code);
            if (!classRoom) throw authError();
            const prefix = "classes/" + code + "/students/";
            const roster = [...cloud].filter(([key, data]) => key.startsWith(prefix) && data.preferredNameLower === input.name.toLowerCase());
            const legacy = roster.length === 0;
            const matches = legacy ? [...cloud].filter(([key, data]) => /^students\/[^/]+$/.test(key) &&
              data.classCode === code && data.name === input.name) : roster;
            if (matches.length !== 1) throw authError();
            const id = matches[0][0].split("/").at(-1);
            const student = cloud.get(ref(id));
            if (!student || student.classCode !== code || student.teacherId !== classRoom.teacherId ||
                matches[0][1].classCode !== code || (legacy && student.preferredNameLower !== undefined)) throw authError();
            const token = "emulated-token-" + id;
            tickets.set(token, { role: "student", studentId: id, classCode: code });
            return { data: { studentId: id, token } };
          }

          const root = ref(studentId);
          const record = cloud.get(root);
          if (!record) throw new Error("The cloud student profile does not exist.");
          let profile = profileSummary({ id: studentId, classCode: "class", name: studentId, ...record });
          const writes = [];
          const mirror = () => {
            profile.profileRevision++;
            writes.unshift([root, { ...profile }], ["classes/" + profile.classCode + "/students/" + studentId, { ...profile }]);
          };
          if (name === "syncStudentLearning") {
            onLearning?.(input.operations);
            const prefix = root + "/syncReceipts/";
            const devices = [...new Set(input.operations.map(equipDevice).filter(Boolean))];
            const checkpoints = new Map(devices.map(device => [device, cloud.get(prefix + "wallet-" + device)]));
            const batch = applyLearningBatch(profile, input.operations, input.operations.map(item => cloud.get(prefix + item.id)),
              cloud.get(prefix + "wallet-version") ?? { version: 0 }, checkpoints);
            profile = batch.profile;
            for (const [id, receipt] of batch.receipts) writes.push([prefix + id, { waitingAt: null, ...receipt }]);
            if (batch.walletChanged) writes.push([prefix + "wallet-version", batch.wallet]);
            for (const [device, checkpoint] of batch.checkpoints) writes.push([prefix + "wallet-" + device, checkpoint]);
            if (batch.changed) mirror();
            if (writes.length) await commit(writes);
            return { data: { accepted: batch.accepted, supersededEquip: batch.supersededEquip, rejected: batch.rejected, profile } };
          }
          assertWorksheetCall(name);
          const key = root + "/worksheetResults/" + input.worksheet.instanceId;
          const update = syncWorksheetRevision(cloud.get(key), input, profile, teacherId, Date.now());
          if (update.write) writes.push([key, update.write]);
          if (update.award) mirror();
          if (writes.length) await commit(writes);
          return { data: update.result };
        };
      },
    },
    async getStudent(ref) {
      network();
      const value = cloud.get(ref);
      const user = auth?.currentUser;
      if (user?.uid.startsWith("student:") && user.uid === "student:" + value?.id &&
          value.preferredNameLower !== undefined && !cloud.has("classes/" + value.classCode + "/students/" + value.id)) throw authError();
      return { exists: () => cloud.has(ref), data: () => structuredClone(value) };
    },
  };
}

function assertWorksheetCall(name) {
  if (name !== "syncWorksheet") throw new Error("Unexpected callable " + name);
}

module.exports = { fakeFirebase, quizProof, traceProof };

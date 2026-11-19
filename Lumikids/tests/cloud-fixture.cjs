// The app regression suite uses SQLite with a deterministic callable transport.
// Authorization is exercised separately against all three Firebase emulators.
const { createHash } = require("node:crypto");
const { applyOperation, applyWorksheet, profileSummary, InvalidOperation, verifyWorksheet, verifyCapture, isOlderWorksheetCapture } =
  require("../backend/functions/learning.cjs");
const { canonicalJson } = require("../backend/functions/curriculum/services/phygital/worksheetLayout");
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
            const accepted = [];
            const rejected = [];
            for (const item of input.operations) {
              const key = root + "/syncReceipts/" + item.id;
              const digest = createHash("sha256").update(canonicalJson(item.operation)).digest("hex");
              if (cloud.has(key)) {
                if (cloud.get(key).digest === digest) accepted.push(item.id);
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
              writes.push([key, { digest }]);
              accepted.push(item.id);
            }
            if (writes.length) { mirror(); await commit(writes); }
            return { data: { accepted, rejected, profile } };
          }
          assertWorksheetCall(name);
          const worksheet = verifyWorksheet(input.worksheet, studentId);
          const key = root + "/worksheetResults/" + worksheet.instanceId;
          const previous = cloud.get(key);
          if (previous?.finalized) {
            if (input.review && (previous.finalized.teacherId !== teacherId ||
                canonicalJson(previous.finalized.answers) !== canonicalJson(input.review.answers))) {
              throw new Error("This worksheet was finalized differently.");
            }
            return { data: { finalized: previous.finalized, profile } };
          }
          const capture = input.capture ? verifyCapture(input.capture, worksheet) : null;
          if (isOlderWorksheetCapture(previous?.capture, capture, Date.now())) {
            if (input.review) throw new Error("A newer capture needs review.");
            return { data: { finalized: null, profile } };
          }
          const finalized = input.review ? applyWorksheet(profile, worksheet, input.review, teacherId) : null;
          writes.push([key, { worksheet, ...(capture ? { capture } : {}), ...(finalized ? { finalized } : {}) }]);
          if (finalized) mirror();
          await commit(writes);
          return { data: { finalized, profile } };
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

const { doc, serverTimestamp, setDoc, writeBatch } = require("firebase/firestore");

function createTeacherProfile(db, teacherId, name, email) {
  return setDoc(doc(db, "teachers", teacherId), { id: teacherId, name, email, createdAt: serverTimestamp() });
}

function createClassroom(db, teacherId, teacherName, code) {
  return setDoc(doc(db, "classes", code), {
    code, teacherId, teacherName, name: teacherName + " classroom", createdAt: serverTimestamp(),
  });
}

function addLearner({ db }, teacherId, code, learner, name) {
  const data = {
    id: learner, classCode: code, teacherId, fullName: name + " Learner", name,
    preferredName: name, preferredNameLower: name.toLowerCase(), xp: 0, coins: 0,
    level: 1, streak: 0, readingXP: 0, writingXP: 0, mathXP: 0, avatar: "default",
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "students", learner), data);
  batch.set(doc(db, "classes", code, "students", learner), data);
  return batch.commit();
}

module.exports = { addLearner, createClassroom, createTeacherProfile };

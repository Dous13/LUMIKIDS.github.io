import {
  collection,
  doc,
  getDocs,
  getDocFromServer,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { saveTeacherSession } from "./teacherSession";
import { withSignIn } from "../session/verifiedIdentity";
import * as Crypto from "expo-crypto";

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (const byte of Crypto.getRandomBytes(6)) result += chars[byte % chars.length];
  return result;
}

export function registerTeacher(name: string, email: string, password: string) {
  return withSignIn(async () => {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await setDoc(doc(db, "teachers", user.uid), {
      id: user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
    });
    await saveTeacherSession(user, {
      teacherId: user.uid,
      email: user.email || email.trim().toLowerCase(),
      name: name.trim(),
    });
    return user.uid;
  });
}

export function loginTeacher(email: string, password: string) {
  return withSignIn(async () => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const teacherSnapshot = await getDocFromServer(doc(db, "teachers", credential.user.uid));
    if (!teacherSnapshot.exists()) throw new Error("Teacher account not found.");
    await saveTeacherSession(credential.user, {
      teacherId: credential.user.uid,
      email: credential.user.email || email.trim().toLowerCase(),
      name: teacherSnapshot.data().name || "Teacher",
    });
    return credential.user.uid;
  });
}

export async function createClass(teacherId: string, teacherName: string) {
  // Rules permit creation only. An existing code cannot be overwritten, and
  // the client does not need to read classrooms belonging to other teachers.
  const code = generateClassCode();

  await setDoc(doc(db, "classes", code), {
    code,
    teacherId,
    teacherName,
    name: `${teacherName}'s Class`,
    createdAt: serverTimestamp(),
  });

  return code;
}

export async function createTeacherStudent(params: {
  teacherId: string;
  classCode: string;
  fullName: string;
  preferredName: string;
}) {
  const classCode = normalizeCode(params.classCode);
  const preferredName = params.preferredName.trim();
  const fullName = params.fullName.trim();

  if (!fullName || !preferredName) throw new Error("Please enter the student's full name and preferred first name.");

  const existing = await getDocs(query(
    collection(db, "classes", classCode, "students"),
    where("teacherId", "==", params.teacherId),
    where("preferredNameLower", "==", preferredName.toLowerCase())
  ));

  if (!existing.empty) throw new Error("A student with that preferred name is already in this class.");

  const id = Crypto.randomUUID();
  const student = {
    id,
    fullName,
    name: preferredName,
    preferredName,
    preferredNameLower: preferredName.toLowerCase(),
    classCode,
    teacherId: params.teacherId,
    xp: 0,
    coins: 0,
    level: 1,
    streak: 0,
    readingXP: 0,
    writingXP: 0,
    mathXP: 0,
    avatar: "default",
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "students", id), student);
  batch.set(doc(db, "classes", classCode, "students", id), student);
  await batch.commit();
  return student;
}

export async function getTeacherClasses(teacherId: string) {
  const snapshot = await getDocs(query(collection(db, "classes"), where("teacherId", "==", teacherId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function getClassStudents(classCode: string, teacherId: string) {
  const snapshot = await getDocs(query(collection(db, "classes", normalizeCode(classCode), "students"),
    where("teacherId", "==", teacherId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { saveTeacherSession } from "./teacherSession";
import * as Crypto from "expo-crypto";

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function registerTeacher(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, "teachers", credential.user.uid), {
    id: credential.user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  });

  await saveTeacherSession({
    teacherId: credential.user.uid,
    email: credential.user.email || email.trim().toLowerCase(),
    name: name.trim(),
  });

  return credential.user.uid;
}

export async function loginTeacher(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const teacherSnapshot = await getDoc(doc(db, "teachers", credential.user.uid));
  const teacher = teacherSnapshot.exists() ? teacherSnapshot.data() : null;

  await saveTeacherSession({
    teacherId: credential.user.uid,
    email: credential.user.email || email.trim().toLowerCase(),
    name: teacher?.name || "Teacher",
  });

  return credential.user.uid;
}

export async function createClass(teacherId: string, teacherName: string) {
  let code = generateClassCode();
  let existing = await getDocs(query(collection(db, "classes"), where("code", "==", code)));
  while (!existing.empty) {
    code = generateClassCode();
    existing = await getDocs(query(collection(db, "classes"), where("code", "==", code)));
  }

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

  await setDoc(doc(db, "students", id), student);
  await setDoc(doc(db, "classes", classCode, "students", id), student);
  return student;
}

export async function getTeacherClasses(teacherId: string) {
  const snapshot = await getDocs(query(collection(db, "classes"), where("teacherId", "==", teacherId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function getClassStudents(classCode: string, teacherId: string) {
  const snapshot = await getDocs(collection(db, "classes", normalizeCode(classCode), "students"));
  return snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .filter((student: any) => student.teacherId === teacherId);
}

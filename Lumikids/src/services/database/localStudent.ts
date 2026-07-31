import { db } from "./database";

import { Student } from "../../models/Student";

export function saveStudent(student: {
  id: string;
  name: string;
  classCode: string;
  xp: number;
  readingXP: number;
  writingXP: number;
  mathXP: number;
  level: number;
}) {
  db.runSync(
    `
    INSERT OR REPLACE INTO student (
      id,
      name,
      classCode,
      xp,
      readingXP,
      writingXP,
      mathXP,
      level
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      student.id,
      student.name,
      student.classCode,
      student.xp,
      student.readingXP,
      student.writingXP,
      student.mathXP,
      student.level,
    ]
  );
}

export function getLocalStudent(
  id: string
): Student | null {
  const result = db.getFirstSync(
    `
    SELECT *
    FROM student
    WHERE id = ?
    `,
    [id]
  );

  if (!result) return null;

  return result as Student;
}
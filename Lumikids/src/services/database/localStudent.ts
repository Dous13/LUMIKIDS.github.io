import { db } from "./database";
import { Student } from "../../models/Student";
import { addToSyncQueue } from "../sync/localQueue";
import { getLevel } from "../../utils/xp";

export function saveStudent(student: {
  id: string;
  name: string;
  classCode: string;
  xp: number;
  coins: number;
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
      coins,
      readingXP,
      writingXP,
      mathXP,
      level
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      student.id,
      student.name,
      student.classCode,
      student.xp,
      student.coins,
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

  if (!result) {
    return null;
  }

  return result as Student;
}

export function awardLocalReadingXP(
  studentId: string,
  xpEarned: number
) {
  db.runSync(
    `
    UPDATE student
    SET
      xp = xp + ?,
      readingXP = readingXP + ?
    WHERE id = ?
    `,
    [
      xpEarned,
      xpEarned,
      studentId,
    ]
  );

  const updatedStudent = getLocalStudent(studentId);

  if (updatedStudent) {
    const level = getLevel(updatedStudent.xp);

    db.runSync(
      `
      UPDATE student
      SET level = ?
      WHERE id = ?
      `,
      [
        level,
        studentId,
      ]
    );
  }
addToSyncQueue(
  "SYNC_STUDENT",
  {
    studentId,
  }
);
}

export function awardLocalWritingXP(
  studentId: string,
  xpEarned: number
) {
  db.runSync(
    `
    UPDATE student
    SET
      xp = xp + ?,
      writingXP = writingXP + ?
    WHERE id = ?
    `,
    [xpEarned, xpEarned, studentId]
  );

  const updatedStudent = getLocalStudent(studentId);

  if (updatedStudent) {
    const level = getLevel(updatedStudent.xp);
    db.runSync(
      `UPDATE student SET level = ? WHERE id = ?`,
      [level, studentId]
    );
  }

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

export function awardLocalMathXP(
  studentId: string,
  xpEarned: number
) {
  db.runSync(
    `
    UPDATE student
    SET
      xp = xp + ?,
      mathXP = mathXP + ?
    WHERE id = ?
    `,
    [xpEarned, xpEarned, studentId]
  );

  const updatedStudent = getLocalStudent(studentId);

  if (updatedStudent) {
    const level = getLevel(updatedStudent.xp);
    db.runSync(
      `UPDATE student SET level = ? WHERE id = ?`,
      [level, studentId]
    );
  }

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

export function awardLocalCoins(
  studentId: string,
  coinsEarned: number
) {
  db.runSync(
    `
    UPDATE student
    SET
      coins = coins + ?
    WHERE id = ?
    `,
    [
      coinsEarned,
      studentId,
    ]
  );
addToSyncQueue(
  "SYNC_STUDENT",
  {
    studentId,
  }
);
}

export function spendCoins(
  studentId: string,
  amount: number
) {
  db.runSync(
    `
    UPDATE student
    SET coins = coins - ?
    WHERE id = ?
    `,
    [
      amount,
      studentId,
    ]
  );
addToSyncQueue(
  "SYNC_STUDENT",
  {
    studentId,
  }
);
}

export function equipMascot(
  studentId: string,
  mascotId: string
) {
  db.runSync(
    `
    UPDATE student
    SET avatar = ?
    WHERE id = ?
    `,
    [
      mascotId,
      studentId,
    ]
  );
addToSyncQueue(
  "SYNC_STUDENT",
  {
    studentId,
  }
);
}



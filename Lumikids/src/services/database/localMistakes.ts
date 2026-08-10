import { db } from "./database";
import { addToSyncQueue } from "../sync/localQueue";

export type MistakeSubject = "reading" | "math";

export interface Mistake {
  studentId: string;
  subject: MistakeSubject;
  lessonId: string;
  questionKey: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  count: number;
  synced: number;
}

export function recordMistake(
  studentId: string,
  subject: MistakeSubject,
  lessonId: string | number,
  questionKey: string | number,
  question: string,
  selectedAnswer: string,
  correctAnswer: string
) {
  db.runSync(
    `
    INSERT INTO mistakes (
      studentId, subject, lessonId, questionKey,
      question, selectedAnswer, correctAnswer, count, synced
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
    ON CONFLICT(studentId, subject, lessonId, questionKey)
    DO UPDATE SET
      question = excluded.question,
      selectedAnswer = excluded.selectedAnswer,
      correctAnswer = excluded.correctAnswer,
      count = mistakes.count + 1,
      synced = 0
    `,
    [
      studentId,
      subject,
      String(lessonId),
      String(questionKey),
      question,
      selectedAnswer,
      correctAnswer,
    ]
  );

  addToSyncQueue("SYNC_STUDENT", { studentId });
}

export function getAllMistakes(studentId: string): Mistake[] {
  return db.getAllSync(
    `
    SELECT *
    FROM mistakes
    WHERE studentId = ?
    ORDER BY count DESC, subject ASC, lessonId ASC
    `,
    [studentId]
  ) as Mistake[];
}

export function getMistakeCount(studentId: string): number {
  const result = db.getFirstSync(
    `SELECT COALESCE(SUM(count), 0) AS total FROM mistakes WHERE studentId = ?`,
    [studentId]
  ) as { total: number };

  return result.total ?? 0;
}

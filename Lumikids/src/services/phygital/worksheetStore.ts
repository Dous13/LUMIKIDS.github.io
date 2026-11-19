import { db } from "../database/database";
import { createWorksheet } from "../../data/phygitalWorksheets";
import type { GeneratedWorksheet, WorksheetAnswer } from "./worksheetTypes";
import type { WorksheetAnalysis } from "./worksheetAnalyzer";
import { WORKSHEET_LAYOUT, worksheetIdentityBits, worksheetTimestamp } from "./worksheetLayout";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getLocalStudent } from "../database/localStudent";
import { completeMathLesson, getMathProgress, isMathLessonCompleted } from "../database/localMath";
import { saveReadingAssessment } from "../database/localProgress";
import { initializeWritingProgress, getWritingProgress, completeWritingLesson } from "../database/localWriting";
import { mathLessons } from "../../data/mathLessons";
import { addToSyncQueue } from "../sync/localQueue";

export type WorksheetReview = { teacherId: string; answers: (WorksheetAnswer | null)[];
  writing: (boolean | null)[]; reviewed: boolean[] };
export type WorksheetResult = { studentId: string; instanceId: string; subject: string;
  lessonId: string; answers: (WorksheetAnswer | null)[]; writing: (boolean | null)[];
  score: number; total: number; passed: boolean; stars: number; teacherId: string; finalizedAt: string };
export type WorksheetRecord = { worksheet: GeneratedWorksheet; capture: WorksheetAnalysis | null;
  photoUri: string | null; review: WorksheetReview | null; finalized: WorksheetResult | null };
type Row = { worksheet: string; capture: string | null; photoUri: string | null; review: string | null; finalized: string | null };
const parse = (row: Row): WorksheetRecord => ({ worksheet: JSON.parse(row.worksheet),
  capture: row.capture ? JSON.parse(row.capture) : null, photoUri: row.photoUri,
  review: row.review ? JSON.parse(row.review) : null, finalized: row.finalized ? JSON.parse(row.finalized) : null });

export function getWorksheetRecord(studentId: string, instanceId: string): WorksheetRecord {
  const row = db.getFirstSync<Row>("SELECT * FROM worksheet_instances WHERE studentId = ? AND instanceId = ?", [studentId, instanceId]);
  if (!row) throw new Error("This worksheet copy is not saved for this student. Reopen its original worksheet or print a new one.");
  return parse(row);
}
export function getWorksheetHistory(studentId: string): WorksheetRecord[] {
  return db.getAllSync<Row>("SELECT * FROM worksheet_instances WHERE studentId = ? ORDER BY rowid DESC", [studentId]).map(parse);
}
export function issueWorksheet(studentId: string, subject: "reading" | "writing" | "math", lessonId: string | number, instanceId: string) {
  if (!getLocalStudent(studentId)) throw new Error("Student not found on this device.");
  const worksheet: GeneratedWorksheet = { ...createWorksheet(subject, lessonId), studentId, instanceId, templateVersion: WORKSHEET_LAYOUT.version };
  worksheetIdentityBits(worksheet);
  db.withTransactionSync(() => {
    db.runSync("INSERT INTO worksheet_instances (studentId, instanceId, worksheet) VALUES (?, ?, ?)", [studentId, instanceId, JSON.stringify(worksheet)]);
    addToSyncQueue("SYNC_WORKSHEET", { studentId, instanceId });
  });
  return worksheet;
}
export function saveWorksheetCapture(studentId: string, instanceId: string, capture: WorksheetAnalysis, photoUri: string) {
  db.withTransactionSync(() => {
    const record = getWorksheetRecord(studentId, instanceId);
    if (record.finalized) throw new Error("This copy is already finalized. Print a new copy to submit another attempt.");
    if (capture.validated !== true || capture.worksheetInstanceId !== instanceId ||
        capture.answers.length !== record.worksheet.questions.length) throw new Error("Capture does not match this worksheet.");
    const now = Date.now();
    const previous = worksheetTimestamp(record.capture?.capturedAt, now);
    const capturedAt = new Date(Math.max(now, (previous ?? 0) + 1)).toISOString();
    db.runSync("UPDATE worksheet_instances SET capture = ?, photoUri = ?, review = NULL WHERE studentId = ? AND instanceId = ?",
      [JSON.stringify({ ...capture, capturedAt }), photoUri, studentId, instanceId]);
    addToSyncQueue("SYNC_WORKSHEET", { studentId, instanceId });
  });
}

// Call only after the teacher portal verifies the student's teacherId from its existing roster.
export function cacheWorksheetReviewAccess(teacherId: string, studentId: string, classCode: string) {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM worksheet_review_access WHERE studentId = ? AND teacherId != ?", [studentId, teacherId]);
    db.runSync("INSERT OR REPLACE INTO worksheet_review_access (teacherId, studentId, classCode) VALUES (?, ?, ?)", [teacherId, studentId, classCode]);
  });
}
export function hasWorksheetReviewAccess(teacherId: string, studentId: string) {
  return !!db.getFirstSync(
    `SELECT 1 FROM worksheet_review_access a JOIN student s ON s.id = a.studentId AND s.classCode = a.classCode
     WHERE a.teacherId = ? AND a.studentId = ?`, [teacherId, studentId],
  );
}
export function revokeWorksheetReviewAccess(teacherId: string, studentId?: string) {
  if (studentId) db.runSync("DELETE FROM worksheet_review_access WHERE teacherId = ? AND studentId = ?", [teacherId, studentId]);
  else db.runSync("DELETE FROM worksheet_review_access WHERE teacherId = ?", [teacherId]);
}
export function requireWorksheetReviewer(teacherId: string, studentId: string) {
  if (!teacherId || !hasWorksheetReviewAccess(teacherId, studentId)) {
    throw new Error("Open this student in the signed-in teacher's class roster before reviewing worksheets on this device.");
  }
}
export function saveWorksheetReview(studentId: string, instanceId: string, review: WorksheetReview) {
  requireWorksheetReviewer(review.teacherId, studentId);
  const record = getWorksheetRecord(studentId, instanceId);
  if (!record.capture || record.finalized) throw new Error("Only captured, unfinalized worksheets can be reviewed.");
  if (review.reviewed.length !== 5 || review.reviewed.some(v => typeof v !== "boolean") ||
      (record.worksheet.tracing ? review.writing.length !== 5 || review.writing.some(v => v !== null && typeof v !== "boolean") :
        review.answers.length !== 5 || review.answers.some(v => v !== null && !["A", "B", "C"].includes(v)))) {
    throw new Error("Review must contain five valid answers.");
  }
  db.runSync("UPDATE worksheet_instances SET review = ? WHERE studentId = ? AND instanceId = ?", [JSON.stringify(review), studentId, instanceId]);
}

export function finalizeWorksheet(studentId: string, instanceId: string, teacherId: string): WorksheetResult {
  requireWorksheetReviewer(teacherId, studentId);
  let result!: WorksheetResult;
  db.withTransactionSync(() => {
    const record = getWorksheetRecord(studentId, instanceId);
    if (record.finalized) { result = record.finalized; return; }
    const { worksheet: w, review, capture } = record;
    if (!capture?.validated || capture.worksheetInstanceId !== instanceId || w.studentId !== studentId ||
        !review || review.teacherId !== teacherId || !review.reviewed.every(Boolean) || review.reviewed.length !== 5) {
      throw new Error("Review and confirm all five answers before finalizing.");
    }
    const score = w.tracing ? review.writing.filter(Boolean).length : w.questions.filter((q, i) => q.correctAnswer === review.answers[i]).length;
    const evaluated = evaluateQuiz(score, 5);
    const passed = w.tracing ? score === 5 : evaluated.passed;
    if (!getLocalStudent(studentId)) throw new Error("Student is not saved locally. Open the student's account on this device first.");
    if (w.subject === "math") {
      const lesson = mathLessons.find(l => l.id === Number(w.lessonId));
      if (!lesson || getMathProgress(studentId, lesson.id)?.unlocked !== 1) throw new Error("This Math level is locked.");
      completeMathLesson(studentId, lesson.id, score, 5, evaluated.stars,
        isMathLessonCompleted(studentId, lesson.id) ? 0 : lesson.xpReward, true, { type: "worksheet", instanceId });
    } else if (w.subject === "reading") {
      saveReadingAssessment(studentId, w.lessonId, score, 5, true, { type: "worksheet", instanceId });
    } else if (w.subject === "writing") {
      initializeWritingProgress(studentId);
      const progress = getWritingProgress(studentId, w.lessonId);
      if (progress?.unlocked !== 1) throw new Error("This Writing level is locked.");
      if (passed) completeWritingLesson(studentId, w.lessonId, 3, true, { type: "worksheet", instanceId });
    } else throw new Error("Unsupported worksheet subject.");
    result = { studentId, instanceId, subject: w.subject, lessonId: w.lessonId, answers: review.answers,
      writing: review.writing, score, total: 5, passed, stars: passed ? evaluated.stars : 0, teacherId, finalizedAt: new Date().toISOString() };
    db.runSync("UPDATE worksheet_instances SET finalized = ? WHERE studentId = ? AND instanceId = ?", [JSON.stringify(result), studentId, instanceId]);
    addToSyncQueue("SYNC_WORKSHEET", { studentId, instanceId });
  });
  return result;
}

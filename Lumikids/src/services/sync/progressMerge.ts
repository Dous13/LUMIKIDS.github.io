import { db } from "../database/database";
import { getAllMathProgress } from "../database/localMath";
import { getAllProgress } from "../database/localProgress";
import { getAllWritingProgress } from "../database/localWriting";
import { mathLessons } from "../../data/mathLessons";
import { bestAttempt, type AssessmentAttempt } from "../../utils/assessmentAttempt";

type Progress = Partial<AssessmentAttempt> & {
  unlocked?: boolean | number;
  completed?: boolean | number;
  stars?: number;
  xpEarned?: number;
};
type ProgressMap = Record<string, Progress>;
export const progressTables = {
  readingProgress: "lesson_progress",
  writingProgress: "writing_progress",
  mathProgress: "math_progress",
} as const;
type Subject = keyof typeof progressTables;
export type StudentProgress = Record<Subject, ProgressMap>;
type ProgressRow = Progress & { lessonId: string | number };
export const flag = (value: unknown) => value === true || value === 1;
const numeric = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

function byLesson(rows: ProgressRow[]) {
  return Object.fromEntries(rows.map(({ lessonId, unlocked, completed, stars, quizScore, quizTotal, xpEarned }) => [
    String(lessonId), { unlocked, completed, stars, quizScore, quizTotal, xpEarned },
  ]));
}

export function readLocalProgress(studentId: string): StudentProgress {
  return {
    readingProgress: byLesson(getAllProgress(studentId)),
    writingProgress: byLesson(getAllWritingProgress(studentId)),
    mathProgress: byLesson(getAllMathProgress(studentId)),
  };
}

function mergeLesson(subject: Subject, existing?: Progress, candidate?: Progress): Progress {
  const combined: Progress = {
    unlocked: flag(existing?.unlocked) || flag(candidate?.unlocked),
    completed: flag(existing?.completed) || flag(candidate?.completed),
    stars: Math.max(numeric(existing?.stars), numeric(candidate?.stars)),
  };
  if (subject !== "writingProgress") {
    const winner = bestAttempt(existing, candidate);
    combined.quizScore = numeric(winner?.quizScore);
    combined.quizTotal = numeric(winner?.quizTotal);
  }
  if (subject === "mathProgress") combined.xpEarned = Math.max(numeric(existing?.xpEarned), numeric(candidate?.xpEarned));
  return combined;
}

export function mergeProgress(existing: Partial<StudentProgress>, candidate: Partial<StudentProgress>): StudentProgress {
  const result: StudentProgress = { readingProgress: {}, writingProgress: {}, mathProgress: {} };
  for (const subject of Object.keys(progressTables) as Subject[]) {
    const lessons = new Map<string, Progress>();
    for (const source of [existing[subject], candidate[subject]]) {
      if (!source || typeof source !== "object" || Array.isArray(source)) continue;
      for (const [key, attempt] of Object.entries(source)) {
        if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) continue;
        const id = subject === "mathProgress" ? String(Number(key)) : key;
        if (subject === "mathProgress" && !mathLessons.some(lesson => String(lesson.id) === id)) continue;
        lessons.set(id, mergeLesson(subject, lessons.get(id), attempt));
      }
    }
    result[subject] = Object.fromEntries(lessons);
  }
  return result;
}

export function applyLocalProgress(studentId: string, cloud: Partial<StudentProgress>) {
  const local = readLocalProgress(studentId);
  const merged = mergeProgress(local, cloud);
  const cloudOnly = mergeProgress({}, cloud);
  let needsUpload = false;
  for (const subject of Object.keys(progressTables) as Subject[]) {
    const table = progressTables[subject];
    const assessed = subject !== "writingProgress";
    const math = subject === "mathProgress";
    const columns = ["unlocked", "completed", "stars", ...(assessed ? ["quizScore", "quizTotal"] : []), ...(math ? ["xpEarned"] : [])];
    for (const [id, progress] of Object.entries(merged[subject])) {
      const remote = cloudOnly[subject][id];
      const ahead = remote
        ? JSON.stringify(progress) !== JSON.stringify(remote)
        : flag(progress.unlocked) || flag(progress.completed) || (progress.stars ?? 0) > 0 ||
          (progress.quizTotal ?? 0) > 0 || (progress.quizScore ?? 0) > 0;
      needsUpload ||= ahead;
      const values = [Number(progress.unlocked), Number(progress.completed), progress.stars ?? 0,
        ...(assessed ? [progress.quizScore ?? 0, progress.quizTotal ?? 0] : []), ...(math ? [progress.xpEarned ?? 0] : [])];
      db.runSync(
        `INSERT INTO ${table} (studentId, lessonId, ${columns.join(", ")}, synced)
         VALUES (?, ?, ${columns.map(() => "?").join(", ")}, ?)
         ON CONFLICT(studentId, lessonId) DO UPDATE SET
         ${columns.map(column => `${column} = excluded.${column}`).join(", ")},
         synced = MIN(${table}.synced, excluded.synced)`,
        [studentId, id, ...values, ahead ? 0 : 1],
      );
    }
  }
  return needsUpload;
}

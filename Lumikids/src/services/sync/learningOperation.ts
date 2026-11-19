import type { TraceStroke } from "../writing/tracingValidator";

export type LetterTrace = { width: number; height: number; strokes: TraceStroke[] };
export type LearningOperation =
  | { type: "quiz"; subject: "reading" | "math"; lessonId: string; answers: readonly string[] }
  | { type: "mistake"; subject: "reading" | "math"; lessonId: string; questionIndex: number; answer: string }
  | { type: "trace"; lessonId: string; phases: LetterTrace[][] }
  | { type: "purchase" | "equip"; mascotId: string };

// Worksheet progress is confirmed by the teacher publication, independently of the student queue.
export type LocalLearningOperation = LearningOperation | { type: "worksheet"; instanceId: string };

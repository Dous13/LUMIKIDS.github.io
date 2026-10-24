
export type WorksheetAnswer = "A" | "B" | "C";

export type WorksheetSubject =
  | "reading"
  | "writing"
  | "math"
  | "science"
  | "social-skills";

export interface WorksheetChoice {
  id: WorksheetAnswer;
  text: string;
  image?: string;
}

export interface WorksheetQuestion {
  id: string;
  prompt: string;
  illustration?: string;
  choices: WorksheetChoice[];
  correctAnswer: WorksheetAnswer;
  difficulty: number;
}

export interface GeneratedWorksheet {
  id: string;
  title: string;
  subject: WorksheetSubject;
  ageRange: {
    min: number;
    max: number;
  };
  lessonId: string;
  questions: WorksheetQuestion[];
  createdAt: string;
}

export type WorksheetResponseStatus =
  | "recognized"
  | "blank"
  | "ambiguous"
  | "multiple-marks"
  | "unreadable";

export interface WorksheetResponse {
  questionId: string;
  answer: WorksheetAnswer | null;
  status: WorksheetResponseStatus;
  confidence: number;
}


import { mathQuizzes } from "./mathQuizzes";
import { mathLessons } from "./mathLessons";
import { readingLessons } from "./readingLessons";
import { readingQuizzes } from "./readingQuizzes";
import { writingLessons } from "./writingLessons";

import type {
  GeneratedWorksheet,
  WorksheetAnswer,
  WorksheetQuestion,
} from "../services/phygital/worksheetTypes";

const ANSWER_LABELS: WorksheetAnswer[] = ["A", "B", "C"];
const QUESTIONS_PER_MATH_WORKSHEET = 3;

function mapQuestions(
  questions: Array<{
    id: string | number;
    question: string;
    choices: string[];
    answer: string;
    image?: string;
    emoji?: string;
  }>,
  subject: "reading" | "math",
  lessonId: string
): WorksheetQuestion[] {
  return questions.map((question) => {
    if (question.choices.length !== 3) {
      throw new Error(
        `${subject} question ${question.id} must have exactly three choices.`
      );
    }

    const correctIndex = question.choices.findIndex(
      (choice) => choice === question.answer
    );

    if (correctIndex === -1) {
      throw new Error(
        `${subject} question ${question.id} has no matching correct answer.`
      );
    }

    return {
      id: `${subject}-${lessonId}-${question.id}`,
      prompt: question.question,
      illustration: question.emoji ?? question.image,
      choices: question.choices.map((text, index) => ({
        id: ANSWER_LABELS[index],
        text,
      })),
      correctAnswer: ANSWER_LABELS[correctIndex],
      difficulty: 1,
    };
  });
}

export function createMathWorksheet(
  lessonId: number
): GeneratedWorksheet {
  const lesson = mathLessons.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    throw new Error(`Math lesson ${lessonId} was not found.`);
  }

  const selectedQuestions = mathQuizzes
    .filter((question) => question.lessonId === lessonId)
    .slice(0, QUESTIONS_PER_MATH_WORKSHEET);

  if (selectedQuestions.length !== QUESTIONS_PER_MATH_WORKSHEET) {
    throw new Error(
      `Math lesson ${lessonId} does not have enough questions.`
    );
  }

  const questions = mapQuestions(
    selectedQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      choices: question.options,
      answer: question.correctAnswer,
      emoji: question.emoji,
    })),
    "math",
    String(lessonId)
  );

  return {
    id: `math-worksheet-${lessonId}`,
    title: `${lesson.title} Worksheet`,
    subject: "math",
    ageRange: { min: 3, max: 8 },
    lessonId: String(lessonId),
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function createReadingWorksheet(
  lessonId: string
): GeneratedWorksheet {
  const lesson = readingLessons.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    throw new Error(`Reading lesson ${lessonId} was not found.`);
  }

  const lessonQuiz = readingQuizzes[lessonId] as Array<{
    id: number;
    question: string;
    choices: string[];
    answer: string;
    image?: string;
  }> | undefined;

  if (!lessonQuiz) {
    throw new Error(
      `No reading assessment was found for lesson ${lessonId}.`
    );
  }

  // The fifth item is a completion prompt, not an assessment question.
  const selectedQuestions = lessonQuiz.filter(
    (question) => question.choices.length === 3
  );

  if (selectedQuestions.length === 0) {
    throw new Error(
      `Reading lesson ${lessonId} has no printable questions.`
    );
  }

  const questions = mapQuestions(
    selectedQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      choices: question.choices,
      answer: question.answer,
      image: question.image,
    })),
    "reading",
    lessonId
  );

  return {
    id: `reading-worksheet-${lessonId}`,
    title: `Letter ${lesson.letter} Worksheet`,
    subject: "reading",
    ageRange: { min: 3, max: 8 },
    lessonId,
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function createWritingWorksheet(
  lessonId: string
): GeneratedWorksheet {
  const lesson = writingLessons.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    throw new Error(`Writing lesson ${lessonId} was not found.`);
  }

  return {
    id: `writing-worksheet-${lessonId}`,
    title: `Letter ${lesson.letter} Tracing Worksheet`,
    subject: "writing",
    ageRange: { min: 3, max: 8 },
    lessonId,
    questions: [],
    tracing: {
      uppercase: lesson.letter.toUpperCase(),
      lowercase: lesson.letter.toLowerCase(),
      word: lesson.traceWord,
      emoji: lesson.emoji,
    },
    createdAt: new Date().toISOString(),
  };
}

export function createWorksheet(
  subject: "reading" | "writing" | "math",
  lessonId: string | number
): GeneratedWorksheet {
  switch (subject) {
    case "reading":
      return createReadingWorksheet(String(lessonId));

    case "writing":
      return createWritingWorksheet(String(lessonId));

    case "math":
      return createMathWorksheet(Number(lessonId));

    default:
      throw new Error("Unsupported worksheet subject.");
  }
}

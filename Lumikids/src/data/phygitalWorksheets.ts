
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
const QUESTIONS_PER_WORKSHEET = 3;

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const QUESTION_TOP_MM = [77, 114, 151];
const BUBBLE_TOP_OFFSET_MM = 27;

const CHOICE_CENTER_X_MM = [
  16 + (178 / 6),
  16 + (178 / 2),
  16 + (178 * 5 / 6),
];

function createBubbleLayout(
  questions: WorksheetQuestion[]
) {
  return {
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm: A4_HEIGHT_MM,
    positions: questions.flatMap((question, questionIndex) =>
      question.choices.map((choice, choiceIndex) => ({
        questionId: question.id,
        answer: choice.id,
        x: CHOICE_CENTER_X_MM[choiceIndex] / A4_WIDTH_MM,
        y:
          (QUESTION_TOP_MM[questionIndex] +
            BUBBLE_TOP_OFFSET_MM) /
          A4_HEIGHT_MM,
      }))
    ),
  };
}

function mapQuestions(
  items: {
    id: string | number;
    question: string;
    image?: string;
    emoji?: string;
    choices: string[];
    answer: string;
  }[],
  subject: "reading" | "math",
  lessonId: string
): WorksheetQuestion[] {
  const selected = items.slice(0, QUESTIONS_PER_WORKSHEET);

  if (selected.length !== QUESTIONS_PER_WORKSHEET) {
    throw new Error(
      `${subject} lesson ${lessonId} does not have enough questions.`
    );
  }

  return selected.map((item) => {
    if (item.choices.length !== 3) {
      throw new Error(
        `Question ${item.id} must have exactly three choices.`
      );
    }

    const correctIndex = item.choices.findIndex(
      (choice) => choice === item.answer
    );

    if (correctIndex === -1) {
      throw new Error(
        `Question ${item.id} has no matching correct answer.`
      );
    }

    return {
      id: `${subject}-${lessonId}-${item.id}`,
      prompt: item.question,
      illustration: item.emoji ?? item.image,
      choices: item.choices.map((text, index) => ({
        id: ANSWER_LABELS[index],
        text,
      })),
      correctAnswer: ANSWER_LABELS[correctIndex],
      difficulty: 1,
    };
  });
}

function createReadingWorksheet(
  lessonId: string
): GeneratedWorksheet {
  const lesson = readingLessons.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    throw new Error(`Reading lesson ${lessonId} was not found.`);
  }

  const quiz = readingQuizzes[lessonId];

  if (!quiz) {
    throw new Error(
      `Reading quiz for lesson ${lessonId} was not found.`
    );
  }

  const questions = mapQuestions(
    quiz.map((item) => ({
      id: item.id,
      question: item.question,
      image: item.image,
      choices: item.choices,
      answer: item.answer,
    })),
    "reading",
    lessonId
  );

  return {
    id: `reading-worksheet-${lessonId}`,
    title: `Letter ${lesson.letter} Worksheet`,
    subject: "reading",
    ageRange: { min: 3, max: 5 },
    lessonId,
    questions,
    bubbleLayout: createBubbleLayout(questions),
    createdAt: new Date().toISOString(),
  };
}

function createWritingWorksheet(
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
    ageRange: { min: 3, max: 5 },
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
  const id = String(lessonId);

  if (subject === "reading") {
    return createReadingWorksheet(id);
  }

  if (subject === "writing") {
    return createWritingWorksheet(id);
  }

  const numericId = Number(lessonId);

  const lesson = mathLessons.find(
    (item) => item.id === numericId
  );

  if (!lesson) {
    throw new Error(`Math lesson ${lessonId} was not found.`);
  }

  const quiz = mathQuizzes.filter(
    (item) => item.lessonId === numericId
  );

  const questions = mapQuestions(
    quiz.map((item) => ({
      id: item.id,
      question: item.question,
      emoji: item.emoji,
      choices: item.options,
      answer: item.correctAnswer,
    })),
    "math",
    String(numericId)
  );

  return {
    id: `math-worksheet-${numericId}`,
    title: `${lesson.title} Worksheet`,
    subject: "math",
    ageRange: { min: 3, max: 5 },
    lessonId: String(numericId),
    questions,
    createdAt: new Date().toISOString(),
  };
}

// Keep the original export so existing Math imports still work.
export function createMathWorksheet(
  lessonId: number,
  questionIds?: number[]
): GeneratedWorksheet {
  const lesson = mathLessons.find(
    (item) => item.id === lessonId
  );

  if (!lesson) {
    throw new Error(`Math lesson ${lessonId} was not found.`);
  }

  const quiz = mathQuizzes.filter(
    (item) => item.lessonId === lessonId
  );

  const selected = questionIds
    ? questionIds.map((id) => {
        const question = quiz.find((item) => item.id === id);

        if (!question) {
          throw new Error(
            `Question ${id} does not belong to Math lesson ${lessonId}.`
          );
        }

        return question;
      })
    : quiz.slice(0, QUESTIONS_PER_WORKSHEET);

  const questions = mapQuestions(
    selected.map((item) => ({
      id: item.id,
      question: item.question,
      emoji: item.emoji,
      choices: item.options,
      answer: item.correctAnswer,
    })),
    "math",
    String(lessonId)
  );

  return {
    id: `math-worksheet-${lessonId}`,
    title: `${lesson.title} Worksheet`,
    subject: "math",
    ageRange: { min: 3, max: 5 },
    lessonId: String(lessonId),
    questions,
    createdAt: new Date().toISOString(),
  };
}

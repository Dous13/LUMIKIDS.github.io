
import { mathQuizzes } from "./mathQuizzes";
import { mathLessons } from "./mathLessons";
import { readingLessons } from "./readingLessons";
import { createBubbleLayout } from "../services/phygital/worksheetLayout";
import { writingLessons } from "./writingLessons";

import type {
  GeneratedWorksheet,
  WorksheetAnswer,
  WorksheetQuestion,
} from "../services/phygital/worksheetTypes";

const ANSWER_LABELS: WorksheetAnswer[] = ["A", "B", "C"];
const QUESTIONS_PER_WORKSHEET = 5;

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
  const selected = items;

  if (selected.length !== QUESTIONS_PER_WORKSHEET) {
    throw new Error(
      `${subject} lesson ${lessonId} does not have enough questions.`
    );
  }

  if (new Set(selected.map(item => item.id)).size !== 5 ||
      new Set(selected.map(item => JSON.stringify([item.question, item.emoji, item.image, item.choices]))).size !== 5) {
    throw new Error("A worksheet must contain five distinct questions.");
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

  // Physical choices remain stable across restarts; digital quizzes are unchanged.
  const others = readingLessons.filter(item => item.id !== lessonId);
  const choices = (answer: string, values: string[]) =>
    [answer, ...Array.from(new Set(values)).filter(value => value !== answer).slice(0, 2)];
  const raw = [
    { id: 1, question: "Which letter is shown?", image: lesson.letter, choices: choices(lesson.letter, others.map(l => l.letter)), answer: lesson.letter },
    { id: 2, question: "Which word starts with " + lesson.letter + "?", choices: choices(lesson.word, others.map(l => l.word)), answer: lesson.word },
    { id: 3, question: "Which picture starts with " + lesson.letter + "?", choices: choices(lesson.emoji, others.map(l => l.emoji)), answer: lesson.emoji },
    { id: 4, question: "Which small letter matches " + lesson.letter + "?", choices: choices(lesson.letter.toLowerCase(), others.map(l => l.letter.toLowerCase())), answer: lesson.letter.toLowerCase() },
    { id: 5, question: "Which word matches the picture?", image: lesson.emoji, choices: choices(lesson.word, others.map(l => l.word)), answer: lesson.word },
  ];
  const questions = mapQuestions(raw.map((item, i) => ({ ...item,
    choices: [...item.choices.slice(i % 3), ...item.choices.slice(0, i % 3)] })), "reading", lessonId);

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
      activities: [
        { id: "uppercase", prompt: "Trace the uppercase letter", target: lesson.letter.toUpperCase(), trace: true },
        { id: "lowercase", prompt: "Trace the lowercase letter", target: lesson.letter.toLowerCase(), trace: true },
        { id: "word", prompt: "Trace the word", target: lesson.traceWord, trace: true },
        { id: "write-letter", prompt: "Write the letter on your own", target: lesson.letter.toUpperCase(), trace: false },
        { id: "write-word", prompt: "Write the word on your own", target: lesson.traceWord, trace: false },
      ],
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
    quiz.slice(0, QUESTIONS_PER_WORKSHEET).map((item) => ({
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
    bubbleLayout: createBubbleLayout(questions),
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
    bubbleLayout: createBubbleLayout(questions),
    createdAt: new Date().toISOString(),
  };
}

import { readingLessons } from "./readingLessons";
import { mathQuizzes } from "./mathQuizzes";

export type RemedialQuestion = {
  id: string;
  question: string;
  image?: string;
  emoji?: string;
  choices: string[];
  answer: string;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getReadingQuestions(lessonId: string): RemedialQuestion[] {
  const lesson = readingLessons.find(item => item.id === lessonId);

  if (!lesson) return [];

  const letterIndex = LETTERS.indexOf(lesson.letter);
  const distractorLetters = [
    LETTERS[(letterIndex + 1) % LETTERS.length],
    LETTERS[(letterIndex + 2) % LETTERS.length],
  ];

  const otherWords = readingLessons
    .filter(item => item.id !== lessonId)
    .slice(0, 2)
    .map(item => item.word);

  const otherEmojis = readingLessons
    .filter(item => item.id !== lessonId)
    .slice(0, 2)
    .map(item => item.emoji);

  return [
    {
      id: "reading-remedial-1",
      question: `Find the letter ${lesson.letter}.`,
      image: lesson.emoji,
      choices: [lesson.letter, ...distractorLetters],
      answer: lesson.letter,
    },
    {
      id: "reading-remedial-2",
      question: `Which word begins with ${lesson.letter}?`,
      choices: [lesson.word, ...otherWords],
      answer: lesson.word,
    },
    {
      id: "reading-remedial-3",
      question: `Find the picture that represents ${lesson.word}.`,
      choices: [lesson.emoji, ...otherEmojis],
      answer: lesson.emoji,
    },
  ];
}

function getMathQuestions(lessonId: number): RemedialQuestion[] {
  const lessonQuestions = mathQuizzes.filter(
    question => question.lessonId === lessonId
  );

  if (lessonQuestions.length === 0) return [];

  // Use different questions from the same lesson's learning objective.
  // These are additional practice examples, not copied quiz questions.
  switch (lessonId) {
    case 1:
      return [
        {
          id: "math-remedial-1",
          question: "How many bananas are there?",
          emoji: "🍌 🍌 🍌 🍌",
          choices: ["3", "4", "5"],
          answer: "4",
        },
        {
          id: "math-remedial-2",
          question: "Count the hearts.",
          emoji: "❤️ ❤️ ❤️ ❤️ ❤️",
          choices: ["4", "5", "6"],
          answer: "5",
        },
        {
          id: "math-remedial-3",
          question: "How many butterflies can you see?",
          emoji: "🦋 🦋 🦋",
          choices: ["2", "3", "4"],
          answer: "3",
        },
      ];

    case 2:
      return [
        {
          id: "math-remedial-1",
          question: "What is 1 + 2?",
          emoji: "🍎 + 🍎 🍎",
          choices: ["2", "3", "4"],
          answer: "3",
        },
        {
          id: "math-remedial-2",
          question: "What is 4 + 1?",
          emoji: "⭐ ⭐ ⭐ ⭐ + ⭐",
          choices: ["4", "5", "6"],
          answer: "5",
        },
        {
          id: "math-remedial-3",
          question: "What is 2 + 3?",
          emoji: "🍓 🍓 + 🍓 🍓 🍓",
          choices: ["4", "5", "6"],
          answer: "5",
        },
      ];

    case 3:
      return [
        {
          id: "math-remedial-1",
          question: "What is 3 - 2?",
          emoji: "🍎 🍎 🍎",
          choices: ["1", "2", "3"],
          answer: "1",
        },
        {
          id: "math-remedial-2",
          question: "What is 5 - 1?",
          emoji: "⭐ ⭐ ⭐ ⭐ ⭐",
          choices: ["3", "4", "5"],
          answer: "4",
        },
        {
          id: "math-remedial-3",
          question: "What is 4 - 2?",
          emoji: "🍓 🍓 🍓 🍓",
          choices: ["1", "2", "3"],
          answer: "2",
        },
      ];

    case 4:
      return [
        {
          id: "math-remedial-1",
          question: "Which shape has three sides?",
          emoji: "🔺",
          choices: ["Circle", "Triangle", "Square"],
          answer: "Triangle",
        },
        {
          id: "math-remedial-2",
          question: "Which shape is round?",
          emoji: "🔴",
          choices: ["Square", "Rectangle", "Circle"],
          answer: "Circle",
        },
        {
          id: "math-remedial-3",
          question: "Which shape has four equal sides?",
          emoji: "🟦",
          choices: ["Triangle", "Square", "Circle"],
          answer: "Square",
        },
      ];

    case 5:
      return [
        {
          id: "math-remedial-1",
          question: "What comes next? 🔴 🔵 🔴 🔵",
          emoji: "❓",
          choices: ["🟢", "🔴", "🟡"],
          answer: "🔴",
        },
        {
          id: "math-remedial-2",
          question: "What comes next? ⭐ 🌙 ⭐ 🌙",
          emoji: "❓",
          choices: ["☀️", "🌙", "⭐"],
          answer: "⭐",
        },
        {
          id: "math-remedial-3",
          question: "What comes next? 🍎 🍌 🍎 🍌",
          emoji: "❓",
          choices: ["🍇", "🍎", "🍌"],
          answer: "🍎",
        },
      ];

    default:
      return [];
  }
}

export function getRemedialQuestions(
  subject: "reading" | "math",
  lessonId: string | number
): RemedialQuestion[] {
  if (subject === "reading") {
    return getReadingQuestions(String(lessonId));
  }

  return getMathQuestions(Number(lessonId));
}
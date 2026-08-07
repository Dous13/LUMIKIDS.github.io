
export interface MathQuestion {
  id: number;
  lessonId: number;
  question: string;
  emoji: string;
  options: string[];
  correctAnswer: string;
}

export const mathQuizzes: MathQuestion[] = [
  {
    id: 1,
    lessonId: 1,
    question: "How many apples are there?",
    emoji: "🍎",
    options: ["1", "2", "3"],
    correctAnswer: "1",
  },

  {
    id: 2,
    lessonId: 1,
    question: "Count the apples.",
    emoji: "🍎🍎",
    options: ["2", "3", "4"],
    correctAnswer: "2",
  },

  {
    id: 3,
    lessonId: 1,
    question: "How many apples can you see?",
    emoji: "🍎🍎🍎",
    options: ["2", "3", "4"],
    correctAnswer: "3",
  },

  {
    id: 4,
    lessonId: 1,
    question: "Count the apples.",
    emoji: "🍎🍎🍎🍎",
    options: ["3", "4", "5"],
    correctAnswer: "4",
  },

  {
    id: 5,
    lessonId: 1,
    question: "How many apples are there?",
    emoji: "🍎🍎🍎🍎🍎",
    options: ["5", "4", "6"],
    correctAnswer: "5",
  },

  {
    id: 6,
    lessonId: 1,
    question: "Count the strawberries.",
    emoji: "🍓🍓🍓🍓🍓🍓",
    options: ["5", "6", "7"],
    correctAnswer: "6",
  },

  {
    id: 7,
    lessonId: 1,
    question: "How many stars do you see?",
    emoji: "⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐",
    options: ["6", "7", "8"],
    correctAnswer: "7",
  },

  {
    id: 8,
    lessonId: 1,
    question: "Count the fish.",
    emoji: "🐠 🐠 🐠 🐠 🐠 🐠 🐠 🐠",
    options: ["8", "7", "9"],
    correctAnswer: "8",
  },

  {
    id: 9,
    lessonId: 1,
    question: "How many flowers are there?",
    emoji: "🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸",
    options: ["8", "9", "10"],
    correctAnswer: "9",
  },

  {
    id: 10,
    lessonId: 1,
    question: "Count the balloons.",
    emoji: "🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈",
    options: ["9", "10", "8"],
    correctAnswer: "10",
  },
];


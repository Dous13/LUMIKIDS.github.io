export interface MathQuestion {
  id: number;
  lessonId: number;
  question: string;
  emoji: string;
  options: string[];
  correctAnswer: string;
}

export const mathQuizzes: MathQuestion[] = [
  // Counting 1–10
  { id: 1, lessonId: 1, question: "How many apples are there?", emoji: "🍎", options: ["1", "2", "3"], correctAnswer: "1" },
  { id: 2, lessonId: 1, question: "Count the apples.", emoji: "🍎 🍎", options: ["2", "3", "4"], correctAnswer: "2" },
  { id: 3, lessonId: 1, question: "How many apples can you see?", emoji: "🍎 🍎 🍎", options: ["2", "3", "4"], correctAnswer: "3" },
  { id: 4, lessonId: 1, question: "Count the apples.", emoji: "🍎 🍎 🍎 🍎", options: ["3", "4", "5"], correctAnswer: "4" },
  { id: 5, lessonId: 1, question: "How many apples are there?", emoji: "🍎 🍎 🍎 🍎 🍎", options: ["5", "4", "6"], correctAnswer: "5" },
  { id: 6, lessonId: 1, question: "Count the strawberries.", emoji: "🍓 🍓 🍓 🍓 🍓 🍓", options: ["5", "6", "7"], correctAnswer: "6" },
  { id: 7, lessonId: 1, question: "How many stars do you see?", emoji: "⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐", options: ["6", "7", "8"], correctAnswer: "7" },
  { id: 8, lessonId: 1, question: "Count the fish.", emoji: "🐠 🐠 🐠 🐠 🐠 🐠 🐠 🐠", options: ["8", "7", "9"], correctAnswer: "8" },
  { id: 9, lessonId: 1, question: "How many flowers are there?", emoji: "🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸", options: ["8", "9", "10"], correctAnswer: "9" },
  { id: 10, lessonId: 1, question: "Count the balloons.", emoji: "🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈", options: ["9", "10", "8"], correctAnswer: "10" },

  // Addition
  { id: 11, lessonId: 2, question: "What is 1 + 1?", emoji: "🍎 🍎", options: ["1", "2", "3"], correctAnswer: "2" },
  { id: 12, lessonId: 2, question: "What is 2 + 1?", emoji: "🍎 🍎 + 🍎", options: ["2", "3", "4"], correctAnswer: "3" },
  { id: 13, lessonId: 2, question: "What is 2 + 2?", emoji: "⭐ ⭐ + ⭐ ⭐", options: ["3", "4", "5"], correctAnswer: "4" },
  { id: 14, lessonId: 2, question: "What is 3 + 2?", emoji: "🐟 🐟 🐟 + 🐟 🐟", options: ["4", "5", "6"], correctAnswer: "5" },
  { id: 15, lessonId: 2, question: "What is 3 + 3?", emoji: "🍓 🍓 🍓 + 🍓 🍓 🍓", options: ["5", "6", "7"], correctAnswer: "6" },

  // Subtraction
  { id: 21, lessonId: 3, question: "What is 2 - 1?", emoji: "🍎 🍎", options: ["1", "2", "3"], correctAnswer: "1" },
  { id: 22, lessonId: 3, question: "What is 3 - 1?", emoji: "⭐ ⭐ ⭐", options: ["1", "2", "3"], correctAnswer: "2" },
  { id: 23, lessonId: 3, question: "What is 4 - 1?", emoji: "🍓 🍓 🍓 🍓", options: ["2", "3", "4"], correctAnswer: "3" },
  { id: 24, lessonId: 3, question: "What is 5 - 2?", emoji: "🐟 🐟 🐟 🐟 🐟", options: ["2", "3", "4"], correctAnswer: "3" },
  { id: 25, lessonId: 3, question: "What is 6 - 3?", emoji: "🎈 🎈 🎈 🎈 🎈 🎈", options: ["2", "3", "4"], correctAnswer: "3" },

  // Shapes
  { id: 31, lessonId: 4, question: "Which shape is round?", emoji: "🔴", options: ["Circle", "Square", "Triangle"], correctAnswer: "Circle" },
  { id: 32, lessonId: 4, question: "Which shape has 3 sides?", emoji: "🔺", options: ["Circle", "Square", "Triangle"], correctAnswer: "Triangle" },
  { id: 33, lessonId: 4, question: "Which shape has 4 equal sides?", emoji: "🟦", options: ["Circle", "Square", "Triangle"], correctAnswer: "Square" },
  { id: 34, lessonId: 4, question: "How many corners does a triangle have?", emoji: "🔺", options: ["2", "3", "4"], correctAnswer: "3" },
  { id: 35, lessonId: 4, question: "Which shape has no corners?", emoji: "🔴", options: ["Triangle", "Square", "Circle"], correctAnswer: "Circle" },

  // Patterns
  { id: 41, lessonId: 5, question: "What comes next? 🔴 🔵 🔴 🔵", emoji: "❓", options: ["🔴", "🔵", "🟢"], correctAnswer: "🔴" },
  { id: 42, lessonId: 5, question: "What comes next? ⭐ 🌙 ⭐ 🌙", emoji: "❓", options: ["⭐", "🌙", "☀️"], correctAnswer: "⭐" },
  { id: 43, lessonId: 5, question: "What comes next? 🍎 🍌 🍎 🍌", emoji: "❓", options: ["🍎", "🍌", "🍇"], correctAnswer: "🍎" },
  { id: 44, lessonId: 5, question: "What comes next? 🔺 🔺 🟦 🔺 🔺 🟦", emoji: "❓", options: ["🔺", "🟦", "🔴"], correctAnswer: "🔺" },
  { id: 45, lessonId: 5, question: "What comes next? 🟢 🟡 🟢 🟡", emoji: "❓", options: ["🟢", "🟡", "🔵"], correctAnswer: "🟢" },
];

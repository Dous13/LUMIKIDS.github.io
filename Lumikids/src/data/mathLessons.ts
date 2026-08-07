export interface MathLesson {
  id: number;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
}

export const mathLessons: MathLesson[] = [
  {
    id: 1,
    title: "Counting 1–10",
    description: "Learn how to count numbers from 1 to 10.",
    emoji: "🔢",
    xpReward: 50,
  },

  {
    id: 2,
    title: "Addition",
    description: "Let's add small numbers together.",
    emoji: "➕",
    xpReward: 60,
  },

  {
    id: 3,
    title: "Subtraction",
    description: "Take away objects to learn subtraction.",
    emoji: "➖",
    xpReward: 70,
  },

  {
    id: 4,
    title: "Shapes",
    description: "Recognize circles, squares and triangles.",
    emoji: "🔺",
    xpReward: 80,
  },

  {
    id: 5,
    title: "Patterns",
    description: "Complete simple patterns.",
    emoji: "⭐",
    xpReward: 90,
  },
];
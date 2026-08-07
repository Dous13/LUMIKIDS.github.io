export interface MathLessonPage {
  value: number;
  emoji: string;
  title: string;
  description: string;
}

export interface MathLesson {
  id: number;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  pages: MathLessonPage[];
}

export const mathLessons: MathLesson[] = [
  {
    id: 1,
    title: "Counting 1–10",
    description: "Learn to count numbers from one to ten.",
    emoji: "🔢",
    xpReward: 50,

    pages: [
      {
        value: 1,
        emoji: "🍎",
        title: "Number One",
        description: "This is ONE apple.",
      },

      {
        value: 2,
        emoji: "🍎🍎",
        title: "Number Two",
        description: "Let's count together: ONE... TWO!",
      },

      {
        value: 3,
        emoji: "🍎🍎🍎",
        title: "Number Three",
        description: "Great! There are THREE apples.",
      },

      {
        value: 4,
        emoji: "🍎🍎🍎🍎",
        title: "Number Four",
        description: "Can you count FOUR apples?",
      },

      {
        value: 5,
        emoji: "🍎🍎🍎🍎🍎",
        title: "Number Five",
        description: "Fantastic! There are FIVE apples.",
      },

      {
        value: 6,
        emoji: "🍓🍓🍓🍓🍓🍓",
        title: "Number Six",
        description: "Now let's count SIX strawberries.",
      },

      {
        value: 7,
        emoji: "⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐",
        title: "Number Seven",
        description: "Wow! There are SEVEN stars.",
      },

      {
        value: 8,
        emoji: "🐠 🐠 🐠 🐠 🐠 🐠 🐠 🐠",
        title: "Number Eight",
        description: "Can you count EIGHT fish?",
      },

      {
        value: 9,
        emoji: "🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸",
        title: "Number Nine",
        description: "Excellent! There are NINE flowers.",
      },

      {
        value: 10,
        emoji: "🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈 🎈",
        title: "Number Ten",
        description: "Amazing! You counted TEN balloons!",
      },
    ],
  },

  {
    id: 2,
    title: "Addition",
    description: "Let's add small numbers together.",
    emoji: "➕",
    xpReward: 60,
    pages: [],
  },

  {
    id: 3,
    title: "Subtraction",
    description: "Take away objects to learn subtraction.",
    emoji: "➖",
    xpReward: 70,
    pages: [],
  },

  {
    id: 4,
    title: "Shapes",
    description: "Learn different shapes.",
    emoji: "🔺",
    xpReward: 80,
    pages: [],
  },

  {
    id: 5,
    title: "Patterns",
    description: "Complete simple patterns.",
    emoji: "⭐",
    xpReward: 90,
    pages: [],
  },
];


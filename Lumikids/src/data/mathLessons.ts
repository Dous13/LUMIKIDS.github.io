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
        description: "This is ONE apple. Can you say one?",
      },
      {
        value: 2,
        emoji: "🍎 🍎",
        title: "Number Two",
        description: "Let's count together: ONE... TWO!",
      },
      {
        value: 3,
        emoji: "🍎 🍎 🍎",
        title: "Number Three",
        description: "Great! There are THREE apples.",
      },
      {
        value: 4,
        emoji: "🍎 🍎 🍎 🍎",
        title: "Number Four",
        description: "Can you count FOUR apples?",
      },
      {
        value: 5,
        emoji: "🍎 🍎 🍎 🍎 🍎",
        title: "Number Five",
        description: "Fantastic! There are FIVE apples.",
      },
      {
        value: 6,
        emoji: "🍓 🍓 🍓 🍓 🍓 🍓",
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
    description: "Learn to put groups of numbers together.",
    emoji: "➕",
    xpReward: 60,
    pages: [
      { value: 1, emoji: "🍎 + 🍎", title: "One Plus One", description: "One apple plus one apple makes TWO apples." },
      { value: 2, emoji: "🍎 🍎 + 🍎", title: "Two Plus One", description: "Two apples plus one apple makes THREE apples." },
      { value: 3, emoji: "⭐ ⭐ + ⭐ ⭐", title: "Two Plus Two", description: "Two stars plus two stars makes FOUR stars." },
      { value: 4, emoji: "🐟 🐟 🐟 + 🐟 🐟", title: "Three Plus Two", description: "Three fish plus two fish makes FIVE fish." },
      { value: 5, emoji: "🍓 🍓 🍓 + 🍓 🍓 🍓", title: "Three Plus Three", description: "Three strawberries plus three strawberries makes SIX." },
    ],
  },
  {
    id: 3,
    title: "Subtraction",
    description: "Learn how to take numbers away.",
    emoji: "➖",
    xpReward: 70,
    pages: [
      { value: 1, emoji: "🍎 🍎 - 🍎", title: "Two Take Away One", description: "Two apples take away one apple leaves ONE." },
      { value: 2, emoji: "⭐ ⭐ ⭐ - ⭐", title: "Three Take Away One", description: "Three stars take away one star leaves TWO." },
      { value: 3, emoji: "🍓 🍓 🍓 🍓 - 🍓", title: "Four Take Away One", description: "Four strawberries take away one leaves THREE." },
      { value: 4, emoji: "🐠 🐠 🐠 🐠 🐠 - 🐠 🐠", title: "Five Take Away Two", description: "Five fish take away two fish leaves THREE." },
      { value: 5, emoji: "🎈 🎈 🎈 🎈 🎈 🎈 - 🎈 🎈 🎈", title: "Six Take Away Three", description: "Six balloons take away three leaves THREE." },
    ],
  },
  {
    id: 4,
    title: "Shapes",
    description: "Recognize common shapes around us.",
    emoji: "🔺",
    xpReward: 80,
    pages: [
      { value: 1, emoji: "🔴", title: "Circle", description: "A circle is round and has no corners." },
      { value: 2, emoji: "🟦", title: "Square", description: "A square has four equal sides and four corners." },
      { value: 3, emoji: "🔺", title: "Triangle", description: "A triangle has three sides and three corners." },
      { value: 4, emoji: "🟨", title: "Rectangle", description: "A rectangle has four sides and four corners." },
      { value: 5, emoji: "⭐", title: "Let's Find Shapes!", description: "Look around you. Can you find a circle, square, or triangle?" },
    ],
  },
  {
    id: 5,
    title: "Patterns",
    description: "Find what comes next in simple patterns.",
    emoji: "⭐",
    xpReward: 90,
    pages: [
      { value: 1, emoji: "🔴 🔵 🔴 🔵", title: "Red and Blue", description: "Red, blue, red, blue. What comes next?" },
      { value: 2, emoji: "⭐ 🌙 ⭐ 🌙", title: "Star and Moon", description: "Star, moon, star, moon. The pattern repeats!" },
      { value: 3, emoji: "🍎 🍌 🍎 🍌", title: "Apple and Banana", description: "Apple, banana, apple, banana. What comes next?" },
      { value: 4, emoji: "🔺 🔺 🟦 🔺 🔺 🟦", title: "Two and One", description: "Two triangles, one square. Then repeat!" },
      { value: 5, emoji: "🟢 🟡 🟢 🟡", title: "Green and Yellow", description: "Green, yellow, green, yellow. Patterns are fun!" },
    ],
  },
];

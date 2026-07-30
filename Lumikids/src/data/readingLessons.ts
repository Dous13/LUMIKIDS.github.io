export const readingLessons = [
  {
    id: "A",
    letter: "A",
    word: "Apple",
    emoji: "🍎",
    color: "#D7F9D9",
    xp: 25,
    unlocked: true,

    letterSound: "AHHH",
    wordSound: "Apple",

    levels: [
      {
        id: 1,
        type: "introduce",
      },
      {
        id: 2,
        type: "listenLetter",
      },
      {
        id: 3,
        type: "listenWord",
      },
      {
        id: 4,
        type: "question",
        question: "What letter does Apple start with?",
        choices: ["A", "B", "C"],
        answer: "A",
      },
      {
        id: 5,
        type: "finish",
      },
    ],
  },

  {
    id: "B",
    letter: "B",
    word: "Ball",
    emoji: "⚽",
    color: "#FFE9CF",
    xp: 25,
    unlocked: false,

    letterSound: "BUHH",
    wordSound: "Ball",

    levels: [],
  },

  {
    id: "C",
    letter: "C",
    word: "Cat",
    emoji: "🐱",
    color: "#DDEFFF",
    xp: 25,
    unlocked: false,

    letterSound: "CUHH",
    wordSound: "Cat",

    levels: [],
  },
];
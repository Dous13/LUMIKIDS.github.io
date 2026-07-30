export interface ReadingQuestion {
  question: string;
  choices: string[];
  answer: string;
}

export interface ReadingLevel {
  id: number;
  type:
    | "introduce"
    | "listenLetter"
    | "listenWord"
    | "question"
    | "finish";

  question?: ReadingQuestion;
}

export interface ReadingLesson {
  id: string;

  letter: string;

  word: string;

  emoji: string;

  letterSound: string;

  wordSound: string;

  xpReward: number;

  levels: ReadingLevel[];
}

export const readingLessons: ReadingLesson[] = [
  {
    id: "A",

    letter: "A",

    word: "Apple",

    emoji: "🍎",

    letterSound: "A",

    wordSound: "Apple",

    xpReward: 25,

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

        question: {
          question: "What letter does Apple start with?",

          choices: ["A", "B", "C"],

          answer: "A",
        },
      },

      {
        id: 5,
        type: "question",

        question: {
          question: "Which picture starts with A?",

          choices: ["🍎", "⚽", "🐱"],

          answer: "🍎",
        },
      },

      {
        id: 6,
        type: "finish",
      },
    ],
  },
];
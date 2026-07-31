export const createReadingLesson = (
  id: string,
  letter: string,
  word: string,
  emoji: string,
  color: string,
  letterSound: string,
  wordSound: string
) => ({
  id,
  letter,
  word,
  emoji,
  color,
  xp: 25,
  unlocked: false,

  letterSound,
  wordSound,

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
      question: `What letter does ${word} start with?`,
      choices: [
        letter,
        ...["A", "B", "C", "D"]
          .filter(l => l !== letter)
          .slice(0, 2),
      ],
      answer: letter,
    },
    {
      id: 5,
      type: "finish",
    },
  ],
});

export const readingLessons = [
  createReadingLesson(
    "A",
    "A",
    "Apple",
    "🍎",
    "#D7F9D9",
    "AHHH",
    "Apple"
  ),

  createReadingLesson(
    "B",
    "B",
    "Ball",
    "⚽",
    "#FFE9CF",
    "BUHH",
    "Ball"
  ),

  createReadingLesson(
    "C",
    "C",
    "Cat",
    "🐱",
    "#f7ddff",
    "CUHH",
    "Cat"
  ),

  createReadingLesson(
  "D",
  "D",
  "Dog",
  "🐶",
  "#ffb3bf",
  "DUHH",
  "Dog"
  ),
];
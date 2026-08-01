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
  coins: 15,
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
  "#ffebb3",
  "DUHH",
  "Dog"
  ),

  createReadingLesson(
  "E",
  "E",
  "Egg",
  "🥚",
  "#b3ffe6",
  "EHHH",
  "Egg"
  ),

  createReadingLesson(
  "F",
  "F",
  "Fox",
  "🦊",
  "#b3c5ff",
  "EFF",
  "Fox"
  ),

  createReadingLesson(
  "G",
  "G",
  "Goat",
  "🐐",
  "#b6ffb3",
  "GUHH",
  "Goat"
  ),

  createReadingLesson(
  "H",
  "H",
  "House",
  "🏠",
  "#b3ffef",
  "HUHH",
  "House"
  ),

  createReadingLesson(
  "I",
  "I",
  "Ice",
  "🧊",
  "#bcffb3",
  "AII",
  "Ice"
  ),

  createReadingLesson(
  "J",
  "J",
  "Jar",
  "🫙",
  "#f7ffb3",
  "JUHH",
  "Jar"
  ),

  createReadingLesson(
  "K",
  "K",
  "Kite",
  "🪁",
  "#b3daff",
  "KUHH",
  "Kite"
  ),

  createReadingLesson(
  "L",
  "L",
  "Log",
  "🪵",
  "#cfb291",
  "LUHH",
  "Log"
  ),

  createReadingLesson(
  "M",
  "M",
  "Monkey",
  "🐒",
  "#cfb291",
  "MUHH",
  "Monkey"
  ),

  createReadingLesson(
  "N",
  "N",
  "Net",
  "🥅",
  "#98cf91",
  "NNN",
  "Net"
  ),

  createReadingLesson(
  "O",
  "O",
  "Octopus",
  "🐙",
  "#91c6cf",
  "OHH",
  "Octopus"
  ),

  createReadingLesson(
  "P",
  "P",
  "Pig",
  "🐖",
  "#cf91ca",
  "PIHH",
  "Pig"
  ),

  createReadingLesson(
  "Q",
  "Q",
  "Queen",
  "👸🏻",
  "#cf919e",
  "CWOHH",
  "Queen"
  ),

  createReadingLesson(
  "R",
  "R",
  "Road",
  "🛣️",
  "#91cf99",
  "ROHH",
  "Road"
  ),

  createReadingLesson(
  "S",
  "S",
  "Snake",
  "🐍",
  "#cfce91",
  "SSS",
  "Snake"
  ),

  createReadingLesson(
  "T",
  "T",
  "Tiger",
  "🐅",
  "#cfce91",
  "TUHH",
  "Tiger"
  ),

  createReadingLesson(
  "U",
  "U",
  "Umbrella",
  "☂️",
  "#ac91cf",
  "UHH",
  "Umbrella"
  ),

  createReadingLesson(
  "V",
  "V",
  "Van",
  "🚐",
  "#6872ff",
  "VUHH",
  "Van"
  ),

  createReadingLesson(
  "W",
  "W",
  "Worm",
  "🪱",
  "#91cf99",
  "WUHH",
  "Worm"
  ),

  createReadingLesson(
  "X",
  "X",
  "X-ray",
  "🩻",
  "#cfce91",
  "EKSS",
  "X-ray"
  ),

  createReadingLesson(
  "Y",
  "Y",
  "Yarn",
  "🧶",
  "#cf91a0",
  "YUHH",
  "Yarn"
  ),

  createReadingLesson(
  "Z",
  "Z",
  "Zebra",
  "🦓",
  "#cfad91",
  "ZUHH",
  "Zebra"
  ),
];
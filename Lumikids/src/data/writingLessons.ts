export const createWritingLesson = (
  id: string,
  letter: string,
  word: string,
  emoji: string,
  color: string
) => ({
  id,
  letter,
  word,
  emoji,
  color,

  xp: 25,
  coins: 15,

  unlocked: false,

  traceWord: word,

  levels: [
    {
      id: 1,
      type: "introduce",
    },
    {
      id: 2,
      type: "traceUppercase",
    },
    {
      id: 3,
      type: "traceLowercase",
    },
    {
      id: 4,
      type: "traceWord",
    },
    {
      id: 5,
      type: "finish",
    },
  ],
});

export const writingLessons = [
  createWritingLesson(
    "A",
    "A",
    "Apple",
    "🍎",
    "#D7F9D9"
  ),

  createWritingLesson(
    "B",
    "B",
    "Ball",
    "⚽",
    "#FFE9CF"
  ),

  createWritingLesson(
    "C",
    "C",
    "Cat",
    "🐱",
    "#F7DDFF"
  ),

  createWritingLesson(
    "D",
    "D",
    "Dog",
    "🐶",
    "#FFEBB3"
  ),

  createWritingLesson(
    "E",
    "E",
    "Egg",
    "🥚",
    "#B3FFE6"
  ),

  createWritingLesson(
    "F",
    "F",
    "Fox",
    "🦊",
    "#B3C5FF"
  ),

  createWritingLesson(
    "G",
    "G",
    "Goat",
    "🐐",
    "#B6FFB3"
  ),

  createWritingLesson(
    "H",
    "H",
    "House",
    "🏠",
    "#B3FFEF"
  ),

  createWritingLesson(
    "I",
    "I",
    "Ice",
    "🧊",
    "#BCFFB3"
  ),

  createWritingLesson(
    "J",
    "J",
    "Jar",
    "🫙",
    "#F7FFB3"
  ),

  createWritingLesson(
    "K",
    "K",
    "Kite",
    "🪁",
    "#B3DAFF"
  ),

  createWritingLesson(
    "L",
    "L",
    "Log",
    "🪵",
    "#CFB291"
  ),

  createWritingLesson(
    "M",
    "M",
    "Monkey",
    "🐒",
    "#CFB291"
  ),

  createWritingLesson(
    "N",
    "N",
    "Net",
    "🥅",
    "#98CF91"
  ),

  createWritingLesson(
    "O",
    "O",
    "Octopus",
    "🐙",
    "#91C6CF"
  ),

  createWritingLesson(
    "P",
    "P",
    "Pig",
    "🐖",
    "#CF91CA"
  ),

  createWritingLesson(
    "Q",
    "Q",
    "Queen",
    "👸🏻",
    "#CF919E"
  ),

  createWritingLesson(
    "R",
    "R",
    "Road",
    "🛣️",
    "#91CF99"
  ),

  createWritingLesson(
    "S",
    "S",
    "Snake",
    "🐍",
    "#CFCE91"
  ),

  createWritingLesson(
    "T",
    "T",
    "Tiger",
    "🐅",
    "#CFCE91"
  ),

  createWritingLesson(
    "U",
    "U",
    "Umbrella",
    "☂️",
    "#AC91CF"
  ),

  createWritingLesson(
    "V",
    "V",
    "Van",
    "🚐",
    "#6872FF"
  ),

  createWritingLesson(
    "W",
    "W",
    "Worm",
    "🪱",
    "#91CF99"
  ),

  createWritingLesson(
    "X",
    "X",
    "X-ray",
    "🩻",
    "#CFCE91"
  ),

  createWritingLesson(
    "Y",
    "Y",
    "Yarn",
    "🧶",
    "#CF91A0"
  ),

  createWritingLesson(
    "Z",
    "Z",
    "Zebra",
    "🦓",
    "#CFAD91"
  ),
];
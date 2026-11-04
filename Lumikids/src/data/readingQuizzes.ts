import { readingLessons } from "./readingLessons";

function shuffle<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

function createQuiz(lesson: any) {
  const otherLessons = readingLessons.filter(
    l => l.id !== lesson.id
  );

  const randomLetters = shuffle(
    otherLessons.map(l => l.letter)
  ).slice(0, 2);

  const randomWords = shuffle(
    otherLessons.map(l => l.word)
  ).slice(0, 2);

  const randomEmojis = shuffle(
    otherLessons.map(l => l.emoji)
  ).slice(0, 2);

  return [
    {
      id: 1,
      skillId: "letter-recognition",
      question: "Which letter is this?",
      image: lesson.emoji,
      choices: shuffle([
        lesson.letter,
        ...randomLetters,
      ]),
      answer: lesson.letter,
    },

    {
      id: 2,
      skillId: "vocabulary",
      question: `What word starts with ${lesson.letter}?`,
      choices: shuffle([
        lesson.word,
        ...randomWords,
      ]),
      answer: lesson.word,
    },

    {
      id: 3,
      skillId: "picture-letter-association",
      question: `Which picture starts with ${lesson.letter}?`,
      choices: shuffle([
        lesson.emoji,
        ...randomEmojis,
      ]),
      answer: lesson.emoji,
    },

    {
      id: 4,
      skillId: "letter-recognition",
      question: `Tap the letter ${lesson.letter}`,
      choices: shuffle([
        lesson.letter,
        ...randomLetters,
      ]),
      answer: lesson.letter,
    },
  ];
}

export const readingQuizzes = Object.fromEntries(
  readingLessons.map(lesson => [
    lesson.id,
    createQuiz(lesson),
  ])
);
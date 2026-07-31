export function createLesson(
  letter: string,
  word: string
) {
  return [
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
        "B",
        "C",
      ],
      answer: letter,
    },
    {
      id: 5,
      type: "finish",
    },
  ];
}

import { mathQuizzes } from "./mathQuizzes";
import type {
  GeneratedWorksheet,
  WorksheetAnswer,
  WorksheetQuestion,
} from "../services/phygital/worksheetTypes";

const ANSWER_LABELS: WorksheetAnswer[] = ["A", "B", "C"];

/**
 * Builds a worksheet from existing math quiz questions.
 * The order of choices determines the printed A/B/C labels.
 */
export function createMathWorksheet(
  questionIds: number[] = [1, 2, 3]
): GeneratedWorksheet {
  const selectedQuestions = questionIds.map((questionId) => {
    const question = mathQuizzes.find(
      (item) => item.id === questionId
    );

    if (!question) {
      throw new Error(
        `Math quiz question ${questionId} was not found.`
      );
    }

    if (question.options.length !== 3) {
      throw new Error(
        `Question ${questionId} must have exactly three choices.`
      );
    }

    const correctIndex = question.options.findIndex(
      (option) => option === question.correctAnswer
    );

    if (correctIndex === -1) {
      throw new Error(
        `Question ${questionId} has no matching correct answer.`
      );
    }

    const worksheetQuestion: WorksheetQuestion = {
      id: `math-${question.id}`,
      prompt: question.question,
      illustration: question.emoji,
      choices: question.options.map((text, index) => ({
        id: ANSWER_LABELS[index],
        text,
      })),
      correctAnswer: ANSWER_LABELS[correctIndex],
      difficulty: 1,
    };

    return worksheetQuestion;
  });

  return {
    id: `math-worksheet-${questionIds.join("-")}`,
    title: "My First Math Worksheet",
    subject: "math",
    ageRange: {
      min: 3,
      max: 5,
    },
    lessonId: "1",
    questions: selectedQuestions,
    createdAt: new Date().toISOString(),
  };
}

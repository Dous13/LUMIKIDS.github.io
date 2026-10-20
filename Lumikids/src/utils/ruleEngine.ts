export type RuleResult = {
  passed: boolean;
  stars: number;
  percentage: number;
  message: string;
  action: "advance" | "practice";
};

const PASSING_THRESHOLD = 75;
const THREE_STAR_THRESHOLD = 90;

export function evaluateQuiz(
  score: number,
  totalQuestions: number
): RuleResult {
  // Validate the assessment data.
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(totalQuestions) ||
    totalQuestions <= 0 ||
    score < 0 ||
    score > totalQuestions
  ) {
    console.error("[LUMIKIDS] Invalid quiz evaluation:", {
      score,
      totalQuestions,
      scoreType: typeof score,
      totalQuestionsType: typeof totalQuestions,
    });

    throw new Error("Invalid quiz score or total questions.");
  }

  const percentage = Math.round(
    (score / totalQuestions) * 100
  );

  // Rule 1: Excellent performance.
  if (percentage >= THREE_STAR_THRESHOLD) {
    return {
      passed: true,
      stars: 3,
      percentage,
      message: "Excellent! You unlocked the next lesson!",
      action: "advance",
    };
  }

  // Rule 2: Meets the passing threshold.
  if (percentage >= PASSING_THRESHOLD) {
    return {
      passed: true,
      stars: 2,
      percentage,
      message: "Great job! You're ready for the next lesson!",
      action: "advance",
    };
  }

  // Rule 3: Requires additional practice.
  return {
    passed: false,
    stars: 0,
    percentage,
    message: "Let's practice some more before moving on!",
    action: "practice",
  };
}

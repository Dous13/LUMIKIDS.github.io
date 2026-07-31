export type RuleResult = {
  passed: boolean;
  stars: number;
  message: string;
};

export function evaluateQuiz(
  score: number,
  totalQuestions: number
): RuleResult {

  const percentage =
    (score / totalQuestions) * 100;

  // Rule 1
  if (percentage >= 90) {
    return {
      passed: true,
      stars: 3,
      message:
        "Excellent! You unlocked the next lesson!",
    };
  }

  // Rule 2
  if (percentage >= 70) {
    return {
      passed: true,
      stars: 2,
      message:
        "Good job! Keep practicing!",
    };
  }

  // Rule 3
  if (percentage >= 50) {
    return {
      passed: true,
      stars: 1,
      message:
        "You passed! Let's continue learning!",
    };
  }

  // Rule 4
  return {
    passed: false,
    stars: 0,
    message:
      "Let's review this lesson first.",
  };
}
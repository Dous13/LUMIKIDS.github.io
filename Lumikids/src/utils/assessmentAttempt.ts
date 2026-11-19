export type AssessmentAttempt = { quizScore: number; quizTotal: number };

export function isAssessmentAttempt(value: Partial<AssessmentAttempt> | null | undefined): value is AssessmentAttempt {
  if (typeof value?.quizScore !== "number" || typeof value.quizTotal !== "number") return false;
  return Number.isSafeInteger(value.quizScore) && Number.isSafeInteger(value.quizTotal) &&
    value.quizTotal > 0 && value.quizScore >= 0 && value.quizScore <= value.quizTotal;
}

// Prefer accuracy, then the larger sample. Invalid/missing historical attempts
// cannot beat an observed attempt, and ties retain the existing pair.
export function bestAttempt<A extends Partial<AssessmentAttempt>, B extends Partial<AssessmentAttempt>>(
  existing: A | null | undefined, candidate: B | null | undefined,
): A | B | null | undefined {
  if (!isAssessmentAttempt(candidate)) {
    // Preserve an older, incomplete pair when the other record is an
    // initialized placeholder. A real attempt always replaces either.
    const hasValues = (attempt: Partial<AssessmentAttempt> | null | undefined) =>
      [attempt?.quizScore, attempt?.quizTotal].some(value => typeof value === "number" && Number.isFinite(value) && value !== 0);
    return hasValues(existing) || !hasValues(candidate) ? existing : candidate;
  }
  if (!isAssessmentAttempt(existing)) return candidate;
  const left = BigInt(existing.quizScore) * BigInt(candidate.quizTotal);
  const right = BigInt(candidate.quizScore) * BigInt(existing.quizTotal);
  return right > left || (right === left && candidate.quizTotal > existing.quizTotal) ? candidate : existing;
}

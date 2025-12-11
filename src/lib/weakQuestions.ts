interface QuestionAttempt {
  question_id: string;
  is_correct: boolean;
}

/**
 * Calculate weak question IDs from question attempts.
 * A question is considered "weak" if the user has answered it incorrectly
 * more times than correctly (incorrect > correct).
 *
 * This means:
 * - 1 wrong, 0 right = weak (1 > 0)
 * - 1 wrong, 1 right = not weak (1 > 1 is false)
 * - 2 wrong, 1 right = weak (2 > 1)
 * - 2 wrong, 2 right = not weak (2 > 2 is false)
 */
export function calculateWeakQuestionIds(attempts: QuestionAttempt[]): string[] {
  const stats: Record<string, { correct: number; incorrect: number }> = {};

  attempts.forEach(attempt => {
    if (!stats[attempt.question_id]) {
      stats[attempt.question_id] = { correct: 0, incorrect: 0 };
    }
    if (attempt.is_correct) {
      stats[attempt.question_id].correct++;
    } else {
      stats[attempt.question_id].incorrect++;
    }
  });

  return Object.entries(stats)
    .filter(([_, { correct, incorrect }]) => incorrect > correct)
    .map(([id]) => id);
}

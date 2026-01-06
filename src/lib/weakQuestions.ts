interface QuestionAttempt {
  question_id: string;
  is_correct: boolean;
}

/**
 * Calculate weak question IDs from question attempts.
 * A question is considered "weak" if:
 * 1. The user has answered it incorrectly at least 2 times, AND
 * 2. They have more incorrect answers than correct answers (incorrect > correct)
 *
 * This means:
 * - 1 wrong, 0 right = NOT weak (need at least 2 wrong)
 * - 2 wrong, 0 right = weak (2 >= 2 and 2 > 0)
 * - 2 wrong, 1 right = weak (2 >= 2 and 2 > 1)
 * - 2 wrong, 2 right = NOT weak (2 > 2 is false)
 * - 3 wrong, 2 right = weak (3 >= 2 and 3 > 2)
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
    .filter(([_, { correct, incorrect }]) => incorrect >= 2 && incorrect > correct)
    .map(([id]) => id);
}

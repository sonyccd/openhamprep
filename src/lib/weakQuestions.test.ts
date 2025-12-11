import { describe, it, expect } from 'vitest';
import { calculateWeakQuestionIds } from './weakQuestions';

describe('calculateWeakQuestionIds', () => {
  it('returns empty array when no attempts', () => {
    expect(calculateWeakQuestionIds([])).toEqual([]);
  });

  it('marks question as weak when answered incorrectly once', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: false },
    ];
    expect(calculateWeakQuestionIds(attempts)).toEqual(['Q1']);
  });

  it('does not mark question as weak when answered correctly once', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: true },
    ];
    expect(calculateWeakQuestionIds(attempts)).toEqual([]);
  });

  it('removes question from weak list when correct equals incorrect', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: true },
    ];
    // 1 incorrect, 1 correct = not weak (1 > 1 is false)
    expect(calculateWeakQuestionIds(attempts)).toEqual([]);
  });

  it('keeps question weak when incorrect exceeds correct', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: true },
    ];
    // 2 incorrect, 1 correct = weak (2 > 1)
    expect(calculateWeakQuestionIds(attempts)).toEqual(['Q1']);
  });

  it('removes question from weak list when correct exceeds incorrect', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: true },
      { question_id: 'Q1', is_correct: true },
    ];
    // 1 incorrect, 2 correct = not weak (1 > 2 is false)
    expect(calculateWeakQuestionIds(attempts)).toEqual([]);
  });

  it('handles multiple questions independently', () => {
    const attempts = [
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: true },  // Q1: 1 wrong, 1 right = not weak
      { question_id: 'Q2', is_correct: false },
      { question_id: 'Q2', is_correct: false }, // Q2: 2 wrong, 0 right = weak
      { question_id: 'Q3', is_correct: true },
      { question_id: 'Q3', is_correct: true },  // Q3: 0 wrong, 2 right = not weak
    ];
    expect(calculateWeakQuestionIds(attempts)).toEqual(['Q2']);
  });

  it('handles real-world scenario: user reviews weak questions and gets them right', () => {
    // User initially gets Q1 wrong twice
    const initialAttempts = [
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: false },
    ];
    expect(calculateWeakQuestionIds(initialAttempts)).toEqual(['Q1']);

    // User reviews weak questions and gets Q1 right once
    const afterOneCorrect = [
      ...initialAttempts,
      { question_id: 'Q1', is_correct: true },
    ];
    // 2 wrong, 1 right = still weak
    expect(calculateWeakQuestionIds(afterOneCorrect)).toEqual(['Q1']);

    // User gets Q1 right again
    const afterTwoCorrect = [
      ...afterOneCorrect,
      { question_id: 'Q1', is_correct: true },
    ];
    // 2 wrong, 2 right = not weak anymore
    expect(calculateWeakQuestionIds(afterTwoCorrect)).toEqual([]);
  });

  it('handles mixed results across many questions', () => {
    const attempts = [
      // Q1: 3 wrong, 1 right = weak
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: false },
      { question_id: 'Q1', is_correct: true },
      // Q2: 1 wrong, 3 right = not weak
      { question_id: 'Q2', is_correct: false },
      { question_id: 'Q2', is_correct: true },
      { question_id: 'Q2', is_correct: true },
      { question_id: 'Q2', is_correct: true },
      // Q3: 2 wrong, 2 right = not weak
      { question_id: 'Q3', is_correct: false },
      { question_id: 'Q3', is_correct: false },
      { question_id: 'Q3', is_correct: true },
      { question_id: 'Q3', is_correct: true },
      // Q4: 0 wrong, 2 right = not weak
      { question_id: 'Q4', is_correct: true },
      { question_id: 'Q4', is_correct: true },
      // Q5: 1 wrong, 0 right = weak
      { question_id: 'Q5', is_correct: false },
    ];

    const weakIds = calculateWeakQuestionIds(attempts);
    expect(weakIds).toContain('Q1');
    expect(weakIds).toContain('Q5');
    expect(weakIds).not.toContain('Q2');
    expect(weakIds).not.toContain('Q3');
    expect(weakIds).not.toContain('Q4');
    expect(weakIds).toHaveLength(2);
  });
});

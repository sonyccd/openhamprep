import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicQuiz } from './TopicQuiz';
import { Question } from '@/hooks/useQuestions';

const mockQuestions: Question[] = [
  {
    id: 'T1A01',
    displayName: 'T1A01',
    question: 'What is the first question?',
    options: {
      A: 'Answer A',
      B: 'Answer B',
      C: 'Answer C',
      D: 'Answer D',
    },
    correctAnswer: 'A',
    subelement: 'T1',
    question_group: 'A',
    license_type: 'technician',
    explanation: null,
    fcc_reference: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    figure_id: null,
  },
  {
    id: 'T1A02',
    displayName: 'T1A02',
    question: 'What is the second question?',
    options: {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    },
    correctAnswer: 'B',
    subelement: 'T1',
    question_group: 'A',
    license_type: 'technician',
    explanation: null,
    fcc_reference: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    figure_id: null,
  },
  {
    id: 'T1A03',
    displayName: 'T1A03',
    question: 'What is the third question?',
    options: {
      A: 'Choice A',
      B: 'Choice B',
      C: 'Choice C',
      D: 'Choice D',
    },
    correctAnswer: 'C',
    subelement: 'T1',
    question_group: 'A',
    license_type: 'technician',
    explanation: null,
    fcc_reference: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    figure_id: null,
  },
];

describe('TopicQuiz', () => {
  const mockSaveAttempts = vi.fn().mockResolvedValue({ success: true });

  const defaultProps = {
    questions: mockQuestions,
    onComplete: vi.fn(),
    onDone: vi.fn(),
    onSaveAttempts: mockSaveAttempts,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveAttempts.mockResolvedValue({ success: true });
  });

  describe('Quiz Mode', () => {
    it('renders the first question initially', () => {
      render(<TopicQuiz {...defaultProps} />);

      expect(screen.getByText('What is the first question?')).toBeInTheDocument();
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('displays all answer options', () => {
      render(<TopicQuiz {...defaultProps} />);

      expect(screen.getByText('Answer A')).toBeInTheDocument();
      expect(screen.getByText('Answer B')).toBeInTheDocument();
      expect(screen.getByText('Answer C')).toBeInTheDocument();
      expect(screen.getByText('Answer D')).toBeInTheDocument();
    });

    it('shows 0 answered initially', () => {
      render(<TopicQuiz {...defaultProps} />);

      expect(screen.getByText('0 answered')).toBeInTheDocument();
    });

    it('updates answered count when selecting an answer', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      await user.click(screen.getByText('Answer A'));

      expect(screen.getByText('1 answered')).toBeInTheDocument();
    });

    it('navigates to the next question when Next is clicked', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('What is the second question?')).toBeInTheDocument();
      });
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('navigates to the previous question when Previous is clicked', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      // Go to second question
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('What is the second question?')).toBeInTheDocument();
      });

      // Go back to first question
      await user.click(screen.getByText('Previous'));
      await waitFor(() => {
        expect(screen.getByText('What is the first question?')).toBeInTheDocument();
      });
    });

    it('disables Previous button on first question', () => {
      render(<TopicQuiz {...defaultProps} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it('shows Submit Quiz button on the last question', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      // Navigate to last question
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit quiz/i })).toBeInTheDocument();
      });
    });

    it('disables Submit Quiz button when not all questions are answered', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      // Navigate to last question without answering
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /submit quiz/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables Submit Quiz button when all questions are answered', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      // Answer first question
      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByText('Next'));

      // Answer second question
      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Next'));

      // Answer third question
      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C'));

      const submitButton = screen.getByRole('button', { name: /submit quiz/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('highlights selected answer', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      const optionButton = screen.getByText('Answer A').closest('button');
      await user.click(optionButton!);

      expect(optionButton).toHaveClass('border-primary');
    });

    it('has aria-labels on navigation buttons', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      expect(screen.getByRole('button', { name: /go to previous question/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to next question/i })).toBeInTheDocument();

      // Navigate to last question
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit quiz with/i })).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Submission', () => {
    it('calls onSaveAttempts with all answered questions on submit', async () => {
      const user = userEvent.setup();
      const onSaveAttempts = vi.fn().mockResolvedValue({ success: true });
      render(<TopicQuiz {...defaultProps} onSaveAttempts={onSaveAttempts} />);

      // Answer all questions
      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C'));

      // Submit
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      await waitFor(() => {
        expect(onSaveAttempts).toHaveBeenCalledTimes(1);
      });
      expect(onSaveAttempts).toHaveBeenCalledWith([
        { question: mockQuestions[0], selectedAnswer: 'A' },
        { question: mockQuestions[1], selectedAnswer: 'B' },
        { question: mockQuestions[2], selectedAnswer: 'C' },
      ]);
    });

    it('calls onComplete with correct results for passing score', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<TopicQuiz {...defaultProps} onComplete={onComplete} passingThreshold={0.8} />);

      // Answer all correctly (100%)
      await user.click(screen.getByText('Answer A')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C')); // Correct

      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(true, 3, 3);
      });
    });

    it('calls onComplete with correct results for failing score', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<TopicQuiz {...defaultProps} onComplete={onComplete} passingThreshold={0.8} />);

      // Answer 1/3 correctly (33%)
      await user.click(screen.getByText('Answer A')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option A')); // Wrong (correct is B)
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice A')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice A')); // Wrong (correct is C)

      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(false, 1, 3);
      });
    });
  });

  describe('Results Mode', () => {
    const submitQuizWithAnswers = async (user: ReturnType<typeof userEvent.setup>, answers: ('A' | 'B' | 'C' | 'D')[]) => {
      const answerPrefixes = ['Answer', 'Option', 'Choice'];
      for (let i = 0; i < answers.length; i++) {
        await waitFor(() => {
          expect(screen.getByText(`${answerPrefixes[i]} ${answers[i]}`)).toBeInTheDocument();
        });
        await user.click(screen.getByText(`${answerPrefixes[i]} ${answers[i]}`));
        if (i < answers.length - 1) {
          await user.click(screen.getByText('Next'));
        }
      }
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));
    };

    it('shows passing message when score meets threshold', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} passingThreshold={0.8} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']); // All correct

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });
      expect(screen.getByText("You've mastered this topic!")).toBeInTheDocument();
      expect(screen.getByText('3/3')).toBeInTheDocument();
      expect(screen.getByText('(100%)')).toBeInTheDocument();
    });

    it('shows failing message when score is below threshold', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} passingThreshold={0.8} />);

      await submitQuizWithAnswers(user, ['A', 'A', 'A']); // 1/3 correct

      await waitFor(() => {
        expect(screen.getByText('Keep Practicing')).toBeInTheDocument();
      });
      expect(screen.getByText(/Score 80% or higher/)).toBeInTheDocument();
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('shows incorrect answers for review', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} passingThreshold={0.8} />);

      await submitQuizWithAnswers(user, ['A', 'A', 'A']); // 1/3 correct (Q2 and Q3 wrong)

      await waitFor(() => {
        expect(screen.getByText('Review incorrect answers:')).toBeInTheDocument();
      });
      expect(screen.getByText('What is the second question?')).toBeInTheDocument();
      expect(screen.getByText('What is the third question?')).toBeInTheDocument();
    });

    it('does not show review section when all answers correct', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} passingThreshold={0.8} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']); // All correct

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });
      expect(screen.queryByText('Review incorrect answers:')).not.toBeInTheDocument();
    });

    it('shows Try Again button in results', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('shows Done button in results', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
      });
    });

    it('calls onDone when Done button is clicked', async () => {
      const user = userEvent.setup();
      const onDone = vi.fn();
      render(<TopicQuiz {...defaultProps} onDone={onDone} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /done/i }));

      expect(onDone).toHaveBeenCalled();
    });

    it('resets quiz when Try Again is clicked', async () => {
      const user = userEvent.setup();
      render(<TopicQuiz {...defaultProps} />);

      await submitQuizWithAnswers(user, ['A', 'B', 'C']);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Click Try Again
      await user.click(screen.getByRole('button', { name: /try again/i }));

      // Should be back on first question with no answers
      await waitFor(() => {
        expect(screen.getByText('What is the first question?')).toBeInTheDocument();
      });
      expect(screen.getByText('0 answered')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single question quiz', async () => {
      const user = userEvent.setup();
      const singleQuestion = [mockQuestions[0]];
      render(<TopicQuiz {...defaultProps} questions={singleQuestion} />);

      expect(screen.getByText('1 / 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit quiz/i })).toBeInTheDocument();

      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });
    });

    it('works without onSaveAttempts callback', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<TopicQuiz questions={mockQuestions} onComplete={onComplete} onDone={vi.fn()} />);

      // Answer all questions
      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C'));

      // Should not throw
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('shows error message when save fails', async () => {
      const user = userEvent.setup();
      const onSaveAttempts = vi.fn().mockResolvedValue({ success: false, error: 'Database connection failed' });
      const onComplete = vi.fn();
      render(<TopicQuiz {...defaultProps} onSaveAttempts={onSaveAttempts} onComplete={onComplete} />);

      // Answer all questions
      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C'));

      // Submit
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      // Should show error and NOT call onComplete
      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('does not show results when save fails', async () => {
      const user = userEvent.setup();
      const onSaveAttempts = vi.fn().mockResolvedValue({ success: false, error: 'Save failed' });
      render(<TopicQuiz {...defaultProps} onSaveAttempts={onSaveAttempts} />);

      // Answer all questions
      await user.click(screen.getByText('Answer A'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C'));

      // Submit
      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      // Should stay in quiz mode, not show results
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
      expect(screen.queryByText('Keep Practicing')).not.toBeInTheDocument();
    });

    it('uses default passing threshold of 0.8', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      // Create 5 questions to test 80% threshold (4/5 = 80%)
      const fiveQuestions: Question[] = [
        ...mockQuestions,
        {
          id: 'T1A04',
          displayName: 'T1A04',
          question: 'Fourth question?',
          options: { A: 'A4', B: 'B4', C: 'C4', D: 'D4' },
          correctAnswer: 'D',
          subelement: 'T1',
          question_group: 'A',
          license_type: 'technician',
          explanation: null,
          fcc_reference: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          figure_id: null,
        },
        {
          id: 'T1A05',
          displayName: 'T1A05',
          question: 'Fifth question?',
          options: { A: 'A5', B: 'B5', C: 'C5', D: 'D5' },
          correctAnswer: 'A',
          subelement: 'T1',
          question_group: 'A',
          license_type: 'technician',
          explanation: null,
          fcc_reference: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          figure_id: null,
        },
      ];

      render(<TopicQuiz questions={fiveQuestions} onComplete={onComplete} onDone={vi.fn()} />);

      // Answer 4/5 correctly (80% - should pass)
      await user.click(screen.getByText('Answer A')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Option B')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option B')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Choice C')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Choice C')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('D4')).toBeInTheDocument();
      });
      await user.click(screen.getByText('D4')); // Correct
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('B5')).toBeInTheDocument();
      });
      await user.click(screen.getByText('B5')); // Wrong

      await user.click(screen.getByRole('button', { name: /submit quiz/i }));

      // 4/5 = 80%, should pass with default threshold
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(true, 4, 5);
      });
    });
  });
});

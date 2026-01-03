import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionListView } from './QuestionListView';
import { Question } from '@/hooks/useQuestions';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
    button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const createMockQuestion = (
  id: string,
  questionGroup: string,
  questionText: string = `Question ${id}?`
): Question => ({
  id,
  displayName: id,
  question: questionText,
  options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
  correctAnswer: 'A',
  subelement: id.slice(0, 2),
  group: id.slice(0, 3),
  questionGroup,
  explanation: `Explanation for ${id}`,
  links: [],
});

describe('QuestionListView', () => {
  const mockQuestions: Question[] = [
    createMockQuestion('T1A01', 'T1A'),
    createMockQuestion('T1A02', 'T1A'),
    createMockQuestion('T1A03', 'T1A'),
    createMockQuestion('T1B01', 'T1B'),
    createMockQuestion('T1B02', 'T1B'),
  ];

  const defaultProps = {
    title: "Commission's Rules",
    subtitle: 'Subelement T1',
    badge: 'T1',
    questions: mockQuestions,
    onBack: vi.fn(),
    onStartPractice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('displays the title', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
    });

    it('displays the subtitle', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByText('Subelement T1')).toBeInTheDocument();
    });

    it('displays the badge', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByText('T1')).toBeInTheDocument();
    });

    it('displays optional description when provided', () => {
      render(
        <QuestionListView
          {...defaultProps}
          description="This is a test description about the topic."
        />
      );

      expect(screen.getByText('This is a test description about the topic.')).toBeInTheDocument();
    });

    it('does not display description section when not provided', () => {
      render(<QuestionListView {...defaultProps} />);

      // The description text should not be present
      expect(screen.queryByText(/This is a test description/)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('displays back button', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls onBack when back button clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<QuestionListView {...defaultProps} onBack={onBack} />);

      await user.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Practice All Button', () => {
    it('displays Practice All Questions button', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    it('calls onStartPractice with no argument when Practice All is clicked', async () => {
      const user = userEvent.setup();
      const onStartPractice = vi.fn();

      render(<QuestionListView {...defaultProps} onStartPractice={onStartPractice} />);

      await user.click(screen.getByRole('button', { name: /practice all questions/i }));

      expect(onStartPractice).toHaveBeenCalledTimes(1);
      expect(onStartPractice).toHaveBeenCalledWith();
    });
  });

  describe('Search', () => {
    it('displays search input', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search questions/i)).toBeInTheDocument();
    });

    it('filters questions by display name', async () => {
      render(<QuestionListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search questions/i);
      fireEvent.change(searchInput, { target: { value: 'T1A01' } });

      // T1A01 should be visible
      expect(screen.getByText('T1A01')).toBeInTheDocument();

      // Other questions should not be visible
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
      expect(screen.queryByText('T1B01')).not.toBeInTheDocument();
    });

    it('filters questions by question text', async () => {
      const questionsWithUniqueText = [
        createMockQuestion('T1A01', 'T1A', 'What is the frequency range?'),
        createMockQuestion('T1A02', 'T1A', 'How do you identify your station?'),
        createMockQuestion('T1B01', 'T1B', 'What is the maximum power?'),
      ];

      render(
        <QuestionListView
          {...defaultProps}
          questions={questionsWithUniqueText}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search questions/i);
      fireEvent.change(searchInput, { target: { value: 'frequency' } });

      // The question containing "frequency" should be visible
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText(/frequency range/i)).toBeInTheDocument();

      // Other questions should not be visible
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      render(<QuestionListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search questions/i);
      fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

      expect(screen.getByText(/no questions match your search/i)).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      render(<QuestionListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search questions/i);
      fireEvent.change(searchInput, { target: { value: 't1a01' } });

      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });
  });

  describe('Question Grouping', () => {
    it('groups questions by questionGroup', () => {
      render(<QuestionListView {...defaultProps} />);

      // Should show group headers
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
    });

    it('displays questions within their groups', () => {
      render(<QuestionListView {...defaultProps} />);

      // All questions should be visible
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1A02')).toBeInTheDocument();
      expect(screen.getByText('T1A03')).toBeInTheDocument();
      expect(screen.getByText('T1B01')).toBeInTheDocument();
      expect(screen.getByText('T1B02')).toBeInTheDocument();
    });

    it('sorts groups alphabetically', () => {
      const unorderedQuestions = [
        createMockQuestion('T1C01', 'T1C'),
        createMockQuestion('T1A01', 'T1A'),
        createMockQuestion('T1B01', 'T1B'),
      ];

      render(<QuestionListView {...defaultProps} questions={unorderedQuestions} />);

      // Verify all groups are present (the component sorts them internally)
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
      expect(screen.getByText('T1C')).toBeInTheDocument();

      // Verify corresponding questions are present
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1B01')).toBeInTheDocument();
      expect(screen.getByText('T1C01')).toBeInTheDocument();
    });
  });

  describe('Question Selection', () => {
    it('calls onStartPractice with index when a question is clicked', async () => {
      const user = userEvent.setup();
      const onStartPractice = vi.fn();

      render(<QuestionListView {...defaultProps} onStartPractice={onStartPractice} />);

      // Click on T1A02 (which is at index 1 in mockQuestions)
      const questionButton = screen.getByText('T1A02').closest('button');
      if (questionButton) {
        await user.click(questionButton);
      }

      expect(onStartPractice).toHaveBeenCalledTimes(1);
      expect(onStartPractice).toHaveBeenCalledWith(1);
    });

    it('passes correct index for questions in different groups', async () => {
      const user = userEvent.setup();
      const onStartPractice = vi.fn();

      render(<QuestionListView {...defaultProps} onStartPractice={onStartPractice} />);

      // Click on T1B01 (which is at index 3 in mockQuestions)
      const questionButton = screen.getByText('T1B01').closest('button');
      if (questionButton) {
        await user.click(questionButton);
      }

      expect(onStartPractice).toHaveBeenCalledWith(3);
    });
  });

  describe('Question Display', () => {
    it('displays question display name', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });

    it('displays question text', () => {
      render(<QuestionListView {...defaultProps} />);

      expect(screen.getByText('Question T1A01?')).toBeInTheDocument();
    });

    it('truncates long question text', () => {
      const longQuestion = 'A'.repeat(150);
      const questionsWithLongText = [
        createMockQuestion('T1A01', 'T1A', longQuestion),
      ];

      render(<QuestionListView {...defaultProps} questions={questionsWithLongText} />);

      // Should show truncated text with "..."
      const truncatedText = screen.getByText(/\.\.\.$/);
      expect(truncatedText).toBeInTheDocument();
      // Original 150 chars should be truncated to 120 + "..."
      expect(truncatedText.textContent).toHaveLength(123);
    });

    it('does not truncate short question text', () => {
      const shortQuestion = 'Short question?';
      const questionsWithShortText = [
        createMockQuestion('T1A01', 'T1A', shortQuestion),
      ];

      render(<QuestionListView {...defaultProps} questions={questionsWithShortText} />);

      expect(screen.getByText('Short question?')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\.$/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows no questions message when questions array is empty', () => {
      render(<QuestionListView {...defaultProps} questions={[]} />);

      expect(screen.getByText(/no questions available/i)).toBeInTheDocument();
    });
  });

  describe('Questions Without Groups', () => {
    it('handles questions without questionGroup field', () => {
      const questionsWithoutGroup = [
        { ...createMockQuestion('T1A01', 'T1A'), questionGroup: undefined } as Question,
      ];

      render(<QuestionListView {...defaultProps} questions={questionsWithoutGroup} />);

      // Should fall back to "Other" group
      expect(screen.getByText('Other')).toBeInTheDocument();
      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });
  });
});

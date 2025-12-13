import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicLanding } from './TopicLanding';
import { Question } from '@/hooks/useQuestions';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Mock LinkPreview
vi.mock('@/components/LinkPreview', () => ({
  LinkPreview: ({ link }: { link: { title: string; url: string } }) => (
    <div data-testid="link-preview">{link.title}</div>
  ),
}));

const createMockQuestion = (
  id: string,
  links: { title: string; url: string; type: 'video' | 'article' | 'website' }[] = []
): Question => ({
  id,
  question: `Question ${id}?`,
  options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
  correctAnswer: 'A',
  subelement: id.slice(0, 2),
  group: id.slice(0, 3),
  explanation: `Explanation for ${id}`,
  links,
});

describe('TopicLanding', () => {
  const defaultProps = {
    subelement: 'T1',
    subelementName: 'Commission\'s Rules',
    questions: [
      createMockQuestion('T1A01'),
      createMockQuestion('T1A02'),
      createMockQuestion('T1A03'),
    ],
    onBack: vi.fn(),
    onStartPractice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('displays subelement code', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByText('T1')).toBeInTheDocument();
    });

    it('displays subelement name', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
    });

    it('displays question count', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByText('3 questions')).toBeInTheDocument();
    });

    it('displays singular question when count is 1', () => {
      render(
        <TopicLanding
          {...defaultProps}
          questions={[createMockQuestion('T1A01')]}
        />
      );

      expect(screen.getByText('1 questions')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('displays back button', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByRole('button', { name: /all topics/i })).toBeInTheDocument();
    });

    it('calls onBack when back button clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<TopicLanding {...defaultProps} onBack={onBack} />);

      await user.click(screen.getByRole('button', { name: /all topics/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Description', () => {
    it('displays About This Topic section', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByText('About This Topic')).toBeInTheDocument();
    });

    it('displays topic description for known subelement', () => {
      render(<TopicLanding {...defaultProps} subelement="T0" />);

      expect(screen.getByText(/Understanding FCC rules and regulations/)).toBeInTheDocument();
    });

    it('displays fallback description for unknown subelement', () => {
      render(<TopicLanding {...defaultProps} subelement="TX" />);

      expect(screen.getByText(/This topic covers important concepts/)).toBeInTheDocument();
    });
  });

  describe('Start Practice Button', () => {
    it('displays Start Practicing button', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByRole('button', { name: /start practicing/i })).toBeInTheDocument();
    });

    it('calls onStartPractice when clicked', async () => {
      const user = userEvent.setup();
      const onStartPractice = vi.fn();

      render(<TopicLanding {...defaultProps} onStartPractice={onStartPractice} />);

      await user.click(screen.getByRole('button', { name: /start practicing/i }));

      expect(onStartPractice).toHaveBeenCalledTimes(1);
    });
  });

  describe('Learning Resources', () => {
    it('does not display Learning Resources when no links', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.queryByText('Learning Resources')).not.toBeInTheDocument();
    });

    it('displays no resources message when no links', () => {
      render(<TopicLanding {...defaultProps} />);

      expect(screen.getByText(/No additional learning resources/)).toBeInTheDocument();
    });

    it('displays Learning Resources when questions have links', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('Learning Resources')).toBeInTheDocument();
    });

    it('displays resource count', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
          { title: 'Article 1', url: 'https://example.com/1', type: 'article' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('2 resources')).toBeInTheDocument();
    });

    it('displays singular resource text when count is 1', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('1 resource')).toBeInTheDocument();
    });

    it('groups videos separately', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
          { title: 'Video 2', url: 'https://youtube.com/2', type: 'video' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('Videos (2)')).toBeInTheDocument();
    });

    it('groups articles separately', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Article 1', url: 'https://example.com/1', type: 'article' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('Articles (1)')).toBeInTheDocument();
    });

    it('groups websites separately', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Website 1', url: 'https://example.com/1', type: 'website' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      expect(screen.getByText('Other Resources (1)')).toBeInTheDocument();
    });

    it('deduplicates links with same URL', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
        ]),
        createMockQuestion('T1A02', [
          { title: 'Video 1 Duplicate', url: 'https://youtube.com/1', type: 'video' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      // Should only show 1 resource, not 2
      expect(screen.getByText('1 resource')).toBeInTheDocument();
    });

    it('renders LinkPreview for each link', () => {
      const questionsWithLinks = [
        createMockQuestion('T1A01', [
          { title: 'Video 1', url: 'https://youtube.com/1', type: 'video' },
          { title: 'Article 1', url: 'https://example.com/1', type: 'article' },
        ]),
      ];

      render(<TopicLanding {...defaultProps} questions={questionsWithLinks} />);

      const linkPreviews = screen.getAllByTestId('link-preview');
      expect(linkPreviews).toHaveLength(2);
    });
  });

  describe('Topic Descriptions', () => {
    it('shows T0 description for FCC rules', () => {
      render(<TopicLanding {...defaultProps} subelement="T0" />);

      expect(screen.getByText(/Understanding FCC rules and regulations/)).toBeInTheDocument();
    });

    it('shows T5 description for electrical principles', () => {
      render(<TopicLanding {...defaultProps} subelement="T5" />);

      expect(screen.getByText(/Electrical principles are essential/)).toBeInTheDocument();
    });

    it('shows T9 description for antennas', () => {
      render(<TopicLanding {...defaultProps} subelement="T9" />);

      expect(screen.getByText(/Antennas and feed lines/)).toBeInTheDocument();
    });
  });
});

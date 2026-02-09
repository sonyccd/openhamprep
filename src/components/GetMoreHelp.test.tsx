import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GetMoreHelp } from './GetMoreHelp';
import { Question } from '@/hooks/useQuestions';

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
}));

const baseQuestion: Question = {
  id: 'uuid-t1a01',
  displayName: 'T1A01',
  question: 'What is the purpose of the Amateur Radio Service?',
  options: {
    A: 'To provide emergency communications',
    B: 'To make money',
    C: 'To broadcast music',
    D: 'To replace cell phones',
  },
  correctAnswer: 'A',
  subelement: 'T1',
  group: 'T1A',
  explanation: 'Amateur radio is for emergency communications and experimentation.',
  links: [],
  forumUrl: 'https://forum.openhamprep.com/t/t1a01-question/123',
  topics: [
    { id: 'topic-1', slug: 'radio-basics', title: 'Radio Basics' },
    { id: 'topic-2', slug: 'safety', title: 'Safety' },
  ],
};

describe('GetMoreHelp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // navigator.clipboard is a getter-only property, so we need defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  describe('rendering', () => {
    it('renders all options when all data is available', () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      // Study row with topic buttons
      expect(screen.getByText('Study')).toBeInTheDocument();
      expect(screen.getByText('Radio Basics')).toBeInTheDocument();
      expect(screen.getByText('Safety')).toBeInTheDocument();
      // Ask row with forum + AI prompt
      expect(screen.getByText('Ask')).toBeInTheDocument();
      expect(screen.getByText('Discuss with Other Hams')).toBeInTheDocument();
      expect(screen.getByText('Get AI Prompt')).toBeInTheDocument();
    });

    it('hides Study row when no topics', () => {
      const q: Question = { ...baseQuestion, topics: [] };
      render(<GetMoreHelp question={q} selectedAnswer="B" />);

      expect(screen.queryByText('Study')).not.toBeInTheDocument();
      expect(screen.getByText('Get AI Prompt')).toBeInTheDocument();
    });

    it('hides Study row when topics is undefined', () => {
      const q: Question = { ...baseQuestion, topics: undefined };
      render(<GetMoreHelp question={q} selectedAnswer="B" />);

      expect(screen.queryByText('Study')).not.toBeInTheDocument();
    });

    it('hides "Discuss with Other Hams" when no forumUrl', () => {
      const q: Question = { ...baseQuestion, forumUrl: null };
      render(<GetMoreHelp question={q} selectedAnswer="B" />);

      expect(screen.queryByText('Discuss with Other Hams')).not.toBeInTheDocument();
      expect(screen.getByText('Get AI Prompt')).toBeInTheDocument();
    });

    it('always shows "Get AI Prompt"', () => {
      const q: Question = { ...baseQuestion, forumUrl: null, topics: [] };
      render(<GetMoreHelp question={q} selectedAnswer="B" />);

      expect(screen.getByText('Get AI Prompt')).toBeInTheDocument();
    });
  });

  describe('topic buttons', () => {
    it('renders topic buttons', () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      expect(screen.getByText('Radio Basics')).toBeInTheDocument();
      expect(screen.getByText('Safety')).toBeInTheDocument();
    });

    it('calls onTopicClick when topic button is clicked', () => {
      const onTopicClick = vi.fn();
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" onTopicClick={onTopicClick} />);

      fireEvent.click(screen.getByText('Radio Basics'));
      expect(onTopicClick).toHaveBeenCalledWith('radio-basics');
    });
  });

  describe('forum link', () => {
    it('links through OIDC auth with origin parameter', () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      const link = screen.getByRole('link', { name: /Discuss with Other Hams/i });
      expect(link).toHaveAttribute('href', 'https://forum.openhamprep.com/auth/oidc?origin=%2Ft%2Ft1a01-question%2F123');
    });

    it('opens in new tab', () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      const link = screen.getByRole('link', { name: /Discuss with Other Hams/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('AI prompt copy', () => {
    it('copies prompt to clipboard on click', async () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      fireEvent.click(screen.getByText('Get AI Prompt'));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      });

      const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(copiedText).toContain('T1A01');
      expect(copiedText).toContain('Technician');
    });

    it('shows success toast on copy', async () => {
      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      fireEvent.click(screen.getByText('Get AI Prompt'));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Prompt copied! Paste into your favorite AI chatbot.');
      });
    });

    it('shows error toast on clipboard failure', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
        writable: true,
        configurable: true,
      });

      render(<GetMoreHelp question={baseQuestion} selectedAnswer="B" />);

      fireEvent.click(screen.getByText('Get AI Prompt'));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to copy prompt to clipboard');
      });
    });
  });
});

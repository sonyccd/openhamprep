import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { GlossaryFlashcards } from './GlossaryFlashcards';

// Mock Supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const mockTerms = [
  { id: '1', term: 'Antenna', definition: 'Device for transmitting/receiving radio waves', created_at: '2024-01-01' },
  { id: '2', term: 'Band', definition: 'A range of frequencies', created_at: '2024-01-01' },
  { id: '3', term: 'CW', definition: 'Continuous Wave (Morse code)', created_at: '2024-01-01' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('GlossaryFlashcards', () => {
  const defaultProps = {
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain
    mockOrder.mockResolvedValue({ data: mockTerms, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching terms', async () => {
      mockOrder.mockReturnValue(new Promise(() => {}));

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      // The loading state shows "TUNING..." text
      await waitFor(() => {
        expect(screen.getByText('TUNING...')).toBeInTheDocument();
      });
    });
  });

  describe('Start Screen', () => {
    it('displays title', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Study Terms')).toBeInTheDocument();
      });
    });

    it('displays term count', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('3 TERMS LOADED')).toBeInTheDocument();
      });
    });

    it('displays Back button', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
      });
    });

    it('calls onBack when Back is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<GlossaryFlashcards onBack={onBack} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^back$/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('displays Start Studying button', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });
    });

    it('displays card direction options', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Select Mode')).toBeInTheDocument();
        expect(screen.getByText('Term → Definition')).toBeInTheDocument();
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });
    });
  });

  describe('Mode Selection', () => {
    it('displays both mode options', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Term → Definition')).toBeInTheDocument();
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });
    });

    it('allows clicking on mode options', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });

      // Should be able to click without error
      await user.click(screen.getByText('Definition → Term'));

      // The option should still be visible
      expect(screen.getByText('Definition → Term')).toBeInTheDocument();
    });
  });

  describe('Flashcard Study Session', () => {
    it('starts session when Start Studying is clicked', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      // Should now show flashcard view with navigation - format is "1" then "/3" in opacity span
      await waitFor(() => {
        expect(screen.getByText('/3')).toBeInTheDocument();
      });
    });

    it('displays Got It and Review buttons during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
      });
    });

    it('displays progress indicator during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      // Progress indicator shows card count - "1" and "/3" separately
      await waitFor(() => {
        expect(screen.getByText('/3')).toBeInTheDocument();
      });
    });

    it('shows Back button during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Card Flipping', () => {
    it('displays tap to reveal text', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByText(/tap to reveal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Marking Cards', () => {
    it('advances to next card when marking as known', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      // Should start at card 1
      await waitFor(() => {
        expect(screen.getByText(/1/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /got it/i }));

      // Should advance to card 2
      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });

    it('advances to next card when marking for review', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      // Should start at card 1
      await waitFor(() => {
        expect(screen.getByText(/1/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /review/i }));

      // Should advance to card 2
      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('disables previous button on first card', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const prevButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-left'));
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Empty Terms', () => {
    it('handles empty terms list', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('0 TERMS LOADED')).toBeInTheDocument();
      });
    });
  });
});

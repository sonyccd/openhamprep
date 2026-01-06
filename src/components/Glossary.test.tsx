import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { Glossary } from './Glossary';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock Supabase
const mockOrder = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const mockTerms = [
  { id: '1', term: 'Amateur Radio', definition: 'Non-commercial radio communication' },
  { id: '2', term: 'Band', definition: 'A range of frequencies' },
  { id: '3', term: 'CW', definition: 'Continuous Wave (Morse code)' },
  { id: '4', term: 'Antenna', definition: 'Device for transmitting/receiving' },
  { id: '5', term: '73', definition: 'Best regards (ham radio slang)' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppNavigationProvider>
          {children}
        </AppNavigationProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

describe('Glossary', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain
    mockOrder.mockResolvedValue({ data: mockTerms, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching terms', () => {
      // Make the query never resolve
      mockOrder.mockReturnValue(new Promise(() => {}));

      render(<Glossary />, { wrapper: createWrapper() });

      // Check for the loading spinner by its class (Loader2 from lucide-react)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('displays glossary title', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Glossary')).toBeInTheDocument();
      });
    });

    it('displays term count', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/5 terms/)).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('displays search input', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search terms or definitions/i)).toBeInTheDocument();
      });
    });

    it('filters terms by search query in term name', async () => {
      const user = userEvent.setup();

      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search terms or definitions/i), 'Band');

      await waitFor(() => {
        expect(screen.getByText('Band')).toBeInTheDocument();
        expect(screen.queryByText('Amateur Radio')).not.toBeInTheDocument();
        expect(screen.queryByText('CW')).not.toBeInTheDocument();
      });
    });

    it('filters terms by search query in definition', async () => {
      const user = userEvent.setup();

      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search terms or definitions/i), 'morse');

      await waitFor(() => {
        expect(screen.getByText('CW')).toBeInTheDocument();
        expect(screen.queryByText('Amateur Radio')).not.toBeInTheDocument();
        expect(screen.queryByText('Band')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();

      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search terms or definitions/i), 'xyznonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no terms found matching "xyznonexistent"/i)).toBeInTheDocument();
      });
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();

      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search terms or definitions/i), 'BAND');

      await waitFor(() => {
        expect(screen.getByText('Band')).toBeInTheDocument();
      });
    });
  });

  describe('Term Display', () => {
    it('displays all terms', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio')).toBeInTheDocument();
        expect(screen.getByText('Band')).toBeInTheDocument();
        expect(screen.getByText('CW')).toBeInTheDocument();
        expect(screen.getByText('Antenna')).toBeInTheDocument();
        expect(screen.getByText('73')).toBeInTheDocument();
      });
    });

    it('displays term definitions', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Non-commercial radio communication')).toBeInTheDocument();
        expect(screen.getByText('A range of frequencies')).toBeInTheDocument();
        expect(screen.getByText('Continuous Wave (Morse code)')).toBeInTheDocument();
      });
    });
  });

  describe('Alphabetical Grouping', () => {
    it('groups terms by first letter', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should have letter headers A, B, C, #
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
        expect(screen.getByText('#')).toBeInTheDocument(); // For '73'
      });
    });

    it('places non-alphabetic terms under #', async () => {
      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        // '73' should be grouped under '#'
        expect(screen.getByText('#')).toBeInTheDocument();
        expect(screen.getByText('73')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('handles empty terms list', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      render(<Glossary />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/0 terms/)).toBeInTheDocument();
      });
    });
  });
});

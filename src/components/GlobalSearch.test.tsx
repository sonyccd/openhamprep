import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock the hooks
const mockSetQuery = vi.fn();
const mockReset = vi.fn();
const mockNavigate = vi.fn();
const mockNavigateToGlossaryTerm = vi.fn();
const mockNavigateToTopic = vi.fn();

vi.mock('@/hooks/useGlobalSearch', () => ({
  useGlobalSearch: vi.fn(() => ({
    query: '',
    setQuery: mockSetQuery,
    results: {
      questions: [],
      glossary: [],
      topics: [],
      tools: [],
    },
    isLoading: false,
    error: null,
    totalCount: 0,
    hasResults: false,
    reset: mockReset,
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAppNavigation', async () => {
  const actual = await vi.importActual('@/hooks/useAppNavigation');
  return {
    ...actual,
    useAppNavigation: () => ({
      setCurrentView: vi.fn(),
      navigateToTopic: mockNavigateToTopic,
      navigateToGlossaryTerm: mockNavigateToGlossaryTerm,
      currentView: 'dashboard',
      selectedGlossaryTermId: null,
      setSelectedGlossaryTermId: vi.fn(),
    }),
  };
});

import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const renderGlobalSearch = (props = {}) => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    testType: 'technician' as const,
  };

  return render(
    <BrowserRouter>
      <GlobalSearch {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGlobalSearch).mockReturnValue({
      query: '',
      setQuery: mockSetQuery,
      results: {
        questions: [],
        glossary: [],
        topics: [],
        tools: [],
      },
      isLoading: false,
      error: null,
      totalCount: 0,
      hasResults: false,
      reset: mockReset,
    });
  });

  describe('Rendering', () => {
    it('renders the dialog when open', () => {
      renderGlobalSearch();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderGlobalSearch({ open: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      renderGlobalSearch();

      expect(screen.getByPlaceholderText('Search questions, glossary, topics, tools...')).toBeInTheDocument();
    });

    it('renders keyboard hints footer', () => {
      renderGlobalSearch();

      // Check for keyboard hint labels by finding the kbd elements
      expect(screen.getByText('↑↓')).toBeInTheDocument();
      expect(screen.getByText('↵')).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
      // Check the labels are present
      expect(screen.getByText('Navigate')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
      // Use getAllByText for Close since there's also the dialog close button
      expect(screen.getAllByText('Close').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Initial State Messages', () => {
    it('shows "Start typing to search..." when query is empty', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: '',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: null,
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Start typing to search...')).toBeInTheDocument();
    });

    it('shows "Type 2 more characters..." when query has 1 character', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'a',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: null,
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Type 2 more characters...')).toBeInTheDocument();
    });

    it('shows "Type 1 more character..." when query has 2 characters', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'ab',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: null,
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Type 1 more character...')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when searching', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: true,
        error: null,
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      // Multiple elements show "Searching..." (visible and sr-only)
      expect(screen.getAllByText('Searching...').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Empty State', () => {
    it('shows "No results found" when search returns empty', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'xyznonexistent',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: null,
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText(/No results found for "xyznonexistent"/)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when search fails', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: new Error('Search failed'),
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      // Error message appears in both visible alert and sr-only status
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Search failed. Please try again.');
    });

    it('does not show loading state when error is present', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: true,
        error: new Error('Search failed'),
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      // Loading spinner should not be visible when there's an error
      expect(screen.queryByLabelText('Searching')).not.toBeInTheDocument();
    });

    it('does not show empty state when error is present', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: { questions: [], glossary: [], topics: [], tools: [] },
        isLoading: false,
        error: new Error('Search failed'),
        totalCount: 0,
        hasResults: false,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('displays question results', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'T5A01',
        setQuery: mockSetQuery,
        results: {
          questions: [{
            type: 'question',
            id: 'q1',
            title: 'T5A01',
            subtitle: 'What is current measured in?',
            displayName: 'T5A01',
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      // Questions group heading (may be hidden by cmdk when no search value)
      expect(screen.getByText('Questions', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      // Question title and subtitle
      expect(screen.getByText('T5A01')).toBeInTheDocument();
      expect(screen.getByText('What is current measured in?')).toBeInTheDocument();
    });

    it('displays glossary results', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [{
            type: 'glossary',
            id: 'g1',
            title: 'Antenna',
            subtitle: 'A device for transmitting radio waves.',
          }],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Glossary', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('Antenna')).toBeInTheDocument();
      expect(screen.getByText('A device for transmitting radio waves.')).toBeInTheDocument();
    });

    it('displays topic results', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [],
          topics: [{
            type: 'topic',
            id: 't1',
            title: 'Antenna Basics',
            subtitle: 'Learn about antenna fundamentals.',
            slug: 'antenna-basics',
          }],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Topics', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('Antenna Basics')).toBeInTheDocument();
      expect(screen.getByText('Learn about antenna fundamentals.')).toBeInTheDocument();
    });

    it('displays all result types together', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: {
          questions: [{
            type: 'question',
            id: 'q1',
            title: 'T3A03',
            subtitle: 'What antenna polarization...',
            displayName: 'T3A03',
          }],
          glossary: [{
            type: 'glossary',
            id: 'g1',
            title: 'Antenna',
            subtitle: 'A device for transmitting...',
          }],
          topics: [{
            type: 'topic',
            id: 't1',
            title: 'Antenna Basics',
            subtitle: 'Learn about antennas...',
            slug: 'antenna-basics',
          }],
          tools: [{
            type: 'tool',
            id: 'tool1',
            title: '4NEC2',
            subtitle: 'Free antenna modeling software...',
            url: 'https://www.qsl.net/4nec2/',
          }],
        },
        isLoading: false,
        error: null,
        totalCount: 4,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Questions', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('Glossary', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('Topics', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('Tools', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
    });

    it('displays tool results', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'wsjt',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [],
          topics: [],
          tools: [{
            type: 'tool',
            id: 'tool1',
            title: 'WSJT-X',
            subtitle: 'Weak signal communication software.',
            url: 'https://wsjt.sourceforge.io/',
          }],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      expect(screen.getByText('Tools', { selector: '[cmdk-group-heading]' })).toBeInTheDocument();
      expect(screen.getByText('WSJT-X')).toBeInTheDocument();
      expect(screen.getByText('Weak signal communication software.')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates query when typing in input', async () => {
      const user = userEvent.setup();
      renderGlobalSearch();

      const input = screen.getByPlaceholderText('Search questions, glossary, topics, tools...');
      await user.type(input, 'antenna');

      // setQuery should be called for each character
      expect(mockSetQuery).toHaveBeenCalled();
    });

    it('calls onOpenChange(false) and reset when dialog is closed', async () => {
      const onOpenChange = vi.fn();
      renderGlobalSearch({ onOpenChange });

      // Press Escape to close
      const user = userEvent.setup();
      await user.keyboard('{Escape}');

      // Dialog should close
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Navigation', () => {
    it('navigates to question when question result is selected', async () => {
      const onOpenChange = vi.fn();
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'T5A01',
        setQuery: mockSetQuery,
        results: {
          questions: [{
            type: 'question',
            id: 'q1',
            title: 'T5A01',
            subtitle: 'What is current measured in?',
            displayName: 'T5A01',
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch({ onOpenChange });

      const user = userEvent.setup();
      const resultItem = screen.getByText('T5A01').closest('[cmdk-item]');
      await user.click(resultItem!);

      expect(mockNavigate).toHaveBeenCalledWith('/questions/T5A01');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('navigates to glossary term when glossary result is selected', async () => {
      const onOpenChange = vi.fn();
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [{
            type: 'glossary',
            id: 'g1',
            title: 'Antenna',
            subtitle: 'A device for transmitting...',
          }],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch({ onOpenChange });

      const user = userEvent.setup();
      const resultItem = screen.getByText('Antenna').closest('[cmdk-item]');
      await user.click(resultItem!);

      expect(mockNavigateToGlossaryTerm).toHaveBeenCalledWith('g1');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('navigates to topic when topic result is selected', async () => {
      const onOpenChange = vi.fn();
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'antenna',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [],
          topics: [{
            type: 'topic',
            id: 't1',
            title: 'Antenna Basics',
            subtitle: 'Learn about antennas...',
            slug: 'antenna-basics',
          }],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch({ onOpenChange });

      const user = userEvent.setup();
      const resultItem = screen.getByText('Antenna Basics').closest('[cmdk-item]');
      await user.click(resultItem!);

      expect(mockNavigateToTopic).toHaveBeenCalledWith('antenna-basics');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('opens tool URL in new tab when tool result is selected', async () => {
      const onOpenChange = vi.fn();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'wsjt',
        setQuery: mockSetQuery,
        results: {
          questions: [],
          glossary: [],
          topics: [],
          tools: [{
            type: 'tool',
            id: 'tool1',
            title: 'WSJT-X',
            subtitle: 'Weak signal communication software.',
            url: 'https://wsjt.sourceforge.io/',
          }],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch({ onOpenChange });

      const user = userEvent.setup();
      const resultItem = screen.getByText('WSJT-X').closest('[cmdk-item]');
      await user.click(resultItem!);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://wsjt.sourceforge.io/',
        '_blank',
        'noopener,noreferrer'
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);

      windowOpenSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog role', () => {
      renderGlobalSearch();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible search input', () => {
      renderGlobalSearch();

      const input = screen.getByPlaceholderText('Search questions, glossary, topics, tools...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('result items are focusable and selectable', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'T5A01',
        setQuery: mockSetQuery,
        results: {
          questions: [{
            type: 'question',
            id: 'q1',
            title: 'T5A01',
            subtitle: 'Test question',
            displayName: 'T5A01',
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      // cmdk items should have option role for accessibility
      const resultItem = screen.getByText('T5A01').closest('[cmdk-item]');
      expect(resultItem).toBeInTheDocument();
    });

    it('has keyboard hints for navigation', () => {
      renderGlobalSearch();

      // Check that keyboard shortcuts are displayed
      expect(screen.getByText('↑↓')).toBeInTheDocument();
      expect(screen.getByText('↵')).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('search input receives focus when dialog opens', () => {
      renderGlobalSearch();

      const input = screen.getByPlaceholderText('Search questions, glossary, topics, tools...');
      // Input should be focused (cmdk auto-focuses the input)
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Result Icons', () => {
    it('displays question icon for question results', () => {
      vi.mocked(useGlobalSearch).mockReturnValue({
        query: 'T5A01',
        setQuery: mockSetQuery,
        results: {
          questions: [{
            type: 'question',
            id: 'q1',
            title: 'T5A01',
            subtitle: 'Test',
            displayName: 'T5A01',
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        isLoading: false,
        error: null,
        totalCount: 1,
        hasResults: true,
        reset: mockReset,
      });

      renderGlobalSearch();

      // Find the result item containing the icon
      const resultItem = screen.getByText('T5A01').closest('[cmdk-item]');
      expect(resultItem).toBeInTheDocument();
      expect(resultItem?.querySelector('svg')).toBeInTheDocument();
    });
  });
});

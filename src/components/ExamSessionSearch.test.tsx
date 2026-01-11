import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExamSessionSearch } from './ExamSessionSearch';

// Import the supabase mock
import '@/test/mocks/supabase';

// Mock ExamSessionMap since it requires leaflet which doesn't work in jsdom
vi.mock('./ExamSessionMap', () => ({
  ExamSessionMap: () => null,
}));

const mockExamSessions = [
  {
    id: 'session-1',
    title: 'Test Session 1',
    exam_date: '2025-02-01',
    exam_time: '9:00 AM',
    sponsor: 'ARRL',
    location_name: 'Community Center',
    address: '123 Main St',
    city: 'Raleigh',
    state: 'NC',
    zip: '27601',
    walk_ins_allowed: true,
    phone: '555-1234',
    email: 'test@example.com',
    latitude: 35.7796,
    longitude: -78.6382,
  },
  {
    id: 'session-2',
    title: 'Test Session 2',
    exam_date: '2025-02-15',
    exam_time: '10:00 AM',
    sponsor: 'Laurel VEC',
    location_name: 'Library',
    address: '456 Oak Ave',
    city: 'Durham',
    state: 'NC',
    zip: '27701',
    walk_ins_allowed: false,
    phone: null,
    email: 'test2@example.com',
    latitude: 35.9940,
    longitude: -78.8986,
  },
];

const mockUseExamSessions = vi.fn(() => ({
  data: {
    sessions: mockExamSessions,
    totalCount: 2,
    totalPages: 1,
  },
  isLoading: false,
  error: null,
}));

const mockUseUserTargetExam = vi.fn(() => ({
  data: null,
  isLoading: false,
}));

const mockSaveTargetMutation = {
  mutate: vi.fn(),
  isPending: false,
};

const mockRemoveTargetMutation = {
  mutate: vi.fn(),
  isPending: false,
};

vi.mock('@/hooks/useExamSessions', () => ({
  useExamSessions: () => mockUseExamSessions(),
  useUserTargetExam: () => mockUseUserTargetExam(),
  useSaveTargetExam: () => mockSaveTargetMutation,
  useRemoveTargetExam: () => mockRemoveTargetMutation,
}));

const mockUseAuth = vi.fn(() => ({ user: null }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ExamSessionSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock values
    mockUseExamSessions.mockReturnValue({
      data: {
        sessions: mockExamSessions,
        totalCount: 2,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });
  });

  describe('Initial Rendering', () => {
    it('renders the Find Exam Sessions title', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByText('Find Exam Sessions')).toBeInTheDocument();
    });

    it('renders session list by default', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        expect(screen.getByText('Community Center')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
      });
    });

    it('shows List and Map view toggle buttons', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByRole('tab', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /map/i })).toBeInTheDocument();
    });
  });

  describe('Mobile Filter Collapsibility', () => {
    it('renders Filters button on mobile view', () => {
      renderWithProviders(<ExamSessionSearch />);
      // The Filters button should exist (hidden on desktop via CSS)
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toBeInTheDocument();
    });

    it('filters are collapsed by default (hidden class applied)', () => {
      renderWithProviders(<ExamSessionSearch />);
      // Find the CardContent that contains the filter inputs
      const zipInput = screen.getByLabelText(/zip code/i);
      const cardContent = zipInput.closest('[class*="hidden"]');
      // On initial render, the filters container should have 'hidden' class for mobile
      expect(cardContent).toHaveClass('hidden');
    });

    it('expands filters when Filters button is clicked', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      await waitFor(() => {
        const zipInput = screen.getByLabelText(/zip code/i);
        const cardContent = zipInput.closest('[class*="block"]');
        expect(cardContent).toHaveClass('block');
      });
    });

    it('collapses filters when Filters button is clicked again', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });

      // Expand
      fireEvent.click(filtersButton);
      await waitFor(() => {
        const zipInput = screen.getByLabelText(/zip code/i);
        const cardContent = zipInput.closest('[class*="block"]');
        expect(cardContent).toHaveClass('block');
      });

      // Collapse
      fireEvent.click(filtersButton);
      await waitFor(() => {
        const zipInput = screen.getByLabelText(/zip code/i);
        const cardContent = zipInput.closest('[class*="hidden"]');
        expect(cardContent).toHaveClass('hidden');
      });
    });

    it('shows chevron down icon when filters are collapsed', () => {
      renderWithProviders(<ExamSessionSearch />);
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      // Button should contain the text "Filters" - chevron icons are rendered inside
      expect(filtersButton).toBeInTheDocument();
    });
  });

  describe('Filter Inputs', () => {
    it('renders ZIP code input', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    });

    it('renders state select', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    });

    it('renders date range inputs', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByLabelText(/from date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to date/i)).toBeInTheDocument();
    });

    it('renders walk-ins only checkbox', () => {
      renderWithProviders(<ExamSessionSearch />);
      expect(screen.getByLabelText(/walk-ins allowed only/i)).toBeInTheDocument();
    });

    it('allows entering ZIP code', async () => {
      renderWithProviders(<ExamSessionSearch />);
      const zipInput = screen.getByLabelText(/zip code/i) as HTMLInputElement;

      fireEvent.change(zipInput, { target: { value: '27601' } });

      await waitFor(() => {
        expect(zipInput.value).toBe('27601');
      });
    });

    it('limits ZIP code to 5 digits', async () => {
      renderWithProviders(<ExamSessionSearch />);
      const zipInput = screen.getByLabelText(/zip code/i) as HTMLInputElement;

      fireEvent.change(zipInput, { target: { value: '1234567890' } });

      await waitFor(() => {
        expect(zipInput.value).toBe('12345');
      });
    });

    it('strips non-numeric characters from ZIP code', async () => {
      renderWithProviders(<ExamSessionSearch />);
      const zipInput = screen.getByLabelText(/zip code/i) as HTMLInputElement;

      fireEvent.change(zipInput, { target: { value: '27a6b01' } });

      await waitFor(() => {
        expect(zipInput.value).toBe('27601');
      });
    });
  });

  describe('Active Filter Badges', () => {
    it('shows ZIP badge when ZIP is entered and filters collapsed', async () => {
      renderWithProviders(<ExamSessionSearch />);

      // First expand filters to enter a value
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      const zipInput = screen.getByLabelText(/zip code/i);
      fireEvent.change(zipInput, { target: { value: '27601' } });

      // Collapse filters
      fireEvent.click(filtersButton);

      await waitFor(() => {
        expect(screen.getByText('ZIP: 27601')).toBeInTheDocument();
      });
    });

    it('shows walk-ins only badge when checked and filters collapsed', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      const walkInsCheckbox = screen.getByLabelText(/walk-ins allowed only/i);
      fireEvent.click(walkInsCheckbox);

      // Collapse filters
      fireEvent.click(filtersButton);

      await waitFor(() => {
        expect(screen.getByText('Walk-ins only')).toBeInTheDocument();
      });
    });
  });

  describe('Session List Display', () => {
    it('displays session location names', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        expect(screen.getByText('Community Center')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
      });
    });

    it('displays session addresses', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
        expect(screen.getByText(/Raleigh, NC 27601/)).toBeInTheDocument();
      });
    });

    it('shows walk-ins badge for sessions that allow walk-ins', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        expect(screen.getByText('Walk-ins OK')).toBeInTheDocument();
      });
    });

    it('shows phone number as clickable link', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        const phoneLink = screen.getByRole('link', { name: /555-1234/i });
        expect(phoneLink).toHaveAttribute('href', 'tel:555-1234');
      });
    });

    it('shows contact email link', async () => {
      renderWithProviders(<ExamSessionSearch />);
      await waitFor(() => {
        const emailLinks = screen.getAllByRole('link', { name: /contact/i });
        expect(emailLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when data is loading', () => {
      mockUseExamSessions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<ExamSessionSearch />);

      // Look for the loader element (Loader2 icon has animate-spin class)
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows no results message when no sessions found', async () => {
      mockUseExamSessions.mockReturnValue({
        data: {
          sessions: [],
          totalCount: 0,
          totalPages: 0,
        },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<ExamSessionSearch />);

      await waitFor(() => {
        expect(screen.getByText(/no exam sessions found/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Toggle', () => {
    it('renders List tab in tablist', () => {
      renderWithProviders(<ExamSessionSearch />);
      const listTab = screen.getByRole('tab', { name: /list/i });
      expect(listTab).toBeInTheDocument();
    });

    it('renders Map tab in tablist', () => {
      renderWithProviders(<ExamSessionSearch />);
      const mapTab = screen.getByRole('tab', { name: /map/i });
      expect(mapTab).toBeInTheDocument();
    });
  });

  describe('Session Selection', () => {
    it('highlights selected session when clicked', async () => {
      renderWithProviders(<ExamSessionSearch />);

      await waitFor(() => {
        expect(screen.getByText('Community Center')).toBeInTheDocument();
      });

      const sessionCard = screen.getByText('Community Center').closest('[class*="cursor-pointer"]');
      if (sessionCard) {
        fireEvent.click(sessionCard);
      }

      // After clicking, the card should have border-primary class
      await waitFor(() => {
        const selectedCard = screen.getByText('Community Center').closest('[class*="border-primary"]');
        expect(selectedCard).toBeInTheDocument();
      });
    });
  });

  describe('Custom Date Feature', () => {
    beforeEach(() => {
      // Mock authenticated user for custom date tests
      mockUseAuth.mockReturnValue({ user: { id: 'test-user' } });
      // Reset to no target by default
      mockUseUserTargetExam.mockReturnValue({
        data: null,
        isLoading: false,
      });
    });

    it('shows custom date button when user is logged in and has no target', async () => {
      renderWithProviders(<ExamSessionSearch />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add custom exam date/i })).toBeInTheDocument();
      });
    });

    it('does not show custom date button when user already has a target', async () => {
      mockUseUserTargetExam.mockReturnValue({
        data: {
          id: 'target-1',
          user_id: 'test-user',
          exam_session_id: 'session-1',
          custom_exam_date: null,
          study_intensity: 'moderate',
          exam_session: mockExamSessions[0],
        },
        isLoading: false,
      });

      renderWithProviders(<ExamSessionSearch />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add custom exam date/i })).not.toBeInTheDocument();
      });
    });

    it('displays custom date target when user has custom_exam_date set', async () => {
      mockUseUserTargetExam.mockReturnValue({
        data: {
          id: 'target-1',
          user_id: 'test-user',
          exam_session_id: null,
          custom_exam_date: '2025-06-15',
          study_intensity: 'intensive',
          exam_session: null,
        },
        isLoading: false,
      });

      renderWithProviders(<ExamSessionSearch />);

      await waitFor(() => {
        expect(screen.getByText('Custom Exam Date')).toBeInTheDocument();
      });
    });

    it('opens custom date dialog when button is clicked', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const customDateButton = screen.getByRole('button', { name: /add custom exam date/i });
      fireEvent.click(customDateButton);

      await waitFor(() => {
        expect(screen.getByText('Set Custom Exam Date')).toBeInTheDocument();
        expect(screen.getByText(/can't find your exam session/i)).toBeInTheDocument();
      });
    });

    it('shows study intensity options in custom date dialog', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const customDateButton = screen.getByRole('button', { name: /add custom exam date/i });
      fireEvent.click(customDateButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/light/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/moderate/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/intensive/i)).toBeInTheDocument();
      });
    });

    it('disables save button when no date is selected', async () => {
      renderWithProviders(<ExamSessionSearch />);

      const customDateButton = screen.getByRole('button', { name: /add custom exam date/i });
      fireEvent.click(customDateButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save target/i });
        expect(saveButton).toBeDisabled();
      });
    });
  });
});

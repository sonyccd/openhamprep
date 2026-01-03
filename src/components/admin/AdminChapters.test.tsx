import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminChapters } from './AdminChapters';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock
import '@/test/mocks/supabase';

const mockChapters = [
  {
    id: 'chapter-1',
    licenseType: 'T' as const,
    chapterNumber: 1,
    title: 'Welcome to Amateur Radio',
    description: 'Introduction to ham radio',
    displayOrder: 1,
    questionCount: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'chapter-2',
    licenseType: 'T' as const,
    chapterNumber: 2,
    title: 'Radio and Signals Fundamentals',
    description: 'Learn about radio waves',
    displayOrder: 2,
    questionCount: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockGeneralChapters = [
  {
    id: 'g-chapter-1',
    licenseType: 'G' as const,
    chapterNumber: 1,
    title: 'General Class Overview',
    description: null,
    displayOrder: 1,
    questionCount: 25,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockChaptersHook = vi.fn((licenseType) => {
  if (licenseType === 'G') {
    return {
      data: mockGeneralChapters,
      isLoading: false,
      error: null,
    };
  }
  if (licenseType === 'E') {
    return {
      data: [],
      isLoading: false,
      error: null,
    };
  }
  return {
    data: mockChapters,
    isLoading: false,
    error: null,
  };
});

const mockAddChapter = {
  mutate: vi.fn(),
  isPending: false,
};

const mockUpdateChapter = {
  mutate: vi.fn(),
  isPending: false,
};

const mockDeleteChapter = {
  mutate: vi.fn(),
  isPending: false,
};

vi.mock('@/hooks/useArrlChapters', () => ({
  useArrlChaptersWithCounts: (licenseType) => mockChaptersHook(licenseType),
  useChapterMutations: () => ({
    addChapter: mockAddChapter,
    updateChapter: mockUpdateChapter,
    deleteChapter: mockDeleteChapter,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderAdminChapters = () => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminChapters />
    </QueryClientProvider>
  );
};

describe('AdminChapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChaptersHook.mockImplementation((licenseType) => {
      if (licenseType === 'G') {
        return { data: mockGeneralChapters, isLoading: false, error: null };
      }
      if (licenseType === 'E') {
        return { data: [], isLoading: false, error: null };
      }
      return { data: mockChapters, isLoading: false, error: null };
    });
  });

  describe('Initial Rendering', () => {
    it('renders the chapters management page', () => {
      renderAdminChapters();

      expect(screen.getByText('ARRL Textbook Chapters')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add chapter/i })).toBeInTheDocument();
    });

    it('displays license type tabs', () => {
      renderAdminChapters();

      expect(screen.getByRole('tab', { name: /technician/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /extra/i })).toBeInTheDocument();
    });

    it('displays search input', () => {
      renderAdminChapters();

      expect(screen.getByPlaceholderText(/search chapters/i)).toBeInTheDocument();
    });

    it('displays chapters for the selected license type', () => {
      renderAdminChapters();

      expect(screen.getByText('Welcome to Amateur Radio')).toBeInTheDocument();
      expect(screen.getByText('Radio and Signals Fundamentals')).toBeInTheDocument();
    });

    it('displays chapter numbers', () => {
      renderAdminChapters();

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays question counts for each chapter', () => {
      renderAdminChapters();

      expect(screen.getByText('15 questions')).toBeInTheDocument();
      expect(screen.getByText('20 questions')).toBeInTheDocument();
    });

    it('displays chapter descriptions when available', () => {
      renderAdminChapters();

      expect(screen.getByText('Introduction to ham radio')).toBeInTheDocument();
      expect(screen.getByText('Learn about radio waves')).toBeInTheDocument();
    });
  });

  describe('License Tab Switching', () => {
    it('switches to General tab when clicked', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('tab', { name: /general/i }));

      expect(screen.getByText('General Class Overview')).toBeInTheDocument();
    });

    it('shows empty state for license type with no chapters', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('tab', { name: /extra/i }));

      expect(screen.getByText(/no chapters defined for extra yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add first chapter/i })).toBeInTheDocument();
    });
  });

  describe('Search Filtering', () => {
    it('filters chapters by title', async () => {
      renderAdminChapters();

      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      fireEvent.change(searchInput, { target: { value: 'Welcome' } });

      expect(screen.getByText('Welcome to Amateur Radio')).toBeInTheDocument();
      expect(screen.queryByText('Radio and Signals Fundamentals')).not.toBeInTheDocument();
    });

    it('filters chapters by chapter number', async () => {
      renderAdminChapters();

      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      fireEvent.change(searchInput, { target: { value: '2' } });

      expect(screen.getByText('Radio and Signals Fundamentals')).toBeInTheDocument();
      expect(screen.queryByText('Welcome to Amateur Radio')).not.toBeInTheDocument();
    });

    it('filters chapters by description', async () => {
      renderAdminChapters();

      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      fireEvent.change(searchInput, { target: { value: 'radio waves' } });

      expect(screen.getByText('Radio and Signals Fundamentals')).toBeInTheDocument();
      expect(screen.queryByText('Welcome to Amateur Radio')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      renderAdminChapters();

      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/no chapters match your search/i)).toBeInTheDocument();
    });
  });

  describe('Add Chapter Dialog', () => {
    it('opens add dialog when Add Chapter button is clicked', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add chapter/i }));

      expect(screen.getByText('Add New Chapter')).toBeInTheDocument();
      expect(screen.getByText('Chapter Number')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('shows current license type in add dialog', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add chapter/i }));

      // Badge showing current license type
      expect(screen.getByText('Adding chapter for:')).toBeInTheDocument();
    });

    it('calls addChapter mutation with correct data', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add chapter/i }));

      // Use placeholders to find inputs
      const chapterNumberInput = screen.getByPlaceholderText(/e\.g\., 1/i);
      const titleInput = screen.getByPlaceholderText(/welcome to amateur radio/i);
      const descriptionInput = screen.getByPlaceholderText(/brief description/i);

      await user.type(chapterNumberInput, '3');
      await user.type(titleInput, 'New Chapter Title');
      await user.type(descriptionInput, 'New chapter description');

      // Wait for the button to become enabled
      await waitFor(() => {
        const submitButtons = screen.getAllByRole('button', { name: /add chapter/i });
        const submitButton = submitButtons[submitButtons.length - 1];
        expect(submitButton).not.toBeDisabled();
      });

      // Find and click the submit button inside the dialog
      const submitButtons = screen.getAllByRole('button', { name: /add chapter/i });
      const submitButton = submitButtons[submitButtons.length - 1];
      await user.click(submitButton);

      expect(mockAddChapter.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          licenseType: 'T',
          chapterNumber: 3,
          title: 'New Chapter Title',
          description: 'New chapter description',
        }),
        expect.any(Object)
      );
    });

    it('disables submit button when required fields are empty', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add chapter/i }));

      // Find the submit button inside the dialog
      const submitButtons = screen.getAllByRole('button', { name: /add chapter/i });
      const submitButton = submitButtons[submitButtons.length - 1];

      expect(submitButton).toBeDisabled();
    });

    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add chapter/i }));
      expect(screen.getByText('Add New Chapter')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Add New Chapter')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Chapter Dialog', () => {
    it('opens edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      // Click the edit button for the first chapter
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil')
      );
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Chapter')).toBeInTheDocument();
    });

    it('pre-fills form with chapter data', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil')
      );
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome to Amateur Radio')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Introduction to ham radio')).toBeInTheDocument();
    });

    it('calls updateChapter mutation with correct data', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil')
      );
      await user.click(editButtons[0]);

      const titleInput = screen.getByDisplayValue('Welcome to Amateur Radio');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(mockUpdateChapter.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'chapter-1',
          title: 'Updated Title',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Delete Chapter', () => {
    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      // Open edit dialog first
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil')
      );
      await user.click(editButtons[0]);

      // Click delete button
      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText(/chapter reference removed/i)).toBeInTheDocument();
    });

    it('calls deleteChapter mutation when confirmed', async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      // Open edit dialog first
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil')
      );
      await user.click(editButtons[0]);

      // Click delete button
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Confirm deletion - find the delete button in the alert dialog
      const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      await user.click(confirmButton);

      expect(mockDeleteChapter.mutate).toHaveBeenCalledWith('chapter-1');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when chapters are loading', () => {
      mockChaptersHook.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      renderAdminChapters();

      // The loader should be visible (we can check for the spinner's presence)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message and Add First Chapter button', () => {
      mockChaptersHook.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderAdminChapters();

      expect(screen.getByText(/no chapters defined/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add first chapter/i })).toBeInTheDocument();
    });

    it('opens add dialog when Add First Chapter is clicked', async () => {
      const user = userEvent.setup();
      mockChaptersHook.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderAdminChapters();

      await user.click(screen.getByRole('button', { name: /add first chapter/i }));

      expect(screen.getByText('Add New Chapter')).toBeInTheDocument();
    });
  });
});

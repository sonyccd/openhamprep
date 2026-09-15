import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AdminLessons } from './AdminLessons';
import { muiWrapper } from '@/test/utils/testWrappers';

const mockCreateMutate = vi.fn((_vars, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.()
);
const mockUseAdminLessons = vi.fn();

vi.mock('@/hooks/useLessons', () => ({
  useAdminLessons: () => mockUseAdminLessons(),
  useCreateLesson: () => ({ mutate: mockCreateMutate, isPending: false }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'admin@example.com' } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// LessonEditor is a separate screen; this suite is about the list and the form.
vi.mock('./LessonEditor', () => ({
  LessonEditor: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>editor open</button>
  ),
}));

const lesson = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  title: 'Getting Started',
  slug: 'getting-started',
  description: 'An intro lesson',
  license_types: ['technician'],
  is_published: true,
  display_order: 1,
  topics: [{ id: 't1' }],
  ...over,
});

const renderAdminLessons = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<AdminLessons />, { wrapper });
};

describe('AdminLessons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAdminLessons.mockReturnValue({ data: [lesson()], isLoading: false });
  });

  describe('list', () => {
    it('shows the lesson count and each lesson', () => {
      renderAdminLessons();

      expect(screen.getByText('Lessons (1)')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('/lessons/getting-started')).toBeInTheDocument();
    });

    it('marks published and draft lessons differently', () => {
      mockUseAdminLessons.mockReturnValue({
        data: [lesson(), lesson({ id: 'l2', title: 'Draft One', is_published: false })],
        isLoading: false,
      });
      renderAdminLessons();

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('shows a loading status while fetching', () => {
      mockUseAdminLessons.mockReturnValue({ data: [], isLoading: true });
      renderAdminLessons();

      expect(screen.getByRole('status', { name: /loading lessons/i })).toBeInTheDocument();
    });

    it('invites a first lesson when there are none', () => {
      mockUseAdminLessons.mockReturnValue({ data: [], isLoading: false });
      renderAdminLessons();

      expect(screen.getByText(/create your first lesson/i)).toBeInTheDocument();
    });

    it('filters by title, slug and description', async () => {
      const user = userEvent.setup();
      mockUseAdminLessons.mockReturnValue({
        data: [lesson(), lesson({ id: 'l2', title: 'Antennas', slug: 'antennas' })],
        isLoading: false,
      });
      renderAdminLessons();

      await user.type(screen.getByRole('textbox', { name: /search lessons/i }), 'anten');

      expect(screen.getByText('Antennas')).toBeInTheDocument();
      expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
    });

    /**
     * The row used to be a <div onClick> with a Pencil button beside it that
     * had neither a handler nor an accessible name — so the list could not be
     * reached from a keyboard, and the thing that looked like the control was
     * not one. CardActionArea makes the row itself the button.
     */
    it('opens a lesson from the keyboard', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      const row = screen.getByRole('button', { name: 'Edit Getting Started' });
      row.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('editor open')).toBeInTheDocument();
    });
  });

  describe('add dialog', () => {
    it('labels every field so each control has an accessible name', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));

      expect(screen.getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'License Types' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Publish immediately' })).toBeInTheDocument();
    });

    /**
     * Autofill only fires while the slug is still empty, so typing a title a
     * character at a time leaves the slug at the first letter. That is exactly
     * what main did (`if (!newSlug)`), and it is why a Generate button exists —
     * pinned here so the port is verifiably faithful rather than accidentally
     * changed.
     */
    it('autofills the slug only from the first keystroke', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');

      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toHaveValue('a');
    });

    it('Generate rewrites the slug from the whole title', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');
      await user.click(screen.getByRole('button', { name: 'Generate' }));

      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toHaveValue(
        'antenna-basics'
      );
    });

    it('keeps submit disabled until title and slug are both present', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      const submit = screen.getByRole('button', { name: 'Add Lesson' });
      expect(submit).toBeDisabled();

      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');
      expect(submit).toBeEnabled();
    });

    it('submits the draft', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Antenna Basics', slug: 'antenna-basics' }),
        expect.anything()
      );
    });

    /**
     * The dialog stays mounted, and a successful save closes it from the
     * caller by flipping `open` — it never runs the dialog's own close
     * handler. Hanging the reset off that handler therefore misses the most
     * common path, and the next Add reopens on the last entry. Exactly the
     * leak #288 found in ProfileModal.
     */
    it('reopens blank after a successful save', async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

      // MUI keeps the dialog mounted through its exit transition, and the page
      // behind it stays aria-hidden until that finishes — so "Add Lesson"
      // still resolves to the dialog's own submit until the dialog is gone.
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: /add lesson/i }));

      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toHaveValue('');
    });

    it('keeps what was typed when the save fails', async () => {
      const user = userEvent.setup();
      mockCreateMutate.mockImplementationOnce(() => {
        // Mutation rejects: the dialog stays open, so the draft must survive.
      });
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Antenna Basics');
      await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Antenna Basics');
    });

    it('refuses a slug that already exists', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      renderAdminLessons();

      await user.click(screen.getByRole('button', { name: /add lesson/i }));
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Getting Started');
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

      expect(toast.error).toHaveBeenCalledWith('A lesson with this slug already exists');
      expect(mockCreateMutate).not.toHaveBeenCalled();
    });
  });
});

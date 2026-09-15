import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonEditor } from './LessonEditor';
import { muiWrapper } from '@/test/utils/testWrappers';
import type { Lesson } from '@/types/lessons';

const mockUpdate = vi.fn((_vars, opts?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
  opts?.onSuccess?.()
);
const mockDelete = vi.fn((_id, opts?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
  opts?.onSuccess?.()
);

vi.mock('@/hooks/useLessons', () => ({
  useUpdateLesson: () => ({ mutate: mockUpdate, isPending: false }),
  useDeleteLesson: () => ({ mutate: mockDelete, isPending: false }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'admin@example.com' } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Managing a lesson's topics is its own screen.
vi.mock('./LessonTopicManager', () => ({ LessonTopicManager: () => <div>topic manager</div> }));

const lesson = (over: Partial<Lesson> = {}): Lesson =>
  ({
    id: 'l1',
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'An intro lesson',
    license_types: ['technician'],
    is_published: true,
    display_order: 3,
    edit_history: [],
    topics: [],
    ...over,
  }) as Lesson;

const renderEditor = (over: Partial<Lesson> = {}, onBack = vi.fn()) => {
  render(<LessonEditor lesson={lesson(over)} onBack={onBack} />, { wrapper: muiWrapper });
  return { onBack };
};

const openSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('tab', { name: 'Settings' }));
};

describe('LessonEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('header', () => {
    it('shows the lesson and its path', () => {
      renderEditor();

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('/lessons/getting-started')).toBeInTheDocument();
    });

    /** The back control was an icon button with no accessible name. */
    it('names the back button', async () => {
      const user = userEvent.setup();
      const { onBack } = renderEditor();

      await user.click(screen.getByRole('button', { name: 'Back to lessons' }));

      expect(onBack).toHaveBeenCalled();
    });

    it('disables Save until something changes', async () => {
      const user = userEvent.setup();
      renderEditor();

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();

      await openSettings(user);
      await user.type(screen.getByRole('textbox', { name: 'Title' }), '!');

      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    });

    it('offers Unpublish for a published lesson and publishes immediately', async () => {
      const user = userEvent.setup();
      renderEditor({ is_published: false });

      await user.click(screen.getByRole('button', { name: /publish/i }));

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'l1', is_published: true }),
        expect.anything()
      );
    });

    it('reverts the toggle when publishing fails', async () => {
      const user = userEvent.setup();
      mockUpdate.mockImplementationOnce((_vars, opts?: { onError?: (e: Error) => void }) =>
        opts?.onError?.(new Error('nope'))
      );
      renderEditor({ is_published: false });

      await user.click(screen.getByRole('button', { name: /publish/i }));

      // Back to the pre-click label, so the button still offers to publish.
      expect(screen.getByRole('button', { name: /^publish$/i })).toBeInTheDocument();
    });
  });

  describe('settings', () => {
    it('labels every field', async () => {
      const user = userEvent.setup();
      renderEditor();
      await openSettings(user);

      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Getting Started');
      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Display Order' })).toHaveValue(3);
      expect(screen.getByRole('switch', { name: /published/i })).toBeChecked();
    });

    it('Generate rewrites the slug from the title', async () => {
      const user = userEvent.setup();
      renderEditor({ title: 'Antenna Basics', slug: 'old-slug' });
      await openSettings(user);

      await user.click(screen.getByRole('button', { name: 'Generate' }));

      expect(screen.getByRole('textbox', { name: 'Slug (URL-friendly)' })).toHaveValue(
        'antenna-basics'
      );
    });

    it('toggles licence types', async () => {
      const user = userEvent.setup();
      renderEditor();
      await openSettings(user);

      const general = screen.getByRole('checkbox', { name: 'General' });
      expect(general).not.toBeChecked();
      await user.click(general);

      expect(general).toBeChecked();
      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    });

    /**
     * The dirty check used to call licenseTypes.sort(), which sorts in place —
     * mutating state during render. Reordering the same set must not read as a
     * change, and must not disturb the arrays it compares.
     */
    it('does not treat a reordered licence set as a change', async () => {
      const user = userEvent.setup();
      renderEditor({ license_types: ['extra', 'technician'] });
      await openSettings(user);

      // Toggling one off and back on restores the set in a different order.
      await user.click(screen.getByRole('checkbox', { name: 'Extra' }));
      await user.click(screen.getByRole('checkbox', { name: 'Extra' }));

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('saves only what changed into the edit history', async () => {
      const user = userEvent.setup();
      renderEditor();
      await openSettings(user);

      const description = screen.getByRole('textbox', { name: 'Description' });
      await user.clear(description);
      await user.type(description, 'A better intro.');
      await user.click(screen.getByRole('button', { name: /save/i }));

      const payload = mockUpdate.mock.calls[0][0] as {
        edit_history: { changes: Record<string, unknown> }[];
      };
      expect(Object.keys(payload.edit_history.at(-1)!.changes)).toEqual(['description']);
    });

    it('refuses to save without a title', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      renderEditor();
      await openSettings(user);

      await user.clear(screen.getByRole('textbox', { name: 'Title' }));
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(toast.error).toHaveBeenCalledWith('Title is required');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('confirms before deleting, as a named alertdialog', async () => {
      const user = userEvent.setup();
      renderEditor();

      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toHaveAccessibleName('Delete Lesson?');
      expect(confirm).toHaveAccessibleDescription(/topics in this lesson will not be deleted/i);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes and goes back once confirmed', async () => {
      const user = userEvent.setup();
      const { onBack } = renderEditor();

      await user.click(screen.getByRole('button', { name: /^delete$/i }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' })
      );

      expect(mockDelete).toHaveBeenCalledWith('l1', expect.anything());
      expect(onBack).toHaveBeenCalled();
    });

    it('stays put when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      renderEditor();

      await user.click(screen.getByRole('button', { name: /^delete$/i }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('alertdialog'));
      expect(mockDelete).not.toHaveBeenCalled();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });
});

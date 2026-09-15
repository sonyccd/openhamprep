import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { TopicResourceManager } from './TopicResourceManager';
import { createTestQueryClient, muiWrapper } from '@/test/utils/testWrappers';
import type { TopicResource } from '@/hooks/useTopics';
import { MAX_RESOURCE_FILE_SIZE } from './topics/resourceDraft';

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
      // Supabase calls .eq(column, value); the mock has to take both or it
      // records the column name as the id.
      update: (...args: unknown[]) => ({
        eq: (_column: string, value: string) => mockUpdate(args[0], value),
      }),
      delete: () => ({ eq: (_column: string, value: string) => mockDelete(value) }),
    }),
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        remove: (...args: unknown[]) => mockRemove(...args),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://storage.example.com/${path}` },
        }),
      }),
    },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const resource = (over: Partial<TopicResource> = {}): TopicResource =>
  ({
    id: 'resource-1',
    topic_id: 'topic-123',
    resource_type: 'video',
    title: 'Introduction Video',
    url: 'https://youtube.com/watch?v=12345',
    storage_path: null,
    description: 'A helpful introduction',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    ...over,
  }) as TopicResource;

const uploaded = resource({
  id: 'resource-2',
  resource_type: 'pdf',
  title: 'Study Guide',
  url: null,
  storage_path: 'resources/topic-123/guide.pdf',
  description: 'PDF study guide',
  display_order: 2,
});

const renderManager = (resources: TopicResource[] = [resource(), uploaded]) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<TopicResourceManager topicId="topic-123" resources={resources} />, { wrapper });
};

const openAdd = async (user: ReturnType<typeof userEvent.setup>) => {
  renderManager();
  await user.click(screen.getByRole('button', { name: 'Add Resource' }));
  return within(screen.getByRole('dialog'));
};

/** MUI renders the Select as a div[role=combobox], opening a listbox. */
const chooseType = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole('combobox', { name: 'Type' }));
  await user.click(screen.getByRole('option', { name: label }));
};

describe('TopicResourceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockResolvedValue({ error: null });
    mockDelete.mockResolvedValue({ error: null });
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  describe('the list', () => {
    it('heads the section and counts what is in it', () => {
      renderManager();

      expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('links a URL resource out, and an uploaded one to its file', () => {
      renderManager();

      expect(screen.getByRole('link', { name: /youtube\.com/ })).toHaveAttribute(
        'href',
        'https://youtube.com/watch?v=12345'
      );
      expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
        'href',
        'https://storage.example.com/resources/topic-123/guide.pdf'
      );
    });

    it('marks which resources came from an upload', () => {
      renderManager();

      expect(screen.getByText('Uploaded')).toBeInTheDocument();
    });

    it('orders by display_order rather than by the order given', () => {
      renderManager([
        resource({ display_order: 2 }),
        { ...uploaded, display_order: 1 } as TopicResource,
      ]);

      const titles = screen.getAllByText(/Introduction Video|Study Guide/);
      expect(titles[0]).toHaveTextContent('Study Guide');
      expect(titles[1]).toHaveTextContent('Introduction Video');
    });

    it('says what the section is for when it is empty', () => {
      renderManager([]);

      expect(screen.getByText('No resources yet')).toBeInTheDocument();
      expect(
        screen.getByText('Add videos, articles, and links for this topic')
      ).toBeInTheDocument();
    });

    /**
     * The row actions are hidden until hover. Hover is not a state a keyboard
     * reaches, so without :focus-within a user tabbing to Edit landed on a
     * control that was still invisible. happy-dom does not resolve the
     * pseudo-class, so this asserts the rule the row actually emits.
     */
    it('reveals the row actions on focus, not only on hover', () => {
      renderManager();

      const css = Array.from(document.querySelectorAll('style'))
        .map((tag) => tag.textContent ?? '')
        .join('\n');
      const reveal = css
        .split('}')
        .filter((rule) => rule.includes('.ResourceRow-actions') && rule.includes('opacity:1'));

      expect(reveal.some((rule) => rule.includes(':focus-within'))).toBe(true);
      expect(reveal.some((rule) => rule.includes(':hover'))).toBe(true);
    });
  });

  describe('adding', () => {
    it('names the dialog and labels every field', async () => {
      const user = userEvent.setup();
      const dialog = await openAdd(user);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Add Resource');
      expect(dialog.getByRole('combobox', { name: 'Type' })).toBeInTheDocument();
      expect(dialog.getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
      expect(dialog.getByRole('textbox', { name: 'URL' })).toBeInTheDocument();
      expect(dialog.getByRole('textbox', { name: 'Description (optional)' })).toBeInTheDocument();
    });

    it('refuses to save without a title', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      const dialog = await openAdd(user);

      await user.click(dialog.getByRole('button', { name: 'Add Resource' }));

      expect(toast.error).toHaveBeenCalledWith('Please enter a title');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('refuses to save with neither a URL nor a file', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      const dialog = await openAdd(user);

      await user.type(dialog.getByRole('textbox', { name: 'Title' }), 'ARRL Handbook');
      await user.click(dialog.getByRole('button', { name: 'Add Resource' }));

      expect(toast.error).toHaveBeenCalledWith('Please provide a URL or upload a file');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('inserts after the last display_order', async () => {
      const user = userEvent.setup();
      const dialog = await openAdd(user);

      await user.type(dialog.getByRole('textbox', { name: 'Title' }), 'ARRL Handbook');
      await user.type(dialog.getByRole('textbox', { name: 'URL' }), 'https://arrl.org');
      await user.click(dialog.getByRole('button', { name: 'Add Resource' }));

      await waitFor(() =>
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            topic_id: 'topic-123',
            title: 'ARRL Handbook',
            url: 'https://arrl.org',
            display_order: 3,
          })
        )
      );
    });

    /**
     * The form used to clear only after a successful save, so cancelling and
     * reopening showed the abandoned entry. Verified against that original:
     * clearing on success alone fails this.
     */
    it('opens blank after an abandoned entry', async () => {
      const user = userEvent.setup();
      const dialog = await openAdd(user);

      await user.type(dialog.getByRole('textbox', { name: 'Title' }), 'Half-typed');
      await user.click(dialog.getByRole('button', { name: 'Cancel' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: 'Add Resource' }));

      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    });
  });

  describe('uploading', () => {
    /** Only some types take a file; a plain link has nothing to upload. */
    it('offers the upload slot for a file-backed type only', async () => {
      const user = userEvent.setup();
      await openAdd(user);

      expect(screen.queryByLabelText('Click to upload a file')).not.toBeInTheDocument();

      await chooseType(user, 'PDF');

      expect(screen.getByLabelText('Click to upload a file')).toBeInTheDocument();
    });

    it('names the resource after the file when nothing is typed', async () => {
      const user = userEvent.setup();
      await openAdd(user);
      await chooseType(user, 'PDF');

      await user.upload(
        screen.getByLabelText('Click to upload a file'),
        new File(['%PDF'], 'Band Plan.pdf', { type: 'application/pdf' })
      );

      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Band Plan');
      expect(screen.getByText('Band Plan.pdf')).toBeInTheDocument();
    });

    /**
     * The size cap rather than the type rule, because the input's accept
     * already keeps a wrong-typed file from reaching the handler here — a
     * size the picker cannot judge is what actually exercises the guard.
     * resourceDraft.test.ts covers the type rules directly.
     */
    it('turns away a file over the size cap', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      await openAdd(user);
      await chooseType(user, 'PDF');

      const huge = new File(['%PDF'], 'Huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(huge, 'size', { value: MAX_RESOURCE_FILE_SIZE + 1 });
      await user.upload(screen.getByLabelText('Click to upload a file'), huge);

      expect(toast.error).toHaveBeenCalledWith('File too large. Maximum size is 25MB.');
      expect(screen.queryByText('Huge.pdf')).not.toBeInTheDocument();
    });

    /**
     * Each type accepts a different set, so a file chosen under the old type
     * may be one the new type rejects — it cannot be carried over silently.
     */
    it('drops a chosen file when the type changes under it', async () => {
      const user = userEvent.setup();
      await openAdd(user);
      await chooseType(user, 'PDF');
      await user.upload(
        screen.getByLabelText('Click to upload a file'),
        new File(['%PDF'], 'Band Plan.pdf', { type: 'application/pdf' })
      );
      expect(screen.getByText('Band Plan.pdf')).toBeInTheDocument();

      await chooseType(user, 'Image');

      expect(screen.queryByText('Band Plan.pdf')).not.toBeInTheDocument();
    });

    it('uploads the file and stores its path with the row', async () => {
      const user = userEvent.setup();
      await openAdd(user);
      await chooseType(user, 'PDF');
      await user.upload(
        screen.getByLabelText('Click to upload a file'),
        new File(['%PDF'], 'Band Plan.pdf', { type: 'application/pdf' })
      );
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Resource' })
      );

      await waitFor(() => expect(mockUpload).toHaveBeenCalled());
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ storage_path: mockUpload.mock.calls[0][0] })
      );
    });

    /** An orphaned upload is worse than none, so a failed insert takes it back. */
    it('removes the upload when the row fails to insert', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: new Error('insert failed') });
      await openAdd(user);
      await chooseType(user, 'PDF');
      await user.upload(
        screen.getByLabelText('Click to upload a file'),
        new File(['%PDF'], 'Band Plan.pdf', { type: 'application/pdf' })
      );
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Resource' })
      );

      await waitFor(() =>
        expect(mockRemove).toHaveBeenCalledWith([mockUpload.mock.calls[0][0]])
      );
    });
  });

  describe('editing', () => {
    it('opens filled with the chosen resource', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Edit Introduction Video' }));

      const dialog = within(screen.getByRole('dialog'));
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit Resource');
      expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('Introduction Video');
      expect(dialog.getByRole('textbox', { name: 'URL' })).toHaveValue(
        'https://youtube.com/watch?v=12345'
      );
    });

    it('saves the edited resource against its id', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Edit Introduction Video' }));
      const title = within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Title' });
      await user.clear(title);
      await user.type(title, 'Getting Started');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() =>
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Getting Started' }),
          'resource-1'
        )
      );
    });

    it('refuses to save with the title emptied', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Edit Introduction Video' }));
      await user.clear(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Title' }));
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(toast.error).toHaveBeenCalledWith('Please enter a title');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleting', () => {
    /**
     * Radix's AlertDialog set role="alertdialog" and registered its
     * Description itself; MUI's Dialog does neither, so ConfirmDeleteDialog
     * carries both by hand (#283).
     */
    it('confirms first, as a named alertdialog', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Delete Introduction Video' }));

      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toHaveAccessibleName('Delete Resource');
      expect(confirm).toHaveAccessibleDescription(/cannot be undone/i);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes once confirmed', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Delete Introduction Video' }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' })
      );

      await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('resource-1'));
    });

    /** A resource backed by a file must not leave that file behind. */
    it('removes the stored file alongside the row', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Delete Study Guide' }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' })
      );

      await waitFor(() =>
        expect(mockRemove).toHaveBeenCalledWith(['resources/topic-123/guide.pdf'])
      );
    });

    it('stays put when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Delete Introduction Video' }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('alertdialog'));
      expect(mockDelete).not.toHaveBeenCalled();
      expect(screen.getByText('Introduction Video')).toBeInTheDocument();
    });
  });
});

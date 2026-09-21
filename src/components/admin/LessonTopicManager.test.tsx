import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { muiWrapper } from '@/test/utils';
import { LessonTopicManager } from './LessonTopicManager';
import type { LessonTopic } from '@/types/lessons';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';

/**
 * dnd-kit's sensors need element geometry that happy-dom does not provide,
 * so a drop can never resolve an `over` target here. The sensors are
 * dnd-kit's to test; what we do on drop is ours. Expose onDragEnd through a
 * button so a test can drop lt-1 onto lt-2.
 */
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (e: unknown) => void }) => (
      <>
        <button type="button" onClick={() => onDragEnd({ active: { id: 'lt-1' }, over: { id: 'lt-2' } })}>
          drop lt-1 on lt-2
        </button>
        {children}
      </>
    ),
  };
});

const mockAdd = { mutate: vi.fn(), isPending: false };
const mockRemove = { mutate: vi.fn(), isPending: false };
const mockOrder = { mutate: vi.fn(), isPending: false };
let mockAdminTopics: { id: string; title: string; description?: string; is_published: boolean }[] = [];

vi.mock('@/hooks/useTopics', () => ({ useAdminTopics: () => ({ data: mockAdminTopics }) }));
vi.mock('@/hooks/useLessons', () => ({
  useAddLessonTopic: () => mockAdd,
  useRemoveLessonTopic: () => mockRemove,
  useUpdateLessonTopicOrder: () => mockOrder,
}));

const topic = (id: string, title: string, is_published = true) =>
  ({ id, title, description: `About ${title}`, is_published }) as LessonTopic['topic'];

const lessonTopics: LessonTopic[] = [
  { id: 'lt-1', lesson_id: 'lesson-1', topic_id: 't-1', display_order: 0, created_at: '', topic: topic('t-1', 'Antennas') },
  { id: 'lt-2', lesson_id: 'lesson-1', topic_id: 't-2', display_order: 1, created_at: '', topic: topic('t-2', 'Propagation', false) },
];

const renderManager = (topics = lessonTopics) =>
  render(<LessonTopicManager lessonId="lesson-1" topics={topics} />, { wrapper: muiWrapper });

describe('LessonTopicManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminTopics = [
      { id: 't-1', title: 'Antennas', description: 'About Antennas', is_published: true },
      { id: 't-2', title: 'Propagation', description: 'About Propagation', is_published: false },
      { id: 't-3', title: 'Safety', description: 'RF exposure', is_published: true },
      { id: 't-4', title: 'Operating', description: 'On the air', is_published: true },
    ];
  });

  describe('the ordered list', () => {
    it('numbers the topics in order with a count in the heading', () => {
      renderManager();

      expect(screen.getByRole('heading', { name: 'Topics in this Lesson (2)' })).toBeInTheDocument();
      const items = within(screen.getByRole('list', { name: 'Topics in order' })).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent(/1\.\s*Antennas/);
      expect(items[1]).toHaveTextContent(/2\.\s*Propagation/);
    });

    it('marks unpublished topics as drafts', () => {
      renderManager();
      const items = screen.getAllByRole('listitem');

      expect(within(items[0]).queryByText('Draft')).not.toBeInTheDocument();
      expect(within(items[1]).getByText('Draft')).toBeInTheDocument();
    });

    it('names the drag handle and remove button after the topic', () => {
      renderManager();

      expect(screen.getByRole('button', { name: 'Reorder Antennas' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Antennas from lesson' })).toBeInTheDocument();
    });

    it('shows an empty state with no topics', () => {
      renderManager([]);

      expect(screen.getByText('No topics added yet.')).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('removing', () => {
    it('removes by lesson-topic id and reports the outcome', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Remove Antennas from lesson' }));

      expect(mockRemove.mutate).toHaveBeenCalledWith('lt-1', expect.anything());
      const [, options] = mockRemove.mutate.mock.calls[0];
      options.onSuccess();
      expect(toast.success).toHaveBeenCalledWith('Topic removed from lesson');
    });
  });

  describe('reordering', () => {
    it('shows the new order at once and writes it', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'drop lt-1 on lt-2' }));

      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/1\.\s*Propagation/);
      expect(mockOrder.mutate).toHaveBeenCalledWith(
        [
          { id: 'lt-2', display_order: 0 },
          { id: 'lt-1', display_order: 1 },
        ],
        expect.anything()
      );
    });

    it('puts the old order back when the write fails', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'drop lt-1 on lt-2' }));
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/Propagation/);

      const [, options] = mockOrder.mutate.mock.calls[0];
      act(() => options.onError());

      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/1\.\s*Antennas/);
      expect(toast.error).toHaveBeenCalledWith('Failed to update order');
    });
  });

  describe('adding', () => {
    it('offers only topics not already in the lesson', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Add Topic' }));
      const dialog = await screen.findByRole('dialog', { name: 'Add Topic to Lesson' });

      const names = within(dialog).getAllByRole('button').map((b) => b.textContent);
      expect(names).toEqual(['SafetyRF exposure', 'OperatingOn the air']);
    });

    it('filters the offer by title or description', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Add Topic' }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByRole('searchbox', { name: 'Search topics' }), 'exposure');

      expect(within(dialog).getAllByRole('button')).toHaveLength(1);
      expect(within(dialog).getByRole('button', { name: /Safety/ })).toBeInTheDocument();
    });

    it('says when nothing matches, and when nothing is left', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Add Topic' }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByRole('searchbox', { name: 'Search topics' }), 'zzz');
      expect(within(dialog).getByText('No topics match "zzz"')).toBeInTheDocument();

      await user.clear(within(dialog).getByRole('searchbox', { name: 'Search topics' }));
      mockAdminTopics = mockAdminTopics.slice(0, 2);
      await user.type(within(dialog).getByRole('searchbox', { name: 'Search topics' }), ' ');
      await user.clear(within(dialog).getByRole('searchbox', { name: 'Search topics' }));
      expect(within(dialog).getByText('All topics have been added to this lesson.')).toBeInTheDocument();
    });

    it('adds at the end of the order and closes on success', async () => {
      const user = userEvent.setup();
      renderManager();

      await user.click(screen.getByRole('button', { name: 'Add Topic' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /Safety/ }));

      expect(mockAdd.mutate).toHaveBeenCalledWith(
        { lessonId: 'lesson-1', topicId: 't-3', displayOrder: 2 },
        expect.anything()
      );
    });
  });
});

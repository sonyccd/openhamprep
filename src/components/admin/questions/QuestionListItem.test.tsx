import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionListItem } from './QuestionListItem';
import type { Question } from './types';

// Mock the SyncStatusBadge component
vi.mock('../SyncStatusBadge', () => ({
  SyncStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="sync-status">{status}</span>
  ),
}));

const createMockQuestion = (overrides?: Partial<Question>): Question => ({
  id: 'test-uuid-123',
  display_name: 'T1A01',
  question: 'What is the purpose of the amateur radio service?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correct_answer: 0,
  links: [],
  explanation: 'Test explanation',
  edit_history: [],
  figure_url: null,
  forum_url: null,
  discourse_sync_status: null,
  discourse_sync_at: null,
  discourse_sync_error: null,
  linked_topic_ids: [],
  ...overrides,
});

describe('QuestionListItem', () => {
  const defaultProps = {
    question: createMockQuestion(),
    isHighlighted: false,
    feedbackStats: undefined,
    onEdit: vi.fn(),
    onRetrySync: vi.fn(),
  };

  it('renders question display name', () => {
    render(<QuestionListItem {...defaultProps} />);
    expect(screen.getByText('T1A01')).toBeInTheDocument();
  });

  it('renders question text', () => {
    render(<QuestionListItem {...defaultProps} />);
    expect(
      screen.getByText('What is the purpose of the amateur radio service?')
    ).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<QuestionListItem {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByRole('button');
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('applies highlight styles when isHighlighted is true', () => {
    const { container } = render(
      <QuestionListItem {...defaultProps} isHighlighted={true} />
    );
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('border-amber-500');
  });

  it('does not apply highlight styles when isHighlighted is false', () => {
    const { container } = render(
      <QuestionListItem {...defaultProps} isHighlighted={false} />
    );
    const item = container.firstChild as HTMLElement;
    expect(item.className).not.toContain('border-amber-500');
  });

  it('shows links badge when question has links', () => {
    const question = createMockQuestion({
      links: [
        {
          url: 'https://example.com',
          title: 'Example',
          description: 'Description',
          image: '',
          type: 'article',
          siteName: 'Example',
        },
      ],
    });
    render(<QuestionListItem {...defaultProps} question={question} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows topics badge when question has linked topics', () => {
    const question = createMockQuestion({
      linked_topic_ids: ['topic-1', 'topic-2'],
    });
    render(<QuestionListItem {...defaultProps} question={question} />);
    expect(screen.getByText('2 topics')).toBeInTheDocument();
  });

  it('shows singular topic text for one topic', () => {
    const question = createMockQuestion({
      linked_topic_ids: ['topic-1'],
    });
    render(<QuestionListItem {...defaultProps} question={question} />);
    expect(screen.getByText('1 topic')).toBeInTheDocument();
  });

  it('shows feedback stats when provided', () => {
    render(
      <QuestionListItem
        {...defaultProps}
        feedbackStats={{ helpful: 5, notHelpful: 2 }}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows sync status badge when forum_url is present', () => {
    const question = createMockQuestion({
      forum_url: 'https://forum.example.com/topic/123',
      discourse_sync_status: 'synced',
    });
    render(<QuestionListItem {...defaultProps} question={question} />);
    expect(screen.getByTestId('sync-status')).toBeInTheDocument();
  });

  it('does not show sync status badge when forum_url is null', () => {
    const question = createMockQuestion({
      forum_url: null,
    });
    render(<QuestionListItem {...defaultProps} question={question} />);
    expect(screen.queryByTestId('sync-status')).not.toBeInTheDocument();
  });
});

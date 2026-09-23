import { describe, it, expect } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { EditHistoryViewer } from './EditHistoryViewer';
import type { EditHistoryEntry } from './EditHistoryViewer';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

const entry = (over: Partial<EditHistoryEntry> = {}): EditHistoryEntry => ({
  user_id: 'u1',
  user_email: 'ke4abc@example.com',
  action: 'updated',
  changes: {},
  timestamp: '2026-03-02T15:04:00Z',
  ...over,
});

const open = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Edit History/ }));
  return user;
};

/** This component had no tests before the MUI port. */
describe('EditHistoryViewer', () => {
  it('says so when there is nothing recorded', () => {
    render(<EditHistoryViewer history={[]} />);

    expect(screen.getByText('No edit history recorded')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the changes, singular and plural', () => {
    const { unmount } = render(<EditHistoryViewer history={[entry()]} />);
    expect(screen.getByRole('button', { name: 'Edit History (1 change)' })).toBeInTheDocument();
    unmount();

    render(<EditHistoryViewer history={[entry(), entry()]} />);
    expect(screen.getByRole('button', { name: 'Edit History (2 changes)' })).toBeInTheDocument();
  });

  it('keeps the entries out of the tree until opened', async () => {
    render(<EditHistoryViewer history={[entry()]} />);

    expect(screen.queryByText('ke4abc@example.com')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Edit History/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await open();

    expect(screen.getByText('ke4abc@example.com')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the newest entry first whatever order it arrives in', async () => {
    render(
      <EditHistoryViewer
        history={[
          entry({ user_email: 'older@example.com', timestamp: '2026-03-01T10:00:00Z' }),
          entry({ user_email: 'newest@example.com', timestamp: '2026-03-05T10:00:00Z' }),
          entry({ user_email: 'middle@example.com', timestamp: '2026-03-03T10:00:00Z' }),
        ]}
      />
    );
    await open();

    const emails = screen.getAllByText(/@example\.com$/).map((n) => n.textContent);
    expect(emails).toEqual(['newest@example.com', 'middle@example.com', 'older@example.com']);
  });

  it('names the action and the time of each entry', async () => {
    render(<EditHistoryViewer history={[entry({ action: 'created' })]} />);
    await open();

    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText(/Mar 2, 2026/)).toBeInTheDocument();
  });

  describe('field changes', () => {
    const withChanges = (changes: EditHistoryEntry['changes']) =>
      render(<EditHistoryViewer history={[entry({ changes })]} />);

    it('shows each field from its old value to its new one', async () => {
      withChanges({ question: { from: 'Old text', to: 'New text' } });
      await open();

      expect(screen.getByText('question:')).toBeInTheDocument();
      expect(screen.getByText('Old text')).toBeInTheDocument();
      expect(screen.getByText('New text')).toBeInTheDocument();
    });

    it('reads an absent value as "(empty)" rather than blank', async () => {
      withChanges({ explanation: { from: null, to: 'Now explained' } });
      await open();

      expect(screen.getByText('(empty)')).toBeInTheDocument();
    });

    it('serialises an object value', async () => {
      withChanges({ options: { from: ['a'], to: ['a', 'b'] } });
      await open();

      expect(screen.getByText('["a","b"]')).toBeInTheDocument();
    });

    it('lists no changes for a created entry', async () => {
      render(<EditHistoryViewer history={[entry({ action: 'created', changes: { x: { from: 1, to: 2 } } })]} />);
      await open();

      expect(screen.queryByText('x:')).not.toBeInTheDocument();
    });
  });
});

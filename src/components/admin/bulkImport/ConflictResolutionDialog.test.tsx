import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { muiWrapper } from '@/test/utils/testWrappers';
import type { ConflictItem } from './importTypes';

interface Item {
  name: string;
}

const conflict = (name: string): ConflictItem<Item> => ({
  id: name,
  existing: { name: `${name} (old)` },
  incoming: { name: `${name} (new)` },
  resolution: 'keep',
});

const renderDialog = (conflicts: ConflictItem<Item>[], onResolve = vi.fn()) => {
  render(
    <ConflictResolutionDialog
      conflicts={conflicts}
      onResolve={onResolve}
      onCancel={vi.fn()}
      renderExisting={(i) => <span>{i.name}</span>}
      renderIncoming={(i) => <span>{i.name}</span>}
      renderMerged={(existing, incoming) => (
        <span>
          merged {existing.name} + {incoming.name}
        </span>
      )}
      getItemLabel={(i) => i.name.replace(' (new)', '')}
      itemType="question"
    />,
    { wrapper: muiWrapper }
  );
  return { onResolve };
};

describe('ConflictResolutionDialog', () => {
  it('counts how each conflict is currently set', async () => {
    const user = userEvent.setup();
    renderDialog([conflict('A'), conflict('B')]);

    expect(screen.getByText('2 Keep')).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Resolution for A' })).getByRole('radio', {
        name: 'Replace',
      })
    );

    expect(screen.getByText('1 Keep')).toBeInTheDocument();
    expect(screen.getByText('1 Replace')).toBeInTheDocument();
  });

  it('applies one choice to every conflict at once', async () => {
    const user = userEvent.setup();
    const { onResolve } = renderDialog([conflict('A'), conflict('B')]);

    await user.click(screen.getByRole('button', { name: 'Merge All' }));
    await user.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

    expect(onResolve).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'A', resolution: 'merge' }),
      expect.objectContaining({ id: 'B', resolution: 'merge' }),
    ]);
  });

  /**
   * The expand control used to be a clickable <div>: no keyboard could reach
   * it and nothing announced whether a row was open. It is a button now, and
   * carries aria-expanded.
   */
  it('expands each row from a real button that reports its state', async () => {
    const user = userEvent.setup();
    renderDialog([conflict('A')]);

    const toggle = screen.getByRole('button', { name: 'A' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('A (old)')).not.toBeInTheDocument();

    // Reachable by keyboard, which the old div was not.
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('A (old)')).toBeInTheDocument();
  });

  /** Only the first few open, so a long list is not a wall of panels. */
  it('starts with the first three rows expanded', () => {
    renderDialog(['A', 'B', 'C', 'D'].map(conflict));

    expect(screen.getByRole('button', { name: 'D' })).toHaveAttribute('aria-expanded', 'false');
    for (const name of ['A', 'B', 'C']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true');
    }
  });

  it('shows the merged result in place of the incoming one once merge is chosen', async () => {
    const user = userEvent.setup();
    renderDialog([conflict('A')]);

    expect(screen.getByText('A (new)')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Merge' }));

    expect(screen.getByText('merged A (old) + A (new)')).toBeInTheDocument();
    expect(screen.queryByText('A (new)')).not.toBeInTheDocument();
  });
});

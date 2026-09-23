import { describe, it, expect } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { AdminSectionTabs } from './AdminSectionTabs';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

const tabs = [
  { label: 'Lessons', panel: <div>lesson list</div> },
  { label: 'Topics', panel: <div>topic list</div> },
];

describe('AdminSectionTabs', () => {
  it('opens on the first tab with its panel labelled by it', () => {
    render(<AdminSectionTabs id="admin-learning" ariaLabel="Learning sections" tabs={tabs} />);

    const first = screen.getByRole('tab', { name: 'Lessons', selected: true });
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', first.id);
    expect(screen.getByText('lesson list')).toBeInTheDocument();
  });

  it('swaps the panel when another tab is picked', async () => {
    const user = userEvent.setup();
    render(<AdminSectionTabs id="admin-learning" ariaLabel="Learning sections" tabs={tabs} />);

    await user.click(screen.getByRole('tab', { name: 'Topics' }));

    expect(screen.getByText('topic list')).toBeInTheDocument();
    expect(screen.queryByText('lesson list')).not.toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', { name: 'Topics', selected: true }).id
    );
  });

  /** Two of these live on one page, so their ids must not collide. */
  it('keys its ids off the id it is given', () => {
    const { unmount } = render(<AdminSectionTabs id="admin-learning" ariaLabel="Learning sections" tabs={tabs} />);
    expect(screen.getByRole('tabpanel').id).toBe('admin-learning-panel-0');
    unmount();

    render(<AdminSectionTabs id="admin-alerts" ariaLabel="Alert sections" tabs={tabs} />);
    expect(screen.getByRole('tabpanel').id).toBe('admin-alerts-panel-0');
  });

  it('names the tablist for screen readers', () => {
    render(<AdminSectionTabs id="admin-alerts" ariaLabel="Alert sections" tabs={tabs} />);

    expect(screen.getByRole('tablist', { name: 'Alert sections' })).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { AdminSectionNav } from './AdminSectionNav';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

describe('AdminSectionNav', () => {
  it('marks exactly one section as current', () => {
    render(<AdminSectionNav value="glossary" onChange={vi.fn()} unacknowledgedCount={0} />);

    expect(screen.getByRole('button', { name: 'Glossary' })).toHaveAttribute('aria-pressed', 'true');
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
  });

  it('reports the section that was picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdminSectionNav value="exam" onChange={onChange} unacknowledgedCount={0} />);

    await user.click(screen.getByRole('button', { name: 'Chapters' }));

    expect(onChange).toHaveBeenCalledWith('chapters');
  });

  /** Clicking the current section would otherwise deselect it and blank the page. */
  it('ignores a click on the section already showing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdminSectionNav value="exam" onChange={onChange} unacknowledgedCount={0} />);

    await user.click(screen.getByRole('button', { name: 'Questions' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  describe('the unacknowledged count', () => {
    it('sits on Alerts and nowhere else', () => {
      render(<AdminSectionNav value="exam" onChange={vi.fn()} unacknowledgedCount={3} />);

      expect(within(screen.getByRole('button', { name: 'Alerts' })).getByText('3')).toBeInTheDocument();
      expect(screen.getAllByLabelText(/unacknowledged alerts/)).toHaveLength(1);
    });

    it('caps the display at 9+', () => {
      render(<AdminSectionNav value="exam" onChange={vi.fn()} unacknowledgedCount={12} />);

      expect(screen.getByText('9+')).toBeInTheDocument();
      expect(screen.getByLabelText('12 unacknowledged alerts')).toBeInTheDocument();
    });

    it('shows nothing at zero', () => {
      render(<AdminSectionNav value="exam" onChange={vi.fn()} unacknowledgedCount={0} />);

      expect(screen.queryByLabelText(/unacknowledged alerts/)).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceRow } from './ChoiceRow';
import { muiWrapper } from '@/test/utils/testWrappers';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

describe('ChoiceRow', () => {
  it('is a button named by its title and badge', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ChoiceRow badge="T1" title="Commission's Rules" onClick={onClick} index={0} />, {
      wrapper: muiWrapper,
    });

    const row = screen.getByRole('button', { name: /T1.*Commission's Rules/ });
    await user.click(row);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /** A <button> takes phrasing content only; the title must not render as <p>. */
  it('puts no flow content inside the button', () => {
    render(<ChoiceRow badge="3" title="Chapter Three" onClick={vi.fn()} index={0} />, {
      wrapper: muiWrapper,
    });

    const row = screen.getByRole('button');
    expect(row.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });

  it('keeps the chevron decorative', () => {
    render(<ChoiceRow badge="3" title="Chapter Three" onClick={vi.fn()} index={0} />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByRole('button').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

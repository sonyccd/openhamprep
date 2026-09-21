import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { muiWrapper } from '@/test/utils';
import { QuestionPickRow } from './QuestionPickRow';

const question = { display_name: 'T1A01', question: 'What is amateur radio?' };

/** Shared by the chapter and topic managers, so pinned on its own. */
describe('QuestionPickRow', () => {
  it('is one control named by the whole row, with a display-only checkbox', () => {
    render(<QuestionPickRow question={question} checked={false} onClick={vi.fn()} />, { wrapper: muiWrapper });

    const row = screen.getByRole('button', { name: 'T1A01 What is amateur radio?' });
    const checkbox = within(row).getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute('tabindex', '-1');
    expect(row.querySelector('button')).toBeNull();
  });

  it('fires once per click on the row and reflects checked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<QuestionPickRow question={question} checked onClick={onClick} />, { wrapper: muiWrapper });

    const row = screen.getByRole('button', { name: /T1A01/ });
    expect(within(row).getByRole('checkbox')).toBeChecked();
    await user.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is inert while disabled', () => {
    const onClick = vi.fn();
    render(<QuestionPickRow question={question} checked={false} onClick={onClick} disabled />, { wrapper: muiWrapper });

    const row = screen.getByRole('button', { name: /T1A01/ });
    // MUI takes the row out of pointer and tab reach; a synthetic click still must not fire.
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(getComputedStyle(row).pointerEvents).toBe('none');
    fireEvent.click(row);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows a badge beside the id', () => {
    render(<QuestionPickRow question={question} checked={false} onClick={vi.fn()} badge={<span>elsewhere</span>} />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByRole('button', { name: /T1A01 elsewhere/ })).toBeInTheDocument();
  });
});

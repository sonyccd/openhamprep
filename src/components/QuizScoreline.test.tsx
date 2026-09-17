import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizScoreline } from './QuizScoreline';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('QuizScoreline', () => {
  it('reads as a named group with each count labelled', () => {
    render(<QuizScoreline correct={3} incorrect={1} />, { wrapper: muiWrapper });

    const score = screen.getByRole('group', { name: 'Score' });
    expect(score).toHaveTextContent('3 correct');
    expect(score).toHaveTextContent('1 incorrect');
  });

  /**
   * The old markup was "3 / 1" in two colours. Sighted users read the colours;
   * everyone else got two numbers and a slash. The labels exist for the second
   * group and must not appear for the first.
   */
  it('keeps the labels out of sight but in the tree', () => {
    render(<QuizScoreline correct={3} incorrect={1} />, { wrapper: muiWrapper });

    const correct = screen.getByText('correct');
    expect(correct).toBeInTheDocument();
    // visuallyHidden clips to a 1px box off-flow rather than display:none,
    // which would remove it from what is read out.
    expect(correct).toHaveStyle({ position: 'absolute', width: '1px', height: '1px' });
  });

  it('hides the separator from assistive tech, as it carries no meaning', () => {
    render(<QuizScoreline correct={0} incorrect={0} />, { wrapper: muiWrapper });

    expect(screen.getByText('/')).toHaveAttribute('aria-hidden', 'true');
  });
});

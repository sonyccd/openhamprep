import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizProgress } from './QuizProgress';
import { muiWrapper } from '@/test/utils/testWrappers';

/**
 * Both modes had a div with an animated inner width — a progress bar with no
 * role, so nothing reported the value. These pin that it is now the real one.
 */
describe('QuizProgress', () => {
  it('is a named progressbar that reports its value', () => {
    render(<QuizProgress asked={3} total={12} />, { wrapper: muiWrapper });

    const bar = screen.getByRole('progressbar', { name: 'Questions answered' });
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 12');
  });

  it('reads zero, not NaN, before there are any questions', () => {
    render(<QuizProgress asked={0} total={0} />, { wrapper: muiWrapper });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('adds the count and the completion tick in the labelled form', () => {
    const { container, rerender } = render(
      <QuizProgress variant="labelled" asked={11} total={12} />,
      { wrapper: muiWrapper }
    );
    expect(container).toHaveTextContent('11/12');
    expect(container.querySelector('svg.lucide-circle-check-big')).toBeNull();

    rerender(<QuizProgress variant="labelled" asked={12} total={12} />);

    expect(container.querySelector('svg.lucide-circle-check-big')).not.toBeNull();
  });

  /** The tick is decoration; the value already says 100. */
  it('keeps the completion tick out of the accessibility tree', () => {
    const { container } = render(<QuizProgress variant="labelled" asked={2} total={2} />, {
      wrapper: muiWrapper,
    });

    expect(container.querySelector('svg.lucide-circle-check-big')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});

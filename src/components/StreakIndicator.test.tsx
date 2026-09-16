import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakIndicator } from './StreakIndicator';
import { muiWrapper } from '@/test/utils/testWrappers';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

describe('StreakIndicator', () => {
  it('renders nothing until a streak starts', () => {
    render(<StreakIndicator streak={0} celebrating={false} />, { wrapper: muiWrapper });

    expect(screen.queryByText('streak')).not.toBeInTheDocument();
  });

  /** A bare number beside an icon is just a number to a screen reader. */
  it('labels the count once there is one', () => {
    const { container } = render(<StreakIndicator streak={7} celebrating={false} />, {
      wrapper: muiWrapper,
    });

    expect(container).toHaveTextContent('7 streak');
  });

  it('shows the trophy burst only while celebrating, and hides it from AT', () => {
    const { container, rerender } = render(
      <StreakIndicator streak={5} celebrating={false} />,
      { wrapper: muiWrapper }
    );
    expect(container.querySelector('[aria-hidden="true"] svg.lucide-trophy')).toBeNull();

    rerender(<StreakIndicator streak={5} celebrating />);

    expect(container.querySelector('[aria-hidden="true"] svg.lucide-trophy')).not.toBeNull();
  });
});

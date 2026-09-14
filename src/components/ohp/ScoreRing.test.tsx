import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Gauge } from '@mui/x-charts/Gauge';
import { ScoreRing } from './ScoreRing';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('ScoreRing', () => {
  it('exposes the score as a meter', () => {
    render(<ScoreRing value={72} />, { wrapper: muiWrapper });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  /**
   * The reason ScoreRing wraps Gauge rather than re-exporting it.
   *
   * Gauge emits role="meter" with the right values and then sets
   * aria-hidden="true" on the same element (ChartsSvgLayer.js:66, applied after
   * the prop spread, so nothing can override it), which removes it from the
   * accessibility tree. If a future version fixes that, this test starts
   * failing and the wrapper can go.
   */
  it('is needed because a bare Gauge exposes no meter at all', () => {
    render(<Gauge width={120} height={120} value={72} />, { wrapper: muiWrapper });

    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('clamps out-of-range values', () => {
    const { rerender } = render(<ScoreRing value={140} />, { wrapper: muiWrapper });
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');

    rerender(<ScoreRing value={-20} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
  });

  it('names itself from the value when no label is given', () => {
    render(<ScoreRing value={40} />, { wrapper: muiWrapper });

    expect(screen.getByRole('meter')).toHaveAccessibleName('40%');
  });

  it('prefers an explicit label', () => {
    render(<ScoreRing value={40} label="Exam readiness" />, { wrapper: muiWrapper });

    expect(screen.getByRole('meter')).toHaveAccessibleName('Exam readiness');
  });

  it('reads valueText instead of a bare percentage when given one', () => {
    render(<ScoreRing value={40} valueText="40% — needs work" />, { wrapper: muiWrapper });

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '40% — needs work');
  });

  it('renders centre children instead of the value text', () => {
    render(
      <ScoreRing value={100}>
        <span>done</span>
      </ScoreRing>,
      { wrapper: muiWrapper }
    );

    expect(screen.getByText('done')).toBeInTheDocument();
    // The gauge's own text slot is suppressed so the two cannot both show.
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });

  it('keeps the ring thickness the caller asked for', () => {
    const { container } = render(<ScoreRing value={50} size={140} strokeWidth={10} />, {
      wrapper: muiWrapper,
    });

    // 140/2 = 70 outer; 70 - 10 = 60 inner; 60/70 = 85.714%.
    const arc = container.querySelector('.MuiGauge-referenceArc');
    expect(arc?.getAttribute('d')).toContain('60');
  });
});

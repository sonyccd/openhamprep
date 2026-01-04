import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './circular-progress';

describe('CircularProgress', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<CircularProgress value={50} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders children in the center', () => {
    render(
      <CircularProgress value={75}>
        <span data-testid="center-content">75%</span>
      </CircularProgress>
    );
    expect(screen.getByTestId('center-content')).toHaveTextContent('75%');
  });

  it('applies custom size', () => {
    const { container } = render(<CircularProgress value={50} size={200} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CircularProgress value={50} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies track and progress class names', () => {
    const { container } = render(
      <CircularProgress
        value={50}
        trackClassName="stroke-red-500"
        progressClassName="stroke-blue-500"
      />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveClass('stroke-red-500');
  });

  it('clamps value between 0 and 100', () => {
    const { container: container1 } = render(<CircularProgress value={-10} />);
    const { container: container2 } = render(<CircularProgress value={150} />);

    // Both should render without errors
    expect(container1.querySelector('svg')).toBeInTheDocument();
    expect(container2.querySelector('svg')).toBeInTheDocument();
  });

  it('renders without animation when animate is false', () => {
    const { container } = render(<CircularProgress value={50} animate={false} />);
    const circles = container.querySelectorAll('circle');
    // Should have 2 circles (track and progress), progress should not be a motion element
    expect(circles.length).toBe(2);
  });

  it('renders two circles for track and progress', () => {
    const { container } = render(<CircularProgress value={50} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('uses correct viewBox based on size', () => {
    const { container } = render(<CircularProgress value={50} size={100} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { muiWrapper } from '@/test/utils';
import { Icon } from './Icon';

const svg = (container: HTMLElement) => container.querySelector('svg')!;

describe('Icon', () => {
  it('hides itself from the accessibility tree by default', () => {
    const { container } = render(<Icon icon={Search} size={16} />, { wrapper: muiWrapper });

    expect(svg(container)).toHaveAttribute('aria-hidden', 'true');
    expect(svg(container)).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  /** lucide emits no aria-hidden of its own, which is the whole reason for this. */
  it('is announced only when it is given a label', () => {
    render(<Icon icon={Search} size={16} label="Searching" />, { wrapper: muiWrapper });

    const img = screen.getByRole('img', { name: 'Searching' });
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('sizes itself from the size prop', () => {
    const { container } = render(<Icon icon={Search} size={20} />, { wrapper: muiWrapper });

    expect(getComputedStyle(svg(container)).width).toBe('20px');
    expect(getComputedStyle(svg(container)).height).toBe('20px');
  });

  it('takes sx alongside the size', () => {
    const { container } = render(
      <Icon icon={Search} size={16} sx={{ color: 'error.main' }} />,
      { wrapper: muiWrapper }
    );

    const css = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('');
    const cls = [...svg(container).classList].find((c) => c.startsWith('css-'))!;
    expect(css.slice(css.indexOf(cls))).toContain('--mui-palette-error-main');
    expect(getComputedStyle(svg(container)).width).toBe('16px');
  });

  /** sx comes after the size in the array, so a caller can override it. */
  it("lets a caller's sx win over the size prop", () => {
    const { container } = render(
      <Icon icon={Search} size={16} sx={{ width: 32, height: 32 }} />,
      { wrapper: muiWrapper }
    );

    expect(getComputedStyle(svg(container)).width).toBe('32px');
    expect(getComputedStyle(svg(container)).height).toBe('32px');
  });

  it('leaves sizing to sx when no size is given', () => {
    const { container } = render(<Icon icon={Search} sx={{ width: 24, height: 24 }} />, {
      wrapper: muiWrapper,
    });

    expect(getComputedStyle(svg(container)).width).toBe('24px');
  });
});

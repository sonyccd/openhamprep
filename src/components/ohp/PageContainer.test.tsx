import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from './PageContainer';
import { muiWrapper } from '@/test/utils';

/**
 * These were 19 Tailwind class assertions (`toHaveClass('max-w-3xl')` and so
 * on). A2c's rule is to drop class assertions, and its rule 4 deleted purely
 * presentational tests — but this is the case where that would be wrong. The
 * width tiers *are* this component's behaviour, nothing else in the app asserts
 * them, and 17 screens depend on them.
 *
 * So they became computed-style assertions. That matters for more than
 * tidiness: the obvious port maps the tiers onto Container's `maxWidth="sm|md|
 * lg|xl"` names, which resolve through the breakpoint table. A class assertion
 * cannot tell that 672px silently became 640px; these can.
 *
 * Reading computed styles works here because emotion injects real CSS and
 * happy-dom resolves it — the same approach used for the Glossary card border
 * in #286.
 */
const content = () => screen.getByTestId('content').parentElement!;
const outer = () => content().parentElement!;

/**
 * The CSS emotion emitted for an element.
 *
 * Responsive values cannot be read with getComputedStyle here: happy-dom does
 * not evaluate calc(), and with no real viewport it applies whichever media
 * query came last rather than the one that matches. Reading the rule text
 * instead checks both the value and the breakpoint it sits behind, which the
 * class assertions never did.
 */
const cssFor = (el: Element) => {
  const sheets = Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
  const classes = el.className.split(' ').filter((c) => c.startsWith('css-'));
  return sheets
    .split('}')
    .filter((rule) => classes.some((c) => rule.includes(`.${c}`)))
    .join('}');
};

const renderContainer = (props: Partial<React.ComponentProps<typeof PageContainer>> = {}) =>
  render(
    <PageContainer {...props}>
      <span data-testid="content">Page content</span>
    </PageContainer>,
    { wrapper: muiWrapper }
  );

describe('PageContainer', () => {
  it('renders children', () => {
    renderContainer();

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  // The whole point of the component. Values are the pixel widths the
  // max-w-2xl/3xl/5xl/7xl classes resolved to, so a tier drifting by even a
  // few pixels fails here.
  describe('width tiers', () => {
    it.each([
      ['narrow', '672px'],
      ['standard', '768px'],
      ['wide', '1024px'],
      ['full', '1280px'],
    ] as const)('%s is %s wide', (width, expected) => {
      renderContainer({ width });

      expect(getComputedStyle(content()).maxWidth).toBe(expected);
    });

    it('defaults to standard', () => {
      renderContainer();

      expect(getComputedStyle(content()).maxWidth).toBe('768px');
    });

    it('centres the content', () => {
      renderContainer();

      const style = getComputedStyle(content());
      expect(style.marginLeft).toBe('auto');
      expect(style.marginRight).toBe('auto');
    });
  });

  describe('padding', () => {
    it('pads the page as py-8 px-4, widening at md', () => {
      renderContainer();

      const css = cssFor(outer());
      // Spacing is a CSS variable because cssVariables is on; the unit is 8px,
      // so 4 -> 32px (py-8) and 2 -> 16px (px-4).
      expect(css).toContain('padding-top:calc(4 * var(--mui-spacing))');
      expect(css).toContain('padding-left:calc(2 * var(--mui-spacing))');
      // md is 768px because #285 pinned the breakpoints to Tailwind's.
      expect(css).toMatch(/min-width:768px[^}]*padding-top:calc\(6 \* var\(--mui-spacing\)\)/s);
    });

    it('leaves room for the mobile nav when asked', () => {
      renderContainer({ mobileNavPadding: true });

      // pb-24 below md so bottom action buttons clear the nav bar, pb-8 above.
      const css = cssFor(outer());
      expect(css).toContain('padding-bottom:calc(12 * var(--mui-spacing))');
      expect(css).toMatch(/min-width:768px[^}]*padding-bottom:calc\(4 \* var\(--mui-spacing\)\)/s);
    });

    it('does not add that room by default', () => {
      renderContainer();

      expect(cssFor(outer())).not.toContain('calc(12 * var(--mui-spacing))');
    });
  });

  describe('radioWaveBg', () => {
    // Still a class assertion, deliberately: radio-wave-bg is a CSS class in
    // index.css rather than anything MUI models, so the class is the contract
    // until C7 removes the stylesheet.
    it('applies the effect when asked', () => {
      renderContainer({ radioWaveBg: true });

      expect(outer()).toHaveClass('radio-wave-bg');
    });

    it('is off by default', () => {
      renderContainer();

      expect(outer()).not.toHaveClass('radio-wave-bg');
    });
  });

  describe('escape hatches', () => {
    it('passes className through to the outer element', () => {
      renderContainer({ className: 'custom-outer' });

      expect(outer()).toHaveClass('custom-outer');
    });

    it('keeps the radio-wave class alongside a custom one', () => {
      renderContainer({ radioWaveBg: true, className: 'custom-outer' });

      expect(outer()).toHaveClass('radio-wave-bg');
      expect(outer()).toHaveClass('custom-outer');
    });

    it('passes contentClassName through to the inner element', () => {
      renderContainer({ contentClassName: 'custom-inner' });

      expect(content()).toHaveClass('custom-inner');
    });

    it('keeps the width tier when contentClassName is given', () => {
      renderContainer({ width: 'wide', contentClassName: 'custom-inner' });

      expect(getComputedStyle(content()).maxWidth).toBe('1024px');
    });

    it('merges a caller sx rather than replacing the defaults', () => {
      renderContainer({ sx: { backgroundColor: 'rgb(1, 2, 3)' } });

      const css = cssFor(outer());
      expect(css).toContain('background-color:rgb(1, 2, 3)');
      // The defaults survive the merge.
      expect(css).toContain('padding-top:calc(4 * var(--mui-spacing))');
    });
  });

  it('combines width, padding and effect together', () => {
    renderContainer({ width: 'full', mobileNavPadding: true, radioWaveBg: true });

    expect(getComputedStyle(content()).maxWidth).toBe('1280px');
    expect(cssFor(outer())).toContain('padding-bottom:calc(12 * var(--mui-spacing))');
    expect(outer()).toHaveClass('radio-wave-bg');
  });
});

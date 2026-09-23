import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { muiWrapper } from '@/test/utils';
import { muiTheme } from '@/theme/muiTheme';
import { SkipLink } from './SkipLink';

/** The emitted rules are the behaviour here: it must be clipped until focus. */
const rulesFor = (el: HTMLElement) => {
  const cls = [...el.classList].find((c) => c.startsWith('css-'));
  if (!cls) throw new Error(`no emotion class on the skip link: ${el.className}`);
  return Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .map((rule) => rule.cssText.replace(/\s+/g, ' '))
    .filter((text) => text.includes(cls));
};

describe('SkipLink', () => {
  it('points at the main content and stays in the tab order', () => {
    render(<SkipLink />, { wrapper: muiWrapper });
    const link = screen.getByRole('link', { name: 'Skip to main content' });

    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).not.toHaveAttribute('tabindex', '-1');
    expect(link).not.toHaveAttribute('hidden');
  });

  it('is clipped out of sight until it is focused', () => {
    render(<SkipLink />, { wrapper: muiWrapper });
    const css = rulesFor(screen.getByRole('link')).join('\n');

    // Clipped, but not display:none — that would take it out of the tab order.
    expect(css).toMatch(/clip: rect\(0px, 0px, 0px, 0px\)|clip-path: inset\(50%\)/);
    expect(css).not.toMatch(/display: none/);
  });

  it('becomes a real, placed box on focus', () => {
    render(<SkipLink />, { wrapper: muiWrapper });
    const focusRule = rulesFor(screen.getByRole('link')).find((r) => r.includes(':focus'));

    expect(focusRule).toBeDefined();
    expect(focusRule).toMatch(/height: auto/);
    expect(focusRule).toMatch(/width: auto/);
    expect(focusRule).toMatch(/clip: auto/);
  });

  /**
   * zIndex.tooltip puts it above the app bar and drawer when it appears. It
   * cannot collide with an open dialog: MUI aria-hidden's the rest of the
   * page and traps focus, so the link is not reachable while one is open.
   */
  it('sits above the page chrome when shown', () => {
    render(<SkipLink />, { wrapper: muiWrapper });
    const focusRule = rulesFor(screen.getByRole('link')).find((r) => r.includes(':focus'))!;

    const z = Number(focusRule.match(/z-index: (\d+)/)?.[1]);
    expect(z).toBeGreaterThan(muiTheme.zIndex.drawer);
  });

  it('takes focus when tabbed to', async () => {
    render(<SkipLink />, { wrapper: muiWrapper });
    const link = screen.getByRole('link');

    link.focus();

    expect(link).toHaveFocus();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { muiWrapper } from '@/test/utils';
import { LinkTypeChip } from './LinkTypeChip';
import type { LinkType } from '@/lib/resourceTypes';

/** The tint is a color-mix(), which happy-dom drops from computed style and the CSSOM. */
const styleOf = (el: Element) => {
  const cls = [...el.classList].find((c) => c.startsWith('css-'));
  if (!cls) throw new Error(`no emotion class on the chip: ${el.className}`);
  const raw = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('');
  const block = raw.slice(raw.indexOf(cls));
  return block.slice(0, block.indexOf('}'));
};

/**
 * The background specifically — the block also carries `color`, so matching
 * the whole thing would pass even with every chip's tint removed.
 */
const chipBackground = (type: LinkType) => {
  cleanup();
  render(<LinkTypeChip type={type} />, { wrapper: muiWrapper });
  const css = styleOf(screen.getByText(type).closest('.MuiChip-root')!);
  const backgrounds = [...css.matchAll(/background-color:[^;]+/g)].map((m) => m[0]);
  return backgrounds[backgrounds.length - 1] ?? '';
};

describe('LinkTypeChip', () => {
  it('labels itself with the link type', () => {
    render(<LinkTypeChip type="video" />, { wrapper: muiWrapper });

    expect(screen.getByText('video')).toBeInTheDocument();
  });

  it('tints each type with its own colour', () => {
    expect(chipBackground('video')).toContain('--mui-palette-error-main');
    expect(chipBackground('article')).toContain('--mui-palette-info-main');
  });

  /** website has no tint of its own; it reads as the neutral chip. */
  it('leaves website neutral', () => {
    const background = chipBackground('website');

    expect(background).toContain('--mui-palette-secondary-main');
    expect(background).not.toContain('color-mix');
  });
});

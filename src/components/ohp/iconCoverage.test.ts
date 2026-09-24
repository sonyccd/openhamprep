import { describe, it, expect } from 'vitest';

/**
 * The invariant #312 is about: no icon reaches the DOM without being hidden.
 *
 * The eslint rule enforces this too, but a rule is only as good as its
 * selector — the first version keyed off `value.expression.name`, which exists
 * only on a bare identifier, so `component={icon}`, `component={x.icon}` and
 * `component={cond ? A : B}` all slipped past it, as did the audit that shared
 * the assumption. This reads the source text instead, so the two cannot be
 * blind in the same way.
 *
 * Vite's own glob rather than node:fs — globSync there needs Node 22, and CI
 * runs 20 as well.
 */
const sources = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** The polymorphic targets a Box may legitimately take. */
const NON_ICON = /^(Link|RouterLink|MotionBox)$/;

describe('icon coverage', () => {
  it('finds the source files to check', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
  });

  it('renders no icon through a bare Box', () => {
    const offenders: string[] = [];

    for (const [path, text] of Object.entries(sources)) {
      if (path.includes('.test.') || path.endsWith('/ohp/Icon.tsx')) continue;
      // Scan from each <Box to its component=, rather than stopping at the
      // first ">": an earlier attribute can contain one, as sx={(t) => ({})}
      // does, and [^>]*? would then never reach the component that follows.
      for (const match of text.matchAll(/<Box\b[\s\S]{0,400}?component=\{([^}]*)\}/g)) {
        const expression = match[1].trim();
        if (NON_ICON.test(expression)) continue;
        offenders.push(`${path}: component={${expression}}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

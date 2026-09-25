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
const sources = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** The polymorphic targets any MUI component may legitimately take. */
const NON_ICON = /^(Link|RouterLink|MotionBox)$/;

/**
 * Each capitalised element's opening tag, as `[name, attributes]`.
 *
 * Walks to the `>` that actually closes the tag, tracking brace depth and
 * strings. An earlier attempt stopped at the first `>`, which an attribute can
 * contain (`sx={(t) => ({})}`); the one after it scanned a fixed 400-character
 * window, which a long `sx` callback can exceed. Both failed silently, which
 * for this check is the worst way to fail.
 */
function* openingTags(text: string): Generator<[string, string]> {
  for (const match of text.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
    const from = match.index + match[0].length;
    let depth = 0;
    let quote: string | null = null;

    for (let i = from; i < text.length; i++) {
      const char = text[i];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      } else if (char === '>' && depth === 0) {
        yield [match[1], text.slice(from, i)];
        break;
      }
    }
  }
}

describe('icon coverage', () => {
  it('finds the source files to check', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
  });

  it('parses attributes past a sx callback and past a long one', () => {
    const long = 'x'.repeat(500);
    const tags = [
      ...openingTags(`<Box sx={(t) => ({ c: t.a })} component={icon} />`),
      ...openingTags(`<Box sx={{ a: "${long}" }} component={icon} />`),
    ];

    expect(tags).toHaveLength(2);
    for (const [, attrs] of tags) expect(attrs).toContain('component={icon}');
  });

  it('renders no icon through a component prop', () => {
    const offenders: string[] = [];

    for (const [path, text] of Object.entries(sources)) {
      if (path.includes('.test.') || path.endsWith('/ohp/Icon.tsx')) continue;
      for (const [element, attrs] of openingTags(text)) {
        const match = attrs.match(/component=\{([\s\S]*?)\}(?=\s|$)/);
        if (!match) continue;
        const expression = match[1].trim();
        if (NON_ICON.test(expression)) continue;
        offenders.push(`${path}: <${element} component={${expression}}>`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

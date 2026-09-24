import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The invariant #312 is about: no icon reaches the DOM without being hidden.
 *
 * The eslint rule enforces this too, but a rule is only as good as its
 * selector — the first version keyed off a bare identifier and was blind to
 * component={icon}, component={x.icon} and component={cond ? A : B}, as was
 * the audit that shared the assumption. This checks the text instead, so the
 * two cannot be wrong in the same way.
 */
const NON_ICON = /^(Link|RouterLink|MotionBox)$/;

const sources = globSync('src/**/*.tsx', { cwd: process.cwd() }).filter(
  (f) => !f.includes('.test.') && !f.endsWith('ohp/Icon.tsx')
);

describe('icon coverage', () => {
  it('finds source files to check', () => {
    expect(sources.length).toBeGreaterThan(100);
  });

  it('renders no icon through a bare Box', () => {
    const offenders: string[] = [];

    for (const file of sources) {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      for (const match of text.matchAll(/<Box\b[^>]*?component=\{([^}]*)\}/gs)) {
        const expression = match[1].trim();
        if (NON_ICON.test(expression)) continue;
        offenders.push(`${file}: component={${expression}}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

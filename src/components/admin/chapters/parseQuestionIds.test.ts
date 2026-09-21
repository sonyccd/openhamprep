import { describe, it, expect } from 'vitest';
import { parseQuestionIds } from './parseQuestionIds';

describe('parseQuestionIds', () => {
  it('splits on commas, trims, upper-cases and drops blanks', () => {
    expect(parseQuestionIds(' t1a01, T1A02 ,, ,t1b03 ')).toEqual(['T1A01', 'T1A02', 'T1B03']);
  });

  it('is empty for whitespace and stray commas', () => {
    expect(parseQuestionIds('  , , ')).toEqual([]);
  });
});

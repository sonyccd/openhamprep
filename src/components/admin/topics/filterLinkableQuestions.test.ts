import { describe, it, expect } from 'vitest';
import { matchesSearch, matchesTestType } from './filterLinkableQuestions';

const q = { display_name: 'T1A01', question: 'What is amateur radio?' };

describe('matchesSearch', () => {
  it('matches one term against the id or the text, ignoring case', () => {
    expect(matchesSearch(q, 't1a')).toBe(true);
    expect(matchesSearch(q, 'AMATEUR')).toBe(true);
    expect(matchesSearch(q, 'general')).toBe(false);
  });

  it('matches everything on an empty search', () => {
    expect(matchesSearch(q, '')).toBe(true);
  });

  it('treats a comma as a list of ids and stops looking at the text', () => {
    expect(matchesSearch(q, 'G1B01, t1a01')).toBe(true);
    expect(matchesSearch(q, 'amateur, radio')).toBe(false);
  });

  it('ignores blank entries in the list', () => {
    expect(matchesSearch(q, ' , ,T1A')).toBe(true);
    expect(matchesSearch(q, ' , ')).toBe(false);
  });
});

describe('matchesTestType', () => {
  it('keys off the first letter of the id', () => {
    expect(matchesTestType(q, 'technician')).toBe(true);
    expect(matchesTestType(q, 'general')).toBe(false);
    expect(matchesTestType({ display_name: 'E2A01' }, 'extra')).toBe(true);
  });

  it('passes everything for "all"', () => {
    expect(matchesTestType({ display_name: 'G1B01' }, 'all')).toBe(true);
  });
});

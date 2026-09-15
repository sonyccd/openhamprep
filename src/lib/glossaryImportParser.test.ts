import { describe, it, expect } from 'vitest';
import {
  mergeTerm,
  parseCSV,
  parseCSVLine,
  parseJSON,
  validateTerms,
} from './glossaryImportParser';

describe('parseCSVLine', () => {
  it('keeps commas that sit inside quotes', () => {
    expect(parseCSVLine('Frequency,"cycles per second, in Hertz"')).toEqual([
      'Frequency',
      'cycles per second, in Hertz',
    ]);
  });
});

describe('parseCSV', () => {
  it('reads columns by header name, in any order', () => {
    expect(parseCSV('definition,term\n"A radiator",Antenna')).toEqual([
      { term: 'Antenna', definition: 'A radiator' },
    ]);
  });

  it('returns nothing for a header with no rows', () => {
    expect(parseCSV('term,definition')).toEqual([]);
  });

  it('skips lines with too few fields to be a record', () => {
    expect(parseCSV('term,definition\nAntenna,"A radiator"\nDipole')).toHaveLength(1);
  });
});

describe('parseJSON', () => {
  it('accepts a bare array, and the terms/glossary wrappers', () => {
    const one = [{ term: 'Antenna', definition: 'A radiator' }];
    expect(parseJSON(JSON.stringify(one))).toEqual(one);
    expect(parseJSON(JSON.stringify({ terms: one }))).toEqual(one);
    expect(parseJSON(JSON.stringify({ glossary: one }))).toEqual(one);
  });

  it('yields nothing rather than throwing on malformed JSON', () => {
    expect(parseJSON('{ not json')).toEqual([]);
  });
});

describe('validateTerms', () => {
  it('numbers error rows from the file, counting the header as row 1', () => {
    const { valid, errors } = validateTerms([
      { term: 'Antenna', definition: 'A radiator' },
      { term: 'Dipole', definition: '  ' },
    ]);

    expect(valid).toEqual([{ term: 'Antenna', definition: 'A radiator' }]);
    expect(errors).toEqual([{ row: 3, term: 'Dipole', errors: ['Missing definition'] }]);
  });

  it('reports both missing fields at once', () => {
    const { errors } = validateTerms([{ term: '', definition: '' }]);

    expect(errors[0].errors).toEqual(['Missing term', 'Missing definition']);
  });

  it('trims what it accepts', () => {
    const { valid } = validateTerms([{ term: '  Antenna  ', definition: '  A radiator  ' }]);

    expect(valid).toEqual([{ term: 'Antenna', definition: 'A radiator' }]);
  });
});

describe('mergeTerm', () => {
  it('takes the incoming spelling but keeps a curated definition', () => {
    expect(
      mergeTerm(
        { id: 'g1', term: 'antenna', definition: 'The curated wording' },
        { term: 'Antenna', definition: 'From the upload' }
      )
    ).toEqual({ id: 'g1', term: 'Antenna', definition: 'The curated wording' });
  });

  it('fills an empty definition from the upload', () => {
    expect(
      mergeTerm(
        { id: 'g1', term: 'Antenna', definition: '' },
        { term: 'Antenna', definition: 'From the upload' }
      ).definition
    ).toBe('From the upload');
  });
});

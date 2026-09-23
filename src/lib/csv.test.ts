import { describe, it, expect } from 'vitest';
import { escapeCSVField } from './csv';

describe('escapeCSVField', () => {
  it('leaves a plain field alone', () => {
    expect(escapeCSVField('QSO')).toBe('QSO');
  });

  it('quotes a field containing a comma, a newline or a quote', () => {
    expect(escapeCSVField('a,b')).toBe('"a,b"');
    expect(escapeCSVField('a\nb')).toBe('"a\nb"');
    expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
  });

  it('is empty for null and undefined', () => {
    expect(escapeCSVField(null)).toBe('');
    expect(escapeCSVField(undefined)).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { MAX_IMPORT_FILE_SIZE, rejectImportFile } from './importFileChecks';

const file = (name: string, type: string, size = 10) => {
  const f = new File(['x'.repeat(size)], name, { type });
  return f;
};

describe('rejectImportFile', () => {
  it('accepts each supported format', () => {
    expect(rejectImportFile(file('pool.csv', 'text/csv'))).toBeNull();
    expect(rejectImportFile(file('pool.json', 'application/json'))).toBeNull();
    expect(
      rejectImportFile(
        file(
          'pool.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      )
    ).toBeNull();
  });

  /** Some systems hand back text/plain for a CSV, which must still pass. */
  it('accepts a CSV reported as text/plain', () => {
    expect(rejectImportFile(file('pool.csv', 'text/plain'))).toBeNull();
  });

  /** Others report no type at all; the extension has to carry it. */
  it('accepts a known extension with no MIME type', () => {
    expect(rejectImportFile(file('pool.csv', ''))).toBeNull();
  });

  it('rejects an unsupported extension', () => {
    expect(rejectImportFile(file('pool.xlsx', 'text/csv'))).toMatch(/Invalid file extension/);
  });

  it('rejects a MIME type that contradicts the extension', () => {
    expect(rejectImportFile(file('pool.csv', 'image/png'))).toMatch(/Invalid file type/);
  });

  it('rejects a file over the size cap', () => {
    expect(rejectImportFile(file('pool.csv', 'text/csv', MAX_IMPORT_FILE_SIZE + 1))).toMatch(
      /Maximum size is 10MB/
    );
  });

  /** Extensions are matched case-insensitively — uploads arrive as .CSV too. */
  it('accepts an uppercase extension', () => {
    expect(rejectImportFile(file('POOL.CSV', 'text/csv'))).toBeNull();
  });
});

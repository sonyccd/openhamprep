import { describe, it, expect } from 'vitest';
import {
  MAX_IMPORT_FILE_SIZE,
  rejectImportFile,
  type ImportExtension,
} from './importFileChecks';

const file = (name: string, type: string, size = 10) => {
  const f = new File(['x'.repeat(size)], name, { type });
  return f;
};

const ALL: ImportExtension[] = ['.csv', '.json', '.docx'];
const TEXT_ONLY: ImportExtension[] = ['.csv', '.json'];

const DOCX_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('rejectImportFile', () => {
  it('accepts each format the caller asked for', () => {
    expect(rejectImportFile(file('pool.csv', 'text/csv'), ALL)).toBeNull();
    expect(rejectImportFile(file('pool.json', 'application/json'), ALL)).toBeNull();
    expect(rejectImportFile(file('pool.docx', DOCX_TYPE), ALL)).toBeNull();
  });

  /** Some systems hand back text/plain for a CSV, which must still pass. */
  it('accepts a CSV reported as text/plain', () => {
    expect(rejectImportFile(file('pool.csv', 'text/plain'), ALL)).toBeNull();
  });

  /** Others report no type at all; the extension has to carry it. */
  it('accepts a known extension with no MIME type', () => {
    expect(rejectImportFile(file('pool.csv', ''), ALL)).toBeNull();
  });

  it('rejects an unsupported extension', () => {
    expect(rejectImportFile(file('pool.xlsx', 'text/csv'), ALL)).toMatch(
      /Invalid file extension/
    );
  });

  it('rejects a MIME type that contradicts the extension', () => {
    expect(rejectImportFile(file('pool.csv', 'image/png'), ALL)).toMatch(/Invalid file type/);
  });

  it('rejects a file over the size cap', () => {
    expect(rejectImportFile(file('pool.csv', 'text/csv', MAX_IMPORT_FILE_SIZE + 1), ALL)).toMatch(
      /Maximum size is 10MB/
    );
  });

  /** Extensions are matched case-insensitively — uploads arrive as .CSV too. */
  it('accepts an uppercase extension', () => {
    expect(rejectImportFile(file('POOL.CSV', 'text/csv'), ALL)).toBeNull();
  });

  /**
   * The glossary importer has no DOCX parser. A shared check that accepted one
   * for every caller would hand a Word document to the CSV parser.
   */
  describe('per-importer formats', () => {
    it('turns away a format this caller cannot parse', () => {
      expect(rejectImportFile(file('pool.docx', DOCX_TYPE), TEXT_ONLY)).toMatch(
        /Invalid file extension/
      );
    });

    it('rejects the DOCX MIME type when only text formats are offered', () => {
      expect(rejectImportFile(file('terms.csv', DOCX_TYPE), TEXT_ONLY)).toMatch(
        /Invalid file type/
      );
    });

    it('names only the formats the caller accepts', () => {
      expect(rejectImportFile(file('pool.xlsx', 'text/csv'), ALL)).toBe(
        'Invalid file extension. Please upload a .csv, .json, or .docx file'
      );
      expect(rejectImportFile(file('terms.xlsx', 'text/csv'), TEXT_ONLY)).toBe(
        'Invalid file extension. Please upload a .csv or .json file'
      );
      expect(rejectImportFile(file('pool.csv', 'image/png'), ALL)).toBe(
        'Invalid file type detected. Please upload a valid CSV, JSON, or DOCX file'
      );
      expect(rejectImportFile(file('terms.csv', 'image/png'), TEXT_ONLY)).toBe(
        'Invalid file type detected. Please upload a valid CSV or JSON file'
      );
    });
  });
});

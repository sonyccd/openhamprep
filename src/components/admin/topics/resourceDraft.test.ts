import { describe, it, expect } from 'vitest';
import {
  MAX_RESOURCE_FILE_SIZE,
  formatFileSize,
  rejectResourceFile,
  titleFromFileName,
} from './resourceDraft';

const file = (name: string, type: string, size = 10) => {
  const f = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('rejectResourceFile', () => {
  it('accepts a file the type can hold', () => {
    expect(rejectResourceFile(file('guide.pdf', 'application/pdf'), 'pdf')).toBeNull();
    expect(rejectResourceFile(file('shot.png', 'image/png'), 'image')).toBeNull();
    expect(rejectResourceFile(file('clip.mp4', 'video/mp4'), 'video')).toBeNull();
  });

  it('names what the type would have taken when it turns one away', () => {
    expect(rejectResourceFile(file('diagram.gif', 'image/gif'), 'pdf')).toBe(
      'Invalid file type for pdf. Allowed: application/pdf'
    );
  });

  /**
   * SVG is left out of the image list on purpose: it can carry executable
   * JavaScript, and these files are served from public storage URLs.
   */
  it('refuses an SVG offered as an image', () => {
    expect(rejectResourceFile(file('logo.svg', 'image/svg+xml'), 'image')).toMatch(
      /Invalid file type for image/
    );
  });

  it('refuses a file over the size cap', () => {
    expect(
      rejectResourceFile(file('huge.pdf', 'application/pdf', MAX_RESOURCE_FILE_SIZE + 1), 'pdf')
    ).toBe('File too large. Maximum size is 25MB.');
  });

  /** A link carries no file, so nothing constrains what one could attach. */
  it('constrains nothing for a type with no file list', () => {
    expect(rejectResourceFile(file('anything.bin', 'application/octet-stream'), 'link')).toBeNull();
  });

  it('checks the size before the type, so the clearer problem wins', () => {
    expect(
      rejectResourceFile(file('huge.gif', 'image/gif', MAX_RESOURCE_FILE_SIZE + 1), 'pdf')
    ).toMatch(/too large/);
  });
});

describe('formatFileSize', () => {
  it('scales the unit to the size', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('stays in bytes right up to a kilobyte', () => {
    expect(formatFileSize(1023)).toBe('1023 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });
});

describe('titleFromFileName', () => {
  it('drops the extension', () => {
    expect(titleFromFileName('Band Plan.pdf')).toBe('Band Plan');
  });

  it('keeps dots that are part of the name', () => {
    expect(titleFromFileName('Part 97.3 Notes.pdf')).toBe('Part 97.3 Notes');
  });

  it('leaves a name with no extension alone', () => {
    expect(titleFromFileName('README')).toBe('README');
  });
});

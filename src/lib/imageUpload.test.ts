import { describe, it, expect } from 'vitest';
import { describeStorageError, rejectImage, storageNameFor, storageNameFromUrl } from './imageUpload';

const rules = {
  allowedTypes: ['image/png', 'image/jpeg'],
  maxBytes: 2 * 1024 * 1024,
  typesLabel: 'PNG or JPEG',
};

const file = (type: string, size = 10) =>
  Object.defineProperty(new File(['x'], 'f', { type }), 'size', { value: size }) as File;

describe('rejectImage', () => {
  it('accepts an allowed type within the cap', () => {
    expect(rejectImage(file('image/png'), rules)).toBeNull();
  });

  it('names the allowed types when the type is wrong', () => {
    expect(rejectImage(file('image/svg+xml'), rules)).toBe('Invalid file type. Please upload PNG or JPEG.');
  });

  it('states the cap in MB when the file is too big', () => {
    expect(rejectImage(file('image/png', 3 * 1024 * 1024), rules)).toBe('File too large. Maximum size is 2 MB.');
  });

  it('allows a file exactly at the cap', () => {
    expect(rejectImage(file('image/png', 2 * 1024 * 1024), rules)).toBeNull();
  });
});

describe('storageNameFor', () => {
  it('takes the extension from the MIME type, not the file name', () => {
    expect(storageNameFor('abc', 'image/jpeg')).toBe('abc.jpg');
    expect(storageNameFor('abc', 'image/svg+xml')).toBe('abc.svg');
  });

  it('falls back to png for a type it does not know', () => {
    expect(storageNameFor('abc', 'image/avif')).toBe('abc.png');
  });
});

describe('storageNameFromUrl', () => {
  it('takes the last path segment', () => {
    expect(storageNameFromUrl('https://x.co/storage/v1/object/public/question-figures/q1.png')).toBe('q1.png');
  });

  it('drops a cache-busting query', () => {
    expect(storageNameFromUrl('https://x.co/o/q1.png?t=123')).toBe('q1.png');
  });
});

describe('describeStorageError', () => {
  it('takes the message off an Error', () => {
    expect(describeStorageError(new Error('boom'))).toBe('boom');
  });

  /** Supabase hands back plain { message } objects on some paths. */
  it('takes the message off a plain object rather than printing [object Object]', () => {
    expect(describeStorageError({ message: 'denied' })).toBe('denied');
  });

  it('falls back to the string form of anything else', () => {
    expect(describeStorageError('nope')).toBe('nope');
  });
});

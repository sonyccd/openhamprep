import { describe, it, expect } from 'vitest';
import { defaultTopicContent, insertAtSelection } from './defaultTopicContent';

describe('defaultTopicContent', () => {
  it('titles the document from the slug', () => {
    expect(defaultTopicContent('ohms-law-basics')).toMatch(/^# Ohms Law Basics\n/);
  });

  it('carries the section scaffold', () => {
    const doc = defaultTopicContent('x');
    for (const heading of ['## Introduction', '## Main Content', '## Key Points', '## Summary']) {
      expect(doc).toContain(heading);
    }
  });
});

describe('insertAtSelection', () => {
  it('replaces the selection and puts the caret after the insert', () => {
    expect(insertAtSelection('hello world', 6, 11, 'there')).toEqual({ value: 'hello there', caret: 11 });
  });

  it('inserts at a collapsed caret', () => {
    expect(insertAtSelection('ab', 1, 1, '-')).toEqual({ value: 'a-b', caret: 2 });
  });
});

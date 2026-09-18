import { describe, it, expect } from 'vitest';
import { buildForumUrl, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from './helpForumUrl';

const paramsOf = (url: string) => new URL(url).searchParams;

describe('buildForumUrl', () => {
  it('files bugs under the bug tag and feedback under feature', () => {
    expect(paramsOf(buildForumUrl('bug', 't', 'd')).get('tags')).toBe('bug');
    expect(paramsOf(buildForumUrl('feedback', 't', 'd')).get('tags')).toBe('feature');
  });

  it('posts to the feedback category on the forum', () => {
    const url = new URL(buildForumUrl('bug', 't', 'd'));
    expect(url.origin + url.pathname).toBe('https://forum.openhamprep.com/new-topic');
    expect(url.searchParams.get('category')).toBe('feedback');
  });

  it('seeds the body with the report template around the description', () => {
    const bug = paramsOf(buildForumUrl('bug', 't', 'It broke')).get('body');
    expect(bug).toContain('**Issue Description:**\nIt broke');
    expect(bug).toContain('**Steps to Reproduce:**');

    const idea = paramsOf(buildForumUrl('feedback', 't', 'Add CW')).get('body');
    expect(idea).toContain('**Feedback:**\nAdd CW');
    expect(idea).toContain('**Why this would help:**');
  });

  /** The inputs cap length too; this guards a caller that bypasses them. */
  it('truncates an over-long title and description', () => {
    const params = paramsOf(
      buildForumUrl('bug', 'x'.repeat(MAX_TITLE_LENGTH + 5), 'y'.repeat(MAX_DESCRIPTION_LENGTH + 5))
    );
    expect(params.get('title')).toHaveLength(MAX_TITLE_LENGTH);
    expect(params.get('body')).toContain('y'.repeat(MAX_DESCRIPTION_LENGTH));
    expect(params.get('body')).not.toContain('y'.repeat(MAX_DESCRIPTION_LENGTH + 1));
  });
});

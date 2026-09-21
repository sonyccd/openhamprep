/** A starter document for a topic that has no content yet, titled from its slug. */
export function defaultTopicContent(slug: string): string {
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `# ${title}

## Introduction

Write your introduction here. This section should give readers an overview of what they'll learn.

## Main Content

Add your main content here. You can use:

- **Bold text** for emphasis
- *Italic text* for terms
- \`code\` for technical terms
- [Links](https://example.com) to external resources

### Subsection

Break down complex topics into subsections.

## Key Points

1. First key point
2. Second key point
3. Third key point

## Summary

Wrap up the topic with a brief summary of what was covered.
`;
}

/** Puts markdown at the selection of a textarea's value; returns the new value and where the caret should land. */
export function insertAtSelection(value: string, start: number, end: number, insert: string) {
  return { value: value.slice(0, start) + insert + value.slice(end), caret: start + insert.length };
}

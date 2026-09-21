/** Comma-separated ids, trimmed, upper-cased, blanks dropped. */
export const parseQuestionIds = (input: string) =>
  input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.toUpperCase());

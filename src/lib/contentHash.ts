/**
 * Content hash generation for question versioning.
 *
 * Generates a SHA-256 hash of normalized question content to detect
 * when a question's content has changed. This allows tracking user
 * attempts against specific question versions even as the pool evolves.
 */

/**
 * Normalize text for consistent hashing.
 * Handles common variations that shouldn't affect hash:
 * - Case differences
 * - Extra whitespace
 * - Unicode quote variants
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"');
}

/**
 * Generate a SHA-256 content hash for a question.
 *
 * The hash is computed from:
 * - Normalized question text
 * - Normalized answer options (in order)
 * - Correct answer index
 *
 * @param question - The question text
 * @param options - Array of answer options (A, B, C, D)
 * @param correctAnswer - Index of correct answer (0-3)
 * @returns Hex-encoded SHA-256 hash
 *
 * @example
 * const hash = await generateContentHash(
 *   "What is 2 + 2?",
 *   ["3", "4", "5", "6"],
 *   1
 * );
 * // Returns something like: "a1b2c3d4e5f6..."
 */
export async function generateContentHash(
  question: string,
  options: string[],
  correctAnswer: number
): Promise<string> {
  // Build a deterministic string from all content
  const normalized = [
    normalize(question),
    ...options.map(normalize),
    correctAnswer.toString()
  ].join('|');

  // Use Web Crypto API for SHA-256 (available in browsers and modern Node.js)
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate content hash from a Question object.
 * Convenience wrapper that extracts fields from the Question interface.
 */
export async function generateQuestionHash(question: {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}): Promise<string> {
  const answerToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const optionsArray = [
    question.options.A,
    question.options.B,
    question.options.C,
    question.options.D
  ];

  return generateContentHash(
    question.question,
    optionsArray,
    answerToIndex[question.correctAnswer]
  );
}

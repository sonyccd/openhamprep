import { describe, it, expect } from 'vitest';
import { generateContentHash, generateQuestionHash } from './contentHash';

describe('contentHash', () => {
  describe('generateContentHash', () => {
    it('generates consistent hash for same content', async () => {
      const hash1 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        1
      );
      const hash2 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        1
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
    });

    it('generates different hash for different questions', async () => {
      const hash1 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        1
      );
      const hash2 = await generateContentHash(
        'What is 3 + 3?',
        ['5', '6', '7', '8'],
        1
      );

      expect(hash1).not.toBe(hash2);
    });

    it('generates different hash for different correct answer', async () => {
      const hash1 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        1
      );
      const hash2 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        2
      );

      expect(hash1).not.toBe(hash2);
    });

    it('normalizes whitespace differences', async () => {
      const hash1 = await generateContentHash(
        'What is 2 + 2?',
        ['3', '4', '5', '6'],
        1
      );
      const hash2 = await generateContentHash(
        'What is  2 +  2?', // extra spaces
        ['3', '4', '5', '6'],
        1
      );

      expect(hash1).toBe(hash2);
    });

    it('normalizes case differences', async () => {
      const hash1 = await generateContentHash(
        'What is the answer?',
        ['Yes', 'No', 'Maybe', 'Unknown'],
        0
      );
      const hash2 = await generateContentHash(
        'WHAT IS THE ANSWER?',
        ['YES', 'NO', 'MAYBE', 'UNKNOWN'],
        0
      );

      expect(hash1).toBe(hash2);
    });

    it('normalizes quote characters', async () => {
      const hash1 = await generateContentHash(
        "What is 'quoted'?",
        ['Option "A"', 'Option B', 'Option C', 'Option D'],
        0
      );
      const hash2 = await generateContentHash(
        "What is 'quoted'?", // curly quotes
        ['Option "A"', 'Option B', 'Option C', 'Option D'], // curly double quotes
        0
      );

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateQuestionHash', () => {
    it('generates hash from Question-like object', async () => {
      const question = {
        question: 'What is the capital of France?',
        options: {
          A: 'London',
          B: 'Paris',
          C: 'Berlin',
          D: 'Madrid'
        },
        correctAnswer: 'B' as const
      };

      const hash = await generateQuestionHash(question);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates same hash as generateContentHash with equivalent input', async () => {
      const question = {
        question: 'Sample question?',
        options: {
          A: 'Option A',
          B: 'Option B',
          C: 'Option C',
          D: 'Option D'
        },
        correctAnswer: 'C' as const
      };

      const hashFromQuestion = await generateQuestionHash(question);
      const hashFromRaw = await generateContentHash(
        'Sample question?',
        ['Option A', 'Option B', 'Option C', 'Option D'],
        2 // C = index 2
      );

      expect(hashFromQuestion).toBe(hashFromRaw);
    });
  });
});

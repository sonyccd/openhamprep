import { describe, it, expect } from 'vitest';
import { selectExamQuestions } from './examQuestions';
import { examDistribution } from '@/types/navigation';

// Minimal question shape matching the Selectable interface
interface MockQuestion {
  id: string;
  subelement: string;
  group: string;
}

/** Create a pool of mock questions for a given distribution */
function buildPool(distribution: Record<string, number>, questionsPerGroup = 10): MockQuestion[] {
  const questions: MockQuestion[] = [];
  let id = 0;
  for (const [subelement, count] of Object.entries(distribution)) {
    // Create `count` groups (real exams have one group per required question)
    for (let g = 0; g < count; g++) {
      const groupLetter = String.fromCharCode(65 + g); // A, B, C...
      const group = `${subelement}${groupLetter}`;
      for (let q = 1; q <= questionsPerGroup; q++) {
        questions.push({
          id: `q-${id++}`,
          subelement,
          group,
        });
      }
    }
  }
  return questions;
}

describe('selectExamQuestions', () => {
  describe('correct distribution', () => {
    it('selects the right number of questions per subelement for technician', () => {
      const dist = examDistribution.technician;
      const pool = buildPool(dist);
      const result = selectExamQuestions(pool, 35, dist);

      expect(result).toHaveLength(35);
      for (const [sub, count] of Object.entries(dist)) {
        const actual = result.filter(q => q.subelement === sub).length;
        expect(actual, `subelement ${sub}`).toBe(count);
      }
    });

    it('selects the right number of questions per subelement for general', () => {
      const dist = examDistribution.general;
      const pool = buildPool(dist);
      const result = selectExamQuestions(pool, 35, dist);

      expect(result).toHaveLength(35);
      for (const [sub, count] of Object.entries(dist)) {
        const actual = result.filter(q => q.subelement === sub).length;
        expect(actual, `subelement ${sub}`).toBe(count);
      }
    });

    it('selects the right number of questions per subelement for extra', () => {
      const dist = examDistribution.extra;
      const pool = buildPool(dist);
      const result = selectExamQuestions(pool, 50, dist);

      expect(result).toHaveLength(50);
      for (const [sub, count] of Object.entries(dist)) {
        const actual = result.filter(q => q.subelement === sub).length;
        expect(actual, `subelement ${sub}`).toBe(count);
      }
    });
  });

  describe('group diversity', () => {
    it('picks from different groups when possible', () => {
      const dist = { S1: 3 };
      const pool = buildPool(dist, 5); // 3 groups × 5 questions each = 15
      const result = selectExamQuestions(pool, 3, dist);

      expect(result).toHaveLength(3);

      // Each question should be from a different group
      const groups = new Set(result.map(q => q.group));
      expect(groups.size).toBe(3);
    });
  });

  describe('no duplicates', () => {
    it('never selects the same question twice', () => {
      const dist = examDistribution.technician;
      const pool = buildPool(dist);

      // Run multiple times due to randomness
      for (let i = 0; i < 20; i++) {
        const result = selectExamQuestions(pool, 35, dist);
        const ids = result.map(q => q.id);
        expect(new Set(ids).size, `run ${i}`).toBe(ids.length);
      }
    });
  });

  describe('sparse pool handling', () => {
    it('returns all available questions when pool is smaller than requested', () => {
      const dist = { S1: 5, S2: 5 };
      // Only 3 questions total
      const pool: MockQuestion[] = [
        { id: 'q1', subelement: 'S1', group: 'S1A' },
        { id: 'q2', subelement: 'S1', group: 'S1B' },
        { id: 'q3', subelement: 'S2', group: 'S2A' },
      ];
      const result = selectExamQuestions(pool, 10, dist);

      expect(result).toHaveLength(3);
      expect(new Set(result.map(q => q.id)).size).toBe(3);
    });

    it('fills from other subelements when one is sparse', () => {
      const dist = { S1: 3, S2: 2 };
      // S1 has only 1 question, S2 has plenty
      const pool: MockQuestion[] = [
        { id: 'q1', subelement: 'S1', group: 'S1A' },
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `q-s2-${i}`,
          subelement: 'S2',
          group: i < 2 ? `S2${String.fromCharCode(65 + i)}` : 'S2A',
        })),
      ];
      const result = selectExamQuestions(pool, 5, dist);

      // Should get 5 total: 1 from S1 (all available) + some from S2 + backfill
      expect(result).toHaveLength(5);
      expect(result.filter(q => q.subelement === 'S1')).toHaveLength(1);
    });
  });

  describe('missing subelement', () => {
    it('handles subelement with zero questions gracefully', () => {
      const dist = { S1: 3, S2: 2 };
      // Only S1 questions exist, no S2
      const pool: MockQuestion[] = [
        { id: 'q1', subelement: 'S1', group: 'S1A' },
        { id: 'q2', subelement: 'S1', group: 'S1B' },
        { id: 'q3', subelement: 'S1', group: 'S1C' },
        { id: 'q4', subelement: 'S1', group: 'S1A' },
        { id: 'q5', subelement: 'S1', group: 'S1B' },
      ];
      const result = selectExamQuestions(pool, 5, dist);

      expect(result).toHaveLength(5);
      // All questions should be from S1 since S2 doesn't exist
      expect(result.every(q => q.subelement === 'S1')).toBe(true);
    });
  });

  describe('subelement with fewer groups than quota', () => {
    it('fills remaining slots from the same subelement', () => {
      // Distribution wants 4 from S1, but only 2 groups exist
      const dist = { S1: 4 };
      const pool: MockQuestion[] = [
        { id: 'q1', subelement: 'S1', group: 'S1A' },
        { id: 'q2', subelement: 'S1', group: 'S1A' },
        { id: 'q3', subelement: 'S1', group: 'S1B' },
        { id: 'q4', subelement: 'S1', group: 'S1B' },
        { id: 'q5', subelement: 'S1', group: 'S1A' },
      ];
      const result = selectExamQuestions(pool, 4, dist);

      expect(result).toHaveLength(4);
      expect(new Set(result.map(q => q.id)).size).toBe(4);
    });
  });

  describe('empty inputs', () => {
    it('returns empty array when pool is empty', () => {
      const result = selectExamQuestions([], 35, examDistribution.technician);
      expect(result).toHaveLength(0);
    });

    it('returns empty array when questionCount is 0', () => {
      const pool = buildPool(examDistribution.technician);
      const result = selectExamQuestions(pool, 0, examDistribution.technician);
      expect(result).toHaveLength(0);
    });
  });
});

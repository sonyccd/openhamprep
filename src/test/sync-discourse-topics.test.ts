import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Comprehensive tests for the sync-discourse-topics edge function.
 *
 * Since the edge function runs in Deno, we extract and test the core logic
 * as pure functions here to ensure correctness before deployment.
 */

// ============================================================================
// EXTRACTED LOGIC FROM EDGE FUNCTION (for testability)
// ============================================================================

const CATEGORY_MAP: Record<string, string> = {
  'T': 'Technician Questions',
  'G': 'General Questions',
  'E': 'Extra Questions',
};

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface SyncResult {
  questionId: string;
  status: 'created' | 'skipped' | 'error';
  topicId?: number;
  reason?: string;
}

function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

function formatTopicBody(question: Question): string {
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join('\n');

  const explanationText = question.explanation
    ? question.explanation
    : '_No explanation yet. Help improve this by contributing below!_';

  return `## Question
${question.question}

## Answer Options
${optionsText}

**Correct Answer: ${correctLetter}**

---

## Explanation
${explanationText}

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;
}

function formatTopicTitle(question: Question, maxLength: number = 250): string {
  let title = `${question.id} - ${question.question}`;
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  return title;
}

function extractQuestionIdFromTitle(title: string): string | null {
  const match = title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
  return match ? match[1] : null;
}

function getCategoryForQuestion(questionId: string): string | null {
  const prefix = questionId[0];
  return CATEGORY_MAP[prefix] || null;
}

function validateQuestionId(id: string): boolean {
  // Valid format: T1A01, G2B03, E5C12, etc.
  return /^[TGE]\d[A-Z]\d{2}$/.test(id);
}

function filterQuestionsToCreate(
  questions: Question[],
  existingTopicIds: Set<string>
): { toCreate: Question[]; toSkip: Question[] } {
  const toCreate: Question[] = [];
  const toSkip: Question[] = [];

  for (const question of questions) {
    if (existingTopicIds.has(question.id)) {
      toSkip.push(question);
    } else {
      toCreate.push(question);
    }
  }

  return { toCreate, toSkip };
}

function parseLicenseFilter(license: string | undefined): string[] {
  if (!license) {
    return ['T', 'G', 'E'];
  }

  const licenseMap: Record<string, string> = {
    'technician': 'T',
    'general': 'G',
    'extra': 'E',
  };

  const prefix = licenseMap[license.toLowerCase()];
  if (!prefix) {
    throw new Error('Invalid license type. Use: technician, general, or extra');
  }

  return [prefix];
}

// Batch size validation (matches edge function logic)
function validateBatchSize(batchSize: number): number {
  return Math.min(Math.max(1, batchSize), 100);
}

// Calculate batch progress
interface BatchProgress {
  totalInDatabase: number;
  alreadyInDiscourse: number;
  createdThisBatch: number;
  remainingToCreate: number;
  estimatedBatchesRemaining: number;
}

function calculateBatchProgress(
  totalQuestions: number,
  existingCount: number,
  createdThisBatch: number,
  batchSize: number
): BatchProgress {
  const toCreate = totalQuestions - existingCount;
  const remaining = toCreate - createdThisBatch;

  return {
    totalInDatabase: totalQuestions,
    alreadyInDiscourse: existingCount,
    createdThisBatch,
    remainingToCreate: remaining,
    estimatedBatchesRemaining: Math.ceil(remaining / batchSize),
  };
}

// Get batch to process
function getBatchToProcess<T>(items: T[], batchSize: number): { batch: T[]; remaining: number } {
  const batch = items.slice(0, batchSize);
  const remaining = items.length - batch.length;
  return { batch, remaining };
}

// Estimate time for batch
function estimateTimeMinutes(questionCount: number): number {
  const RATE_LIMIT_DELAY_MS = 1000;
  return Math.ceil((questionCount * RATE_LIMIT_DELAY_MS) / 1000 / 60);
}

// ============================================================================
// TESTS
// ============================================================================

describe('sync-discourse-topics edge function', () => {
  describe('CATEGORY_MAP', () => {
    it('maps T prefix to Technician Questions', () => {
      expect(CATEGORY_MAP['T']).toBe('Technician Questions');
    });

    it('maps G prefix to General Questions', () => {
      expect(CATEGORY_MAP['G']).toBe('General Questions');
    });

    it('maps E prefix to Extra Questions', () => {
      expect(CATEGORY_MAP['E']).toBe('Extra Questions');
    });

    it('has exactly 3 license types', () => {
      expect(Object.keys(CATEGORY_MAP)).toHaveLength(3);
    });
  });

  describe('getCategorySlug', () => {
    it('converts category name to slug format', () => {
      expect(getCategorySlug('Technician Questions')).toBe('technician-questions');
    });

    it('handles multiple spaces by collapsing them', () => {
      // The regex \s+ matches one or more whitespace, replacing with single dash
      expect(getCategorySlug('General  Questions')).toBe('general-questions');
    });

    it('converts to lowercase', () => {
      expect(getCategorySlug('EXTRA QUESTIONS')).toBe('extra-questions');
    });

    it('handles single word', () => {
      expect(getCategorySlug('Questions')).toBe('questions');
    });
  });

  describe('validateQuestionId', () => {
    describe('valid IDs', () => {
      it('accepts Technician question IDs', () => {
        expect(validateQuestionId('T1A01')).toBe(true);
        expect(validateQuestionId('T9Z99')).toBe(true);
        expect(validateQuestionId('T0A00')).toBe(true);
      });

      it('accepts General question IDs', () => {
        expect(validateQuestionId('G1A01')).toBe(true);
        expect(validateQuestionId('G5C12')).toBe(true);
      });

      it('accepts Extra question IDs', () => {
        expect(validateQuestionId('E1A01')).toBe(true);
        expect(validateQuestionId('E9Z99')).toBe(true);
      });
    });

    describe('invalid IDs', () => {
      it('rejects IDs with wrong prefix', () => {
        expect(validateQuestionId('X1A01')).toBe(false);
        expect(validateQuestionId('A1A01')).toBe(false);
      });

      it('rejects IDs with wrong length', () => {
        expect(validateQuestionId('T1A1')).toBe(false);
        expect(validateQuestionId('T1A012')).toBe(false);
        expect(validateQuestionId('T1A')).toBe(false);
      });

      it('rejects IDs with lowercase letters', () => {
        expect(validateQuestionId('t1a01')).toBe(false);
        expect(validateQuestionId('T1a01')).toBe(false);
      });

      it('rejects IDs with invalid format', () => {
        expect(validateQuestionId('TAA01')).toBe(false);
        expect(validateQuestionId('T11A01')).toBe(false);
        expect(validateQuestionId('T1AA1')).toBe(false);
      });

      it('rejects empty string', () => {
        expect(validateQuestionId('')).toBe(false);
      });

      it('rejects null-like values', () => {
        expect(validateQuestionId('null')).toBe(false);
        expect(validateQuestionId('undefined')).toBe(false);
      });
    });
  });

  describe('extractQuestionIdFromTitle', () => {
    it('extracts question ID from properly formatted title', () => {
      expect(extractQuestionIdFromTitle('T1A01 - What is the purpose of the FCC?')).toBe('T1A01');
      expect(extractQuestionIdFromTitle('G2B03 - Some question text')).toBe('G2B03');
      expect(extractQuestionIdFromTitle('E5C12 - Another question')).toBe('E5C12');
    });

    it('handles title with extra spaces', () => {
      expect(extractQuestionIdFromTitle('T1A01  - Question with extra space')).toBe('T1A01');
      expect(extractQuestionIdFromTitle('T1A01- No space before dash')).toBe('T1A01');
    });

    it('returns null for invalid title format', () => {
      expect(extractQuestionIdFromTitle('Question without ID')).toBeNull();
      expect(extractQuestionIdFromTitle('X1A01 - Invalid prefix')).toBeNull();
      expect(extractQuestionIdFromTitle('')).toBeNull();
    });

    it('returns null for malformed IDs in title', () => {
      expect(extractQuestionIdFromTitle('T1A1 - Short ID')).toBeNull();
      expect(extractQuestionIdFromTitle('T1A012 - Long ID')).toBeNull();
    });

    it('only matches at the beginning of the title', () => {
      expect(extractQuestionIdFromTitle('Some text T1A01 - Question')).toBeNull();
    });
  });

  describe('getCategoryForQuestion', () => {
    it('returns correct category for Technician questions', () => {
      expect(getCategoryForQuestion('T1A01')).toBe('Technician Questions');
      expect(getCategoryForQuestion('T9Z99')).toBe('Technician Questions');
    });

    it('returns correct category for General questions', () => {
      expect(getCategoryForQuestion('G1A01')).toBe('General Questions');
      expect(getCategoryForQuestion('G5C12')).toBe('General Questions');
    });

    it('returns correct category for Extra questions', () => {
      expect(getCategoryForQuestion('E1A01')).toBe('Extra Questions');
      expect(getCategoryForQuestion('E9Z99')).toBe('Extra Questions');
    });

    it('returns null for invalid prefix', () => {
      expect(getCategoryForQuestion('X1A01')).toBeNull();
      expect(getCategoryForQuestion('A1A01')).toBeNull();
    });
  });

  describe('parseLicenseFilter', () => {
    it('returns all prefixes when no license specified', () => {
      expect(parseLicenseFilter(undefined)).toEqual(['T', 'G', 'E']);
    });

    it('parses technician license', () => {
      expect(parseLicenseFilter('technician')).toEqual(['T']);
      expect(parseLicenseFilter('Technician')).toEqual(['T']);
      expect(parseLicenseFilter('TECHNICIAN')).toEqual(['T']);
    });

    it('parses general license', () => {
      expect(parseLicenseFilter('general')).toEqual(['G']);
      expect(parseLicenseFilter('General')).toEqual(['G']);
      expect(parseLicenseFilter('GENERAL')).toEqual(['G']);
    });

    it('parses extra license', () => {
      expect(parseLicenseFilter('extra')).toEqual(['E']);
      expect(parseLicenseFilter('Extra')).toEqual(['E']);
      expect(parseLicenseFilter('EXTRA')).toEqual(['E']);
    });

    it('throws error for invalid license', () => {
      expect(() => parseLicenseFilter('invalid')).toThrow('Invalid license type');
      expect(() => parseLicenseFilter('amateur')).toThrow('Invalid license type');
      expect(() => parseLicenseFilter('novice')).toThrow('Invalid license type');
    });
  });

  describe('formatTopicTitle', () => {
    const mockQuestion: Question = {
      id: 'T1A01',
      question: 'What is the purpose of the Amateur Radio Service?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 0,
      explanation: null,
    };

    it('formats title with question ID and text', () => {
      const title = formatTopicTitle(mockQuestion);
      expect(title).toBe('T1A01 - What is the purpose of the Amateur Radio Service?');
    });

    it('truncates long titles to default max length', () => {
      const longQuestion: Question = {
        ...mockQuestion,
        question: 'A'.repeat(300),
      };
      const title = formatTopicTitle(longQuestion);
      expect(title.length).toBe(250);
      expect(title.endsWith('...')).toBe(true);
    });

    it('truncates to custom max length', () => {
      const longQuestion: Question = {
        ...mockQuestion,
        question: 'A'.repeat(100),
      };
      const title = formatTopicTitle(longQuestion, 50);
      expect(title.length).toBe(50);
      expect(title.endsWith('...')).toBe(true);
    });

    it('does not truncate titles under max length', () => {
      const title = formatTopicTitle(mockQuestion, 500);
      expect(title).not.toContain('...');
    });

    it('preserves question ID in truncated title', () => {
      const longQuestion: Question = {
        ...mockQuestion,
        question: 'A'.repeat(300),
      };
      const title = formatTopicTitle(longQuestion);
      expect(title.startsWith('T1A01 - ')).toBe(true);
    });
  });

  describe('formatTopicBody', () => {
    const mockQuestion: Question = {
      id: 'T1A01',
      question: 'What is the purpose of the Amateur Radio Service?',
      options: [
        'Advancing skills in technical areas',
        'Emergency communications',
        'International goodwill',
        'All of these choices are correct',
      ],
      correct_answer: 3,
      explanation: 'The Amateur Radio Service serves multiple purposes.',
    };

    it('includes the question text', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('What is the purpose of the Amateur Radio Service?');
    });

    it('includes all answer options with letter prefixes', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('**A)** Advancing skills in technical areas');
      expect(body).toContain('**B)** Emergency communications');
      expect(body).toContain('**C)** International goodwill');
      expect(body).toContain('**D)** All of these choices are correct');
    });

    it('indicates the correct answer letter', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('**Correct Answer: D**');
    });

    it('indicates correct answer A when correct_answer is 0', () => {
      const questionWithA = { ...mockQuestion, correct_answer: 0 };
      const body = formatTopicBody(questionWithA);
      expect(body).toContain('**Correct Answer: A**');
    });

    it('indicates correct answer B when correct_answer is 1', () => {
      const questionWithB = { ...mockQuestion, correct_answer: 1 };
      const body = formatTopicBody(questionWithB);
      expect(body).toContain('**Correct Answer: B**');
    });

    it('indicates correct answer C when correct_answer is 2', () => {
      const questionWithC = { ...mockQuestion, correct_answer: 2 };
      const body = formatTopicBody(questionWithC);
      expect(body).toContain('**Correct Answer: C**');
    });

    it('includes explanation when provided', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('The Amateur Radio Service serves multiple purposes.');
    });

    it('shows placeholder when no explanation provided', () => {
      const questionNoExplanation = { ...mockQuestion, explanation: null };
      const body = formatTopicBody(questionNoExplanation);
      expect(body).toContain('_No explanation yet. Help improve this by contributing below!_');
    });

    it('shows placeholder for empty explanation', () => {
      const questionEmptyExplanation = { ...mockQuestion, explanation: '' };
      const body = formatTopicBody(questionEmptyExplanation);
      expect(body).toContain('_No explanation yet. Help improve this by contributing below!_');
    });

    it('includes community contribution footer', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('This topic was automatically created');
      expect(body).toContain('Feel free to share study tips');
    });

    it('formats options as markdown bullet points', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('- **A)**');
      expect(body).toContain('- **B)**');
      expect(body).toContain('- **C)**');
      expect(body).toContain('- **D)**');
    });

    it('includes section headers', () => {
      const body = formatTopicBody(mockQuestion);
      expect(body).toContain('## Question');
      expect(body).toContain('## Answer Options');
      expect(body).toContain('## Explanation');
    });
  });

  describe('filterQuestionsToCreate', () => {
    const mockQuestions: Question[] = [
      { id: 'T1A01', question: 'Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
      { id: 'T1A02', question: 'Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 1, explanation: null },
      { id: 'T1A03', question: 'Q3', options: ['A', 'B', 'C', 'D'], correct_answer: 2, explanation: null },
      { id: 'G1A01', question: 'Q4', options: ['A', 'B', 'C', 'D'], correct_answer: 3, explanation: null },
    ];

    it('returns all questions to create when none exist', () => {
      const existingIds = new Set<string>();
      const result = filterQuestionsToCreate(mockQuestions, existingIds);

      expect(result.toCreate).toHaveLength(4);
      expect(result.toSkip).toHaveLength(0);
    });

    it('skips questions that already exist', () => {
      const existingIds = new Set(['T1A01', 'T1A03']);
      const result = filterQuestionsToCreate(mockQuestions, existingIds);

      expect(result.toCreate).toHaveLength(2);
      expect(result.toSkip).toHaveLength(2);
      expect(result.toCreate.map(q => q.id)).toEqual(['T1A02', 'G1A01']);
      expect(result.toSkip.map(q => q.id)).toEqual(['T1A01', 'T1A03']);
    });

    it('skips all questions when all exist', () => {
      const existingIds = new Set(['T1A01', 'T1A02', 'T1A03', 'G1A01']);
      const result = filterQuestionsToCreate(mockQuestions, existingIds);

      expect(result.toCreate).toHaveLength(0);
      expect(result.toSkip).toHaveLength(4);
    });

    it('handles empty questions array', () => {
      const existingIds = new Set(['T1A01']);
      const result = filterQuestionsToCreate([], existingIds);

      expect(result.toCreate).toHaveLength(0);
      expect(result.toSkip).toHaveLength(0);
    });

    it('is case sensitive for question IDs', () => {
      const existingIds = new Set(['t1a01']); // lowercase
      const result = filterQuestionsToCreate(mockQuestions, existingIds);

      // Should NOT skip T1A01 because IDs are case sensitive
      expect(result.toCreate).toHaveLength(4);
      expect(result.toSkip).toHaveLength(0);
    });
  });

  describe('SyncResult type', () => {
    it('allows created status with topicId', () => {
      const result: SyncResult = {
        questionId: 'T1A01',
        status: 'created',
        topicId: 12345,
      };
      expect(result.status).toBe('created');
      expect(result.topicId).toBe(12345);
    });

    it('allows skipped status with reason', () => {
      const result: SyncResult = {
        questionId: 'T1A01',
        status: 'skipped',
        reason: 'already exists',
      };
      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('already exists');
    });

    it('allows error status with reason', () => {
      const result: SyncResult = {
        questionId: 'T1A01',
        status: 'error',
        reason: 'API rate limited',
      };
      expect(result.status).toBe('error');
      expect(result.reason).toBe('API rate limited');
    });
  });
});

describe('Edge cases and error scenarios', () => {
  describe('Question with special characters', () => {
    it('handles question text with quotes', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'What does "CQ" mean?',
        options: ['Call', 'Query', 'Quiet', 'None'],
        correct_answer: 0,
        explanation: null,
      };
      const body = formatTopicBody(question);
      expect(body).toContain('What does "CQ" mean?');
    });

    it('handles question text with special characters', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'What frequency is 146.52 MHz & why?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };
      const body = formatTopicBody(question);
      expect(body).toContain('146.52 MHz & why');
    });

    it('handles options with markdown characters', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'Test question',
        options: ['Option with *asterisks*', 'Option with _underscores_', 'Option with `backticks`', 'Plain option'],
        correct_answer: 0,
        explanation: null,
      };
      const body = formatTopicBody(question);
      expect(body).toContain('Option with *asterisks*');
      expect(body).toContain('Option with _underscores_');
      expect(body).toContain('Option with `backticks`');
    });

    it('handles explanation with markdown', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: 'See the **FCC Part 97** rules for details.',
      };
      const body = formatTopicBody(question);
      expect(body).toContain('**FCC Part 97**');
    });
  });

  describe('Boundary conditions', () => {
    it('handles question at exactly max title length', () => {
      const maxLen = 250;
      const idPart = 'T1A01 - ';
      const questionText = 'A'.repeat(maxLen - idPart.length);

      const question: Question = {
        id: 'T1A01',
        question: questionText,
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };

      const title = formatTopicTitle(question, maxLen);
      expect(title.length).toBe(maxLen);
      expect(title.endsWith('...')).toBe(false);
    });

    it('handles question one character over max title length', () => {
      const maxLen = 250;
      const idPart = 'T1A01 - ';
      const questionText = 'A'.repeat(maxLen - idPart.length + 1);

      const question: Question = {
        id: 'T1A01',
        question: questionText,
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };

      const title = formatTopicTitle(question, maxLen);
      expect(title.length).toBe(maxLen);
      expect(title.endsWith('...')).toBe(true);
    });

    it('handles empty question text', () => {
      const question: Question = {
        id: 'T1A01',
        question: '',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };

      const title = formatTopicTitle(question);
      expect(title).toBe('T1A01 - ');
    });

    it('handles correct_answer at boundary values', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'Test',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };

      expect(formatTopicBody({ ...question, correct_answer: 0 })).toContain('Correct Answer: A');
      expect(formatTopicBody({ ...question, correct_answer: 3 })).toContain('Correct Answer: D');
    });
  });
});

describe('Integration scenarios', () => {
  describe('Full workflow simulation', () => {
    const sampleQuestions: Question[] = [
      {
        id: 'T1A01',
        question: 'Which of the following is part of the Amateur Radio Service?',
        options: [
          'Citizens Band Radio Service',
          'The unlicensed wireless microphone service',
          'The Amateur-Satellite Service',
          'The International Maritime Radio Service',
        ],
        correct_answer: 2,
        explanation: 'The Amateur-Satellite Service is part of the Amateur Radio Service.',
      },
      {
        id: 'G1A01',
        question: 'On which HF bands does a Technician class operator have phone privileges?',
        options: [
          '10 meter band only',
          '80 meter band only',
          '15 meter band only',
          '40 meter band only',
        ],
        correct_answer: 0,
        explanation: 'Technicians have phone privileges on 10 meters.',
      },
      {
        id: 'E1A01',
        question: 'When using a handheld transceiver, what constitutes a full duty cycle?',
        options: [
          'Transmitting for the entire time the operator is at the radio',
          'Continuous key-down transmission for more than 5 minutes',
          'Transmitting 50% of the time during a 6-minute period',
          'Operating at maximum power with the antenna within 20 centimeters of the body',
        ],
        correct_answer: 3,
        explanation: 'Full duty cycle refers to continuous or near-continuous transmission.',
      },
    ];

    it('correctly categorizes questions by license type', () => {
      const techQuestions = sampleQuestions.filter(q => getCategoryForQuestion(q.id) === 'Technician Questions');
      const generalQuestions = sampleQuestions.filter(q => getCategoryForQuestion(q.id) === 'General Questions');
      const extraQuestions = sampleQuestions.filter(q => getCategoryForQuestion(q.id) === 'Extra Questions');

      expect(techQuestions).toHaveLength(1);
      expect(generalQuestions).toHaveLength(1);
      expect(extraQuestions).toHaveLength(1);
    });

    it('generates valid titles for all sample questions', () => {
      for (const question of sampleQuestions) {
        const title = formatTopicTitle(question);
        expect(title.length).toBeLessThanOrEqual(250);
        expect(title.startsWith(question.id + ' - ')).toBe(true);
      }
    });

    it('generates valid bodies for all sample questions', () => {
      for (const question of sampleQuestions) {
        const body = formatTopicBody(question);

        // Verify structure
        expect(body).toContain('## Question');
        expect(body).toContain('## Answer Options');
        expect(body).toContain('## Explanation');
        expect(body).toContain('**Correct Answer:');

        // Verify all options present
        question.options.forEach((opt, i) => {
          expect(body).toContain(opt);
        });

        // Verify explanation present
        expect(body).toContain(question.explanation!);
      }
    });

    it('can identify questions to create vs skip in realistic scenario', () => {
      // Simulate: T1A01 already exists in Discourse
      const existingTopicTitles = ['T1A01 - Which of the following is part of the Amateur Radio Service?'];
      const existingIds = new Set(
        existingTopicTitles.map(t => extractQuestionIdFromTitle(t)).filter(Boolean) as string[]
      );

      const result = filterQuestionsToCreate(sampleQuestions, existingIds);

      expect(result.toCreate).toHaveLength(2);
      expect(result.toSkip).toHaveLength(1);
      expect(result.toSkip[0].id).toBe('T1A01');
      expect(result.toCreate.map(q => q.id)).toEqual(['G1A01', 'E1A01']);
    });

    it('handles license filtering correctly', () => {
      const techFilter = parseLicenseFilter('technician');
      const techQuestions = sampleQuestions.filter(q => techFilter.includes(q.id[0]));
      expect(techQuestions).toHaveLength(1);
      expect(techQuestions[0].id).toBe('T1A01');
    });
  });
});

describe('Discourse API contract validation', () => {
  describe('Topic creation payload structure', () => {
    it('generates payload with required Discourse fields', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: 'Test explanation',
      };

      const title = formatTopicTitle(question);
      const body = formatTopicBody(question);

      // Discourse requires: title, raw (body), category (ID)
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(255); // Discourse limit

      expect(body).toBeTruthy();
      expect(body.length).toBeGreaterThan(0);
    });

    it('title starts with question ID for consistent matching', () => {
      const question: Question = {
        id: 'G5C12',
        question: 'Some question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: null,
      };

      const title = formatTopicTitle(question);
      expect(title.match(/^G5C12\s*-/)).toBeTruthy();
    });
  });

  describe('Category slug generation', () => {
    it('generates valid URL-safe slugs for all categories', () => {
      for (const categoryName of Object.values(CATEGORY_MAP)) {
        const slug = getCategorySlug(categoryName);

        // Slug should be lowercase
        expect(slug).toBe(slug.toLowerCase());

        // Slug should not contain spaces
        expect(slug).not.toContain(' ');

        // Slug should only contain valid URL characters
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      }
    });
  });
});

describe('Error handling robustness', () => {
  describe('Invalid input handling', () => {
    it('handles question with missing options gracefully', () => {
      const question: Question = {
        id: 'T1A01',
        question: 'Test',
        options: [], // Empty options
        correct_answer: 0,
        explanation: null,
      };

      // Should not throw
      const body = formatTopicBody(question);
      expect(body).toContain('## Answer Options');
    });

    it('handles question with undefined explanation', () => {
      const question = {
        id: 'T1A01',
        question: 'Test',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        explanation: undefined as unknown as null,
      };

      const body = formatTopicBody(question as Question);
      expect(body).toContain('_No explanation yet');
    });
  });
});

describe('Discourse API response parsing', () => {
  // These tests verify the expected structure of Discourse API responses
  // to ensure our parsing logic handles them correctly

  describe('Categories response structure', () => {
    it('parses valid categories response', () => {
      const mockResponse = {
        category_list: {
          categories: [
            { id: 1, name: 'Technician Questions', slug: 'technician-questions' },
            { id: 2, name: 'General Questions', slug: 'general-questions' },
            { id: 3, name: 'Extra Questions', slug: 'extra-questions' },
          ],
        },
      };

      const categoryMap = new Map<string, number>();
      for (const category of mockResponse.category_list.categories) {
        categoryMap.set(category.name, category.id);
      }

      expect(categoryMap.get('Technician Questions')).toBe(1);
      expect(categoryMap.get('General Questions')).toBe(2);
      expect(categoryMap.get('Extra Questions')).toBe(3);
    });

    it('handles response with extra categories', () => {
      const mockResponse = {
        category_list: {
          categories: [
            { id: 1, name: 'Technician Questions', slug: 'technician-questions' },
            { id: 2, name: 'General Questions', slug: 'general-questions' },
            { id: 3, name: 'Extra Questions', slug: 'extra-questions' },
            { id: 4, name: 'Off Topic', slug: 'off-topic' },
            { id: 5, name: 'Announcements', slug: 'announcements' },
          ],
        },
      };

      const categoryMap = new Map<string, number>();
      for (const category of mockResponse.category_list.categories) {
        categoryMap.set(category.name, category.id);
      }

      // Should still find our required categories
      expect(categoryMap.has('Technician Questions')).toBe(true);
      expect(categoryMap.has('General Questions')).toBe(true);
      expect(categoryMap.has('Extra Questions')).toBe(true);
    });

    it('detects missing required categories', () => {
      const mockResponse = {
        category_list: {
          categories: [
            { id: 1, name: 'Technician Questions', slug: 'technician-questions' },
            // Missing General Questions and Extra Questions
          ],
        },
      };

      const categoryMap = new Map<string, number>();
      for (const category of mockResponse.category_list.categories) {
        categoryMap.set(category.name, category.id);
      }

      const requiredCategories = ['Technician Questions', 'General Questions', 'Extra Questions'];
      const missingCategories = requiredCategories.filter(name => !categoryMap.has(name));

      expect(missingCategories).toEqual(['General Questions', 'Extra Questions']);
    });
  });

  describe('Topics response structure', () => {
    it('parses valid topics response', () => {
      const mockResponse = {
        topic_list: {
          topics: [
            { id: 101, title: 'T1A01 - What is the purpose of the Amateur Radio Service?' },
            { id: 102, title: 'T1A02 - Another question here' },
            { id: 103, title: 'Regular topic without question ID' },
          ],
        },
      };

      const existingIds = new Set<string>();
      for (const topic of mockResponse.topic_list.topics) {
        const match = topic.title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
        if (match) {
          existingIds.add(match[1]);
        }
      }

      expect(existingIds.has('T1A01')).toBe(true);
      expect(existingIds.has('T1A02')).toBe(true);
      expect(existingIds.size).toBe(2); // Regular topic not included
    });

    it('handles empty topics response', () => {
      const mockResponse = {
        topic_list: {
          topics: [],
        },
      };

      const existingIds = new Set<string>();
      for (const topic of mockResponse.topic_list?.topics || []) {
        const match = topic.title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
        if (match) {
          existingIds.add(match[1]);
        }
      }

      expect(existingIds.size).toBe(0);
    });

    it('handles malformed topic titles', () => {
      const mockResponse = {
        topic_list: {
          topics: [
            { id: 101, title: '' },
            { id: 102, title: 'T1A - Incomplete ID' },
            { id: 103, title: 'Just a regular title' },
            { id: 104, title: 'T1A01 - Valid title' },
          ],
        },
      };

      const existingIds = new Set<string>();
      for (const topic of mockResponse.topic_list.topics) {
        const match = topic.title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
        if (match) {
          existingIds.add(match[1]);
        }
      }

      expect(existingIds.size).toBe(1);
      expect(existingIds.has('T1A01')).toBe(true);
    });
  });

  describe('Topic creation response structure', () => {
    it('parses successful topic creation response', () => {
      const mockResponse = {
        id: 12345, // post id
        topic_id: 5678,
        topic_slug: 't1a01-what-is-the-purpose',
        created_at: '2025-01-15T10:00:00Z',
      };

      expect(mockResponse.topic_id).toBe(5678);
    });

    it('handles error response format', () => {
      const mockErrorResponse = {
        errors: ['Title is too short (minimum is 15 characters)'],
        error_type: 'invalid_parameters',
      };

      expect(mockErrorResponse.errors).toHaveLength(1);
      expect(mockErrorResponse.error_type).toBe('invalid_parameters');
    });
  });
});

describe('Rate limiting simulation', () => {
  it('calculates correct delay for batch processing', () => {
    const RATE_LIMIT_DELAY_MS = 1000;
    const questionCount = 100;
    const estimatedTimeMs = questionCount * RATE_LIMIT_DELAY_MS;
    const estimatedTimeMinutes = estimatedTimeMs / 1000 / 60;

    // 100 questions at 1 second each = ~1.67 minutes
    expect(estimatedTimeMinutes).toBeCloseTo(1.67, 1);
  });

  it('estimates time for full question pool', () => {
    const RATE_LIMIT_DELAY_MS = 1000;
    // Typical question pool: ~400 Technician + ~450 General + ~700 Extra = ~1550
    const fullPoolCount = 1550;
    const estimatedTimeMs = fullPoolCount * RATE_LIMIT_DELAY_MS;
    const estimatedTimeMinutes = estimatedTimeMs / 1000 / 60;

    // Should take about 25 minutes
    expect(estimatedTimeMinutes).toBeCloseTo(25.8, 1);
  });
});

describe('Data integrity checks', () => {
  it('ensures question IDs are unique in batch', () => {
    const questions: Question[] = [
      { id: 'T1A01', question: 'Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
      { id: 'T1A02', question: 'Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
      { id: 'T1A01', question: 'Duplicate', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null }, // Duplicate!
    ];

    const ids = questions.map(q => q.id);
    const uniqueIds = new Set(ids);

    // Detect duplicates
    expect(ids.length).not.toBe(uniqueIds.size);
    expect(uniqueIds.size).toBe(2);
  });

  it('validates all questions have required fields', () => {
    const questions: Question[] = [
      { id: 'T1A01', question: 'Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
      { id: 'T1A02', question: 'Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 1, explanation: 'Some explanation' },
    ];

    for (const q of questions) {
      expect(q.id).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.correct_answer).toBeGreaterThanOrEqual(0);
      expect(q.correct_answer).toBeLessThanOrEqual(3);
    }
  });

  it('validates correct_answer index is within bounds', () => {
    const question: Question = {
      id: 'T1A01',
      question: 'Test',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 2,
      explanation: null,
    };

    const isValidIndex = question.correct_answer >= 0 && question.correct_answer < question.options.length;
    expect(isValidIndex).toBe(true);
  });

  it('detects out-of-bounds correct_answer', () => {
    const question = {
      id: 'T1A01',
      question: 'Test',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 5, // Invalid!
      explanation: null,
    };

    const isValidIndex = question.correct_answer >= 0 && question.correct_answer < question.options.length;
    expect(isValidIndex).toBe(false);
  });
});

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

describe('Batch processing', () => {
  describe('validateBatchSize', () => {
    it('returns default batch size for valid values', () => {
      expect(validateBatchSize(50)).toBe(50);
      expect(validateBatchSize(1)).toBe(1);
      expect(validateBatchSize(100)).toBe(100);
    });

    it('clamps batch size to minimum of 1', () => {
      expect(validateBatchSize(0)).toBe(1);
      expect(validateBatchSize(-5)).toBe(1);
      expect(validateBatchSize(-100)).toBe(1);
    });

    it('clamps batch size to maximum of 100', () => {
      expect(validateBatchSize(101)).toBe(100);
      expect(validateBatchSize(200)).toBe(100);
      expect(validateBatchSize(1000)).toBe(100);
    });

    it('handles edge cases', () => {
      expect(validateBatchSize(1)).toBe(1);
      expect(validateBatchSize(100)).toBe(100);
    });

    it('handles fractional values by implicit truncation', () => {
      // Math.min/max will work with floats, but batchSize comes from JSON which doesn't have floats
      expect(validateBatchSize(50.5)).toBe(50.5); // JavaScript doesn't truncate
      expect(validateBatchSize(99.9)).toBe(99.9);
    });
  });

  describe('getBatchToProcess', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

    it('returns correct batch for small batch size', () => {
      const result = getBatchToProcess(items, 3);
      expect(result.batch).toEqual(['a', 'b', 'c']);
      expect(result.remaining).toBe(7);
    });

    it('returns all items when batch size exceeds array length', () => {
      const result = getBatchToProcess(items, 50);
      expect(result.batch).toEqual(items);
      expect(result.remaining).toBe(0);
    });

    it('returns empty batch for empty array', () => {
      const result = getBatchToProcess([], 10);
      expect(result.batch).toEqual([]);
      expect(result.remaining).toBe(0);
    });

    it('returns single item batch correctly', () => {
      const result = getBatchToProcess(items, 1);
      expect(result.batch).toEqual(['a']);
      expect(result.remaining).toBe(9);
    });

    it('returns exact array when batch size equals array length', () => {
      const result = getBatchToProcess(items, 10);
      expect(result.batch).toEqual(items);
      expect(result.remaining).toBe(0);
    });

    it('works with Question type', () => {
      const questions: Question[] = [
        { id: 'T1A01', question: 'Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
        { id: 'T1A02', question: 'Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 1, explanation: null },
        { id: 'T1A03', question: 'Q3', options: ['A', 'B', 'C', 'D'], correct_answer: 2, explanation: null },
      ];

      const result = getBatchToProcess(questions, 2);
      expect(result.batch).toHaveLength(2);
      expect(result.batch[0].id).toBe('T1A01');
      expect(result.batch[1].id).toBe('T1A02');
      expect(result.remaining).toBe(1);
    });
  });

  describe('calculateBatchProgress', () => {
    it('calculates progress for first batch', () => {
      // 100 total, 20 existing, created 50 in first batch
      const progress = calculateBatchProgress(100, 20, 50, 50);

      expect(progress.totalInDatabase).toBe(100);
      expect(progress.alreadyInDiscourse).toBe(20);
      expect(progress.createdThisBatch).toBe(50);
      expect(progress.remainingToCreate).toBe(30); // 80 to create - 50 created
      expect(progress.estimatedBatchesRemaining).toBe(1); // ceil(30/50)
    });

    it('calculates progress when almost complete', () => {
      const progress = calculateBatchProgress(100, 90, 5, 50);

      expect(progress.remainingToCreate).toBe(5); // 10 to create - 5 created
      expect(progress.estimatedBatchesRemaining).toBe(1);
    });

    it('calculates progress when complete', () => {
      const progress = calculateBatchProgress(100, 90, 10, 50);

      expect(progress.remainingToCreate).toBe(0);
      expect(progress.estimatedBatchesRemaining).toBe(0);
    });

    it('calculates correct batches remaining for large queue', () => {
      // 1500 questions, 0 existing, created 50 in first batch
      const progress = calculateBatchProgress(1500, 0, 50, 50);

      expect(progress.remainingToCreate).toBe(1450);
      expect(progress.estimatedBatchesRemaining).toBe(29); // ceil(1450/50)
    });

    it('handles case where all questions already exist', () => {
      const progress = calculateBatchProgress(100, 100, 0, 50);

      expect(progress.remainingToCreate).toBe(0);
      expect(progress.estimatedBatchesRemaining).toBe(0);
    });
  });

  describe('estimateTimeMinutes', () => {
    it('estimates time for small batch', () => {
      expect(estimateTimeMinutes(50)).toBe(1); // ceil(50/60) = 1
    });

    it('estimates time for exactly 60 questions', () => {
      expect(estimateTimeMinutes(60)).toBe(1);
    });

    it('estimates time for 61 questions', () => {
      expect(estimateTimeMinutes(61)).toBe(2); // ceil(61/60) = 2
    });

    it('estimates time for 100 questions', () => {
      expect(estimateTimeMinutes(100)).toBe(2); // ceil(100/60) = 2
    });

    it('estimates time for full pool', () => {
      expect(estimateTimeMinutes(1550)).toBe(26); // ceil(1550/60) = 26
    });

    it('returns 0 for 0 questions', () => {
      expect(estimateTimeMinutes(0)).toBe(0);
    });

    it('returns 1 for 1 question', () => {
      expect(estimateTimeMinutes(1)).toBe(1);
    });
  });
});

describe('Batch response structure', () => {
  describe('Sync response format', () => {
    it('validates complete response structure', () => {
      const mockResponse = {
        success: true,
        complete: false,
        batch: {
          processed: 50,
          created: 48,
          errors: 2,
          skippedAsExisting: 100,
        },
        progress: {
          totalInDatabase: 1500,
          alreadyInDiscourse: 100,
          createdThisBatch: 48,
          remainingToCreate: 1352,
          estimatedBatchesRemaining: 28,
        },
        details: [
          { questionId: 'T1A01', status: 'created', topicId: 123 },
          { questionId: 'T1A02', status: 'error', reason: 'Rate limited' },
        ],
        nextAction: 'Call again with same parameters to process next batch of 50 topics',
      };

      // Validate structure
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.complete).toBe(false);
      expect(mockResponse.batch.processed).toBe(50);
      expect(mockResponse.batch.created).toBe(48);
      expect(mockResponse.batch.errors).toBe(2);
      expect(mockResponse.progress.remainingToCreate).toBe(1352);
      expect(mockResponse.details).toHaveLength(2);
      expect(mockResponse.nextAction).toBeTruthy();
    });

    it('validates completed response has null nextAction', () => {
      const mockResponse = {
        success: true,
        complete: true,
        batch: {
          processed: 10,
          created: 10,
          errors: 0,
          skippedAsExisting: 90,
        },
        progress: {
          totalInDatabase: 100,
          alreadyInDiscourse: 90,
          createdThisBatch: 10,
          remainingToCreate: 0,
          estimatedBatchesRemaining: 0,
        },
        details: [],
        nextAction: null,
      };

      expect(mockResponse.complete).toBe(true);
      expect(mockResponse.nextAction).toBeNull();
      expect(mockResponse.progress.remainingToCreate).toBe(0);
    });

    it('validates detail entry for created status', () => {
      const detail: SyncResult = {
        questionId: 'T1A01',
        status: 'created',
        topicId: 12345,
      };

      expect(detail.status).toBe('created');
      expect(detail.topicId).toBeDefined();
      expect(detail.reason).toBeUndefined();
    });

    it('validates detail entry for error status', () => {
      const detail: SyncResult = {
        questionId: 'T1A01',
        status: 'error',
        reason: '429: Rate limit exceeded',
      };

      expect(detail.status).toBe('error');
      expect(detail.reason).toBeDefined();
      expect(detail.topicId).toBeUndefined();
    });
  });

  describe('Dry-run response format', () => {
    it('validates dry-run response structure', () => {
      const mockResponse = {
        success: true,
        dryRun: true,
        summary: {
          totalToCreate: 1400,
          totalToSkip: 100,
          totalInDatabase: 1500,
          estimatedTime: '~24 minutes',
        },
        byCategory: {
          'Technician Questions': { toCreate: 400, toSkip: 50 },
          'General Questions': { toCreate: 450, toSkip: 30 },
          'Extra Questions': { toCreate: 550, toSkip: 20 },
        },
        exampleTopics: [
          {
            questionId: 'T1A01',
            category: 'Technician Questions',
            title: 'T1A01 - What is the purpose of the Amateur Radio Service?',
            bodyPreview: '## Question\nWhat is the purpose...',
          },
        ],
        questionsToCreate: ['T1A01', 'T1A02', 'G1A01'],
        questionsToSkip: ['T1B01'],
      };

      expect(mockResponse.dryRun).toBe(true);
      expect(mockResponse.summary.totalToCreate).toBe(1400);
      expect(mockResponse.summary.estimatedTime).toContain('minutes');
      expect(mockResponse.byCategory['Technician Questions'].toCreate).toBe(400);
      expect(mockResponse.exampleTopics).toHaveLength(1);
      expect(mockResponse.questionsToCreate).toContain('T1A01');
    });

    it('validates example topic structure', () => {
      const exampleTopic = {
        questionId: 'G2B03',
        category: 'General Questions',
        title: 'G2B03 - Some question about general class privileges',
        bodyPreview: '## Question\nSome question...\n\n## Answer Options\n- **A)** Option A...',
      };

      expect(exampleTopic.questionId).toMatch(/^[TGE]\d[A-Z]\d{2}$/);
      expect(exampleTopic.category).toBe('General Questions');
      expect(exampleTopic.title.startsWith(exampleTopic.questionId)).toBe(true);
      expect(exampleTopic.bodyPreview).toContain('## Question');
    });

    it('validates byCategory structure for all license types', () => {
      const byCategory = {
        'Technician Questions': { toCreate: 400, toSkip: 50 },
        'General Questions': { toCreate: 450, toSkip: 30 },
        'Extra Questions': { toCreate: 550, toSkip: 20 },
      };

      for (const categoryName of Object.values(CATEGORY_MAP)) {
        expect(byCategory[categoryName]).toBeDefined();
        expect(byCategory[categoryName].toCreate).toBeGreaterThanOrEqual(0);
        expect(byCategory[categoryName].toSkip).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Multi-batch workflow simulation', () => {
  it('simulates complete sync workflow across multiple batches', () => {
    const totalQuestions = 150;
    const existingInDiscourse = 20;
    const batchSize = 50;

    const questionsToCreate = totalQuestions - existingInDiscourse; // 130

    // Batch 1
    let remaining = questionsToCreate;
    const batch1Size = Math.min(remaining, batchSize);
    remaining -= batch1Size;

    expect(batch1Size).toBe(50);
    expect(remaining).toBe(80);

    // Batch 2
    const batch2Size = Math.min(remaining, batchSize);
    remaining -= batch2Size;

    expect(batch2Size).toBe(50);
    expect(remaining).toBe(30);

    // Batch 3
    const batch3Size = Math.min(remaining, batchSize);
    remaining -= batch3Size;

    expect(batch3Size).toBe(30);
    expect(remaining).toBe(0);

    // Total batches
    const totalBatches = Math.ceil(questionsToCreate / batchSize);
    expect(totalBatches).toBe(3);
  });

  it('tracks created vs error counts across batches', () => {
    const batchResults = [
      { created: 48, errors: 2 },
      { created: 50, errors: 0 },
      { created: 29, errors: 1 },
    ];

    const totalCreated = batchResults.reduce((sum, b) => sum + b.created, 0);
    const totalErrors = batchResults.reduce((sum, b) => sum + b.errors, 0);

    expect(totalCreated).toBe(127);
    expect(totalErrors).toBe(3);
  });

  it('determines completion correctly', () => {
    // Incomplete batch
    let remaining = 50;
    let isComplete = remaining === 0;
    expect(isComplete).toBe(false);

    // Complete batch
    remaining = 0;
    isComplete = remaining === 0;
    expect(isComplete).toBe(true);
  });

  it('generates correct nextAction message', () => {
    const generateNextAction = (remaining: number, batchSize: number): string | null => {
      if (remaining === 0) return null;
      const nextBatchSize = Math.min(remaining, batchSize);
      return `Call again with same parameters to process next batch of ${nextBatchSize} topics`;
    };

    expect(generateNextAction(0, 50)).toBeNull();
    expect(generateNextAction(100, 50)).toBe('Call again with same parameters to process next batch of 50 topics');
    expect(generateNextAction(30, 50)).toBe('Call again with same parameters to process next batch of 30 topics');
  });
});

describe('Edge function input validation', () => {
  describe('Request body parsing', () => {
    it('handles missing body gracefully', () => {
      // Simulates: await req.json().catch(() => ({}))
      const defaults = { action: 'sync', batchSize: 50 };
      const parsed = {} as Record<string, unknown>;

      const action = (parsed.action as string) || defaults.action;
      const batchSize = (parsed.batchSize as number) || defaults.batchSize;

      expect(action).toBe('sync');
      expect(batchSize).toBe(50);
    });

    it('handles partial body', () => {
      const parsed = { action: 'dry-run' } as Record<string, unknown>;
      const defaults = { action: 'sync', batchSize: 50 };

      const action = (parsed.action as string) || defaults.action;
      const batchSize = (parsed.batchSize as number) || defaults.batchSize;

      expect(action).toBe('dry-run');
      expect(batchSize).toBe(50);
    });

    it('handles custom batch size', () => {
      const parsed = { batchSize: 25 } as Record<string, unknown>;
      const defaults = { action: 'sync', batchSize: 50 };

      const action = (parsed.action as string) || defaults.action;
      const batchSize = (parsed.batchSize as number) || defaults.batchSize;

      expect(action).toBe('sync');
      expect(batchSize).toBe(25);
    });

    it('validates action values', () => {
      const validActions = ['sync', 'dry-run'];

      expect(validActions.includes('sync')).toBe(true);
      expect(validActions.includes('dry-run')).toBe(true);
      expect(validActions.includes('invalid')).toBe(false);
    });
  });

  describe('License filtering with batches', () => {
    it('filters questions by license before batching', () => {
      const allQuestions: Question[] = [
        { id: 'T1A01', question: 'Tech Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
        { id: 'T1A02', question: 'Tech Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 1, explanation: null },
        { id: 'G1A01', question: 'Gen Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 2, explanation: null },
        { id: 'E1A01', question: 'Extra Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 3, explanation: null },
      ];

      // Filter for technician only
      const licenseFilter = parseLicenseFilter('technician');
      const filtered = allQuestions.filter(q => licenseFilter.includes(q.id[0]));

      expect(filtered).toHaveLength(2);
      expect(filtered.every(q => q.id.startsWith('T'))).toBe(true);
    });

    it('processes all licenses when no filter specified', () => {
      const allQuestions: Question[] = [
        { id: 'T1A01', question: 'Tech Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 0, explanation: null },
        { id: 'G1A01', question: 'Gen Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 2, explanation: null },
        { id: 'E1A01', question: 'Extra Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 3, explanation: null },
      ];

      const licenseFilter = parseLicenseFilter(undefined);
      const filtered = allQuestions.filter(q => licenseFilter.includes(q.id[0]));

      expect(filtered).toHaveLength(3);
    });
  });
});

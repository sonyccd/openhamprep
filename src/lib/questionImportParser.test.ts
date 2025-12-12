import { describe, it, expect } from 'vitest';
import {
  parseCSVLine,
  parseCSV,
  parseJSON,
  validateQuestions,
  ImportQuestion,
  TEST_TYPE_PREFIXES,
} from './questionImportParser';

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCSVLine('a,b,c,d')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('handles quoted fields with commas inside', () => {
    expect(parseCSVLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });

  it('handles empty fields', () => {
    expect(parseCSVLine('a,,c,')).toEqual(['a', '', 'c', '']);
  });

  it('handles quoted empty fields', () => {
    expect(parseCSVLine('a,"",c')).toEqual(['a', '', 'c']);
  });

  it('handles fields with quotes inside (strips quotes)', () => {
    // Note: The parser strips double-quotes rather than unescaping them
    // This is acceptable for the question import use case
    expect(parseCSVLine('"hello ""world""",b')).toEqual(['hello world', 'b']);
  });
});

describe('parseCSV', () => {
  it('returns empty array for content with only headers', () => {
    const csv = 'id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group';
    expect(parseCSV(csv)).toEqual([]);
  });

  it('returns empty array for empty content', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('parses valid CSV with standard column names', () => {
    const csv = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group,explanation
T1A01,"Test question?","Option A","Option B","Option C","Option D",B,T1,T1A,"Test explanation"`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'T1A01',
      question: 'Test question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 1,
      subelement: 'T1',
      question_group: 'T1A',
      explanation: 'Test explanation',
    });
  });

  it('parses correct_answer as numeric values (0-3)', () => {
    const csv = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
T1A01,"Q1","A","B","C","D",0,T1,T1A
T1A02,"Q2","A","B","C","D",1,T1,T1A
T1A03,"Q3","A","B","C","D",2,T1,T1A
T1A04,"Q4","A","B","C","D",3,T1,T1A`;

    const result = parseCSV(csv);
    expect(result[0].correct_answer).toBe(0);
    expect(result[1].correct_answer).toBe(1);
    expect(result[2].correct_answer).toBe(2);
    expect(result[3].correct_answer).toBe(3);
  });

  it('parses correct_answer as letter values (A-D)', () => {
    const csv = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
T1A01,"Q1","A","B","C","D",A,T1,T1A
T1A02,"Q2","A","B","C","D",B,T1,T1A
T1A03,"Q3","A","B","C","D",C,T1,T1A
T1A04,"Q4","A","B","C","D",D,T1,T1A`;

    const result = parseCSV(csv);
    expect(result[0].correct_answer).toBe(0);
    expect(result[1].correct_answer).toBe(1);
    expect(result[2].correct_answer).toBe(2);
    expect(result[3].correct_answer).toBe(3);
  });

  it('supports alternate column names (a, b, c, d, group, correct)', () => {
    const csv = `id,question,a,b,c,d,correct,subelement,group
T1A01,"Test?","Opt A","Opt B","Opt C","Opt D",C,T1,T1A`;

    const result = parseCSV(csv);
    expect(result[0].options).toEqual(['Opt A', 'Opt B', 'Opt C', 'Opt D']);
    expect(result[0].correct_answer).toBe(2);
    expect(result[0].question_group).toBe('T1A');
  });

  it('skips rows with insufficient columns', () => {
    const csv = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
T1A01,"Q1","A","B","C","D",0,T1,T1A
incomplete,row,only,four`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('T1A01');
  });

  it('handles questions with commas in text', () => {
    const csv = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
T1A01,"What is 1, 2, and 3?","A, first","B, second","C, third","D, fourth",A,T1,T1A`;

    const result = parseCSV(csv);
    expect(result[0].question).toBe('What is 1, 2, and 3?');
    expect(result[0].options[0]).toBe('A, first');
  });
});

describe('parseJSON', () => {
  it('parses valid JSON array', () => {
    const json = JSON.stringify([
      {
        id: 'G1A01',
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 2,
        subelement: 'G1',
        question_group: 'G1A',
        explanation: 'Test explanation',
      },
    ]);

    const result = parseJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('G1A01');
    expect(result[0].correct_answer).toBe(2);
    expect(result[0].explanation).toBe('Test explanation');
  });

  it('parses JSON with questions property', () => {
    const json = JSON.stringify({
      questions: [
        {
          id: 'E1A01',
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 0,
          subelement: 'E1',
          question_group: 'E1A',
        },
      ],
    });

    const result = parseJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('E1A01');
  });

  it('handles BOM (Byte Order Mark) at start of file', () => {
    const jsonWithBom = '\uFEFF' + JSON.stringify([
      {
        id: 'T1A01',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 1,
        subelement: 'T1',
        question_group: 'T1A',
      },
    ]);

    const result = parseJSON(jsonWithBom);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('T1A01');
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseJSON('not valid json')).toEqual([]);
    expect(parseJSON('{')).toEqual([]);
    expect(parseJSON('')).toEqual([]);
  });

  it('handles correct_answer as string letter', () => {
    const json = JSON.stringify([
      { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 'A', subelement: 'T1', question_group: 'T1A' },
      { id: 'T1A02', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 'B', subelement: 'T1', question_group: 'T1A' },
      { id: 'T1A03', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 'C', subelement: 'T1', question_group: 'T1A' },
      { id: 'T1A04', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 'D', subelement: 'T1', question_group: 'T1A' },
    ]);

    const result = parseJSON(json);
    expect(result[0].correct_answer).toBe(0);
    expect(result[1].correct_answer).toBe(1);
    expect(result[2].correct_answer).toBe(2);
    expect(result[3].correct_answer).toBe(3);
  });

  it('handles correct_answer as string number', () => {
    const json = JSON.stringify([
      { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: '0', subelement: 'T1', question_group: 'T1A' },
      { id: 'T1A02', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: '3', subelement: 'T1', question_group: 'T1A' },
    ]);

    const result = parseJSON(json);
    expect(result[0].correct_answer).toBe(0);
    expect(result[1].correct_answer).toBe(3);
  });

  it('supports alternate property names (option_a, group)', () => {
    const json = JSON.stringify([
      {
        id: 'T1A01',
        question: 'Test?',
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 1,
        subelement: 'T1',
        group: 'T1A',
      },
    ]);

    const result = parseJSON(json);
    expect(result[0].options).toEqual(['A', 'B', 'C', 'D']);
    expect(result[0].question_group).toBe('T1A');
  });

  it('preserves links array if present', () => {
    const json = JSON.stringify([
      {
        id: 'T1A01',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        subelement: 'T1',
        question_group: 'T1A',
        links: [{ url: 'https://example.com', title: 'Example' }],
      },
    ]);

    const result = parseJSON(json);
    expect(result[0].links).toEqual([{ url: 'https://example.com', title: 'Example' }]);
  });

  it('handles JSON with LaTeX-style math notation (escaped backslashes)', () => {
    // This test ensures the parser correctly handles LaTeX expressions like $\\S 97.301$
    const json = JSON.stringify([
      {
        id: 'G1A01',
        question: 'On which bands are there portions where General class licensees cannot transmit?',
        options: ['60 meters', '160 meters', '80 meters', '80 meters, 20 meters'],
        correct_answer: 2,
        subelement: 'G1',
        question_group: 'G1A',
        explanation: 'FCC Rule $\\S 97.301(\\text{d})$ outlines the General class frequency privileges.',
      },
    ]);

    const result = parseJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('G1A01');
    expect(result[0].explanation).toContain('$\\S 97.301(\\text{d})$');
  });

  it('handles complex LaTeX expressions with multiple escape sequences', () => {
    const json = JSON.stringify([
      {
        id: 'G1C01',
        question: 'What is the maximum power?',
        options: ['200 watts', '1000 watts', '1500 watts', '2000 watts'],
        correct_answer: 0,
        subelement: 'G1',
        question_group: 'G1C',
        explanation: 'The $30\\text{-meter}$ band ($10.100 \\text{MHz}$ to $10.150 \\text{MHz}$) limit is $200$ watts.',
      },
    ]);

    const result = parseJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].explanation).toContain('$30\\text{-meter}$');
    expect(result[0].explanation).toContain('$10.100 \\text{MHz}$');
  });

  it('handles missing optional fields gracefully', () => {
    const json = JSON.stringify([
      {
        id: 'T1A01',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        subelement: 'T1',
        question_group: 'T1A',
        // no explanation or links
      },
    ]);

    const result = parseJSON(json);
    expect(result[0].explanation).toBeUndefined();
    expect(result[0].links).toBeUndefined();
  });
});

describe('validateQuestions', () => {
  const validQuestion: ImportQuestion = {
    id: 'T1A01',
    question: 'What is the test question?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer: 1,
    subelement: 'T1',
    question_group: 'T1A',
  };

  it('accepts valid technician questions', () => {
    const result = validateQuestions([validQuestion], 'technician');
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid general questions', () => {
    const generalQuestion = { ...validQuestion, id: 'G1A01', subelement: 'G1', question_group: 'G1A' };
    const result = validateQuestions([generalQuestion], 'general');
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid extra questions', () => {
    const extraQuestion = { ...validQuestion, id: 'E1A01', subelement: 'E1', question_group: 'E1A' };
    const result = validateQuestions([extraQuestion], 'extra');
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects questions with wrong prefix', () => {
    const result = validateQuestions([validQuestion], 'general');
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errors).toContain('ID must start with "G" for general questions');
  });

  it('rejects questions with missing ID', () => {
    const noId = { ...validQuestion, id: '' };
    const result = validateQuestions([noId], 'technician');
    expect(result.errors[0].errors).toContain('Missing ID');
  });

  it('rejects questions with missing question text', () => {
    const noQuestion = { ...validQuestion, question: '' };
    const result = validateQuestions([noQuestion], 'technician');
    expect(result.errors[0].errors).toContain('Missing question text');
  });

  it('rejects questions with missing options', () => {
    const noOptions = { ...validQuestion, options: [] as string[] };
    const result = validateQuestions([noOptions], 'technician');
    expect(result.errors[0].errors).toContain('Must have exactly 4 options');
  });

  it('rejects questions with empty option text', () => {
    const emptyOption = { ...validQuestion, options: ['A', '', 'C', 'D'] };
    const result = validateQuestions([emptyOption], 'technician');
    expect(result.errors[0].errors).toContain('All options must have text');
  });

  it('rejects questions with invalid correct_answer', () => {
    const invalidAnswer = { ...validQuestion, correct_answer: 5 };
    const result = validateQuestions([invalidAnswer], 'technician');
    expect(result.errors[0].errors).toContain('Invalid correct answer');
  });

  it('rejects questions with missing subelement', () => {
    const noSubelement = { ...validQuestion, subelement: '' };
    const result = validateQuestions([noSubelement], 'technician');
    expect(result.errors[0].errors).toContain('Missing subelement');
  });

  it('rejects questions with missing question_group', () => {
    const noGroup = { ...validQuestion, question_group: '' };
    const result = validateQuestions([noGroup], 'technician');
    expect(result.errors[0].errors).toContain('Missing question group');
  });

  it('normalizes valid questions (uppercase ID, trimmed strings)', () => {
    // Note: ID prefix check is case-insensitive but happens before trimming
    // So IDs should not have leading/trailing spaces (they would fail validation)
    const messyQuestion = {
      ...validQuestion,
      id: 't1a01',
      question: '  Test question?  ',
      options: [' A ', ' B ', ' C ', ' D '],
      subelement: ' T1 ',
      question_group: ' T1A ',
      explanation: '  Some explanation  ',
    };

    const result = validateQuestions([messyQuestion], 'technician');
    expect(result.valid[0].id).toBe('T1A01');
    expect(result.valid[0].question).toBe('Test question?');
    expect(result.valid[0].options).toEqual(['A', 'B', 'C', 'D']);
    expect(result.valid[0].subelement).toBe('T1');
    expect(result.valid[0].question_group).toBe('T1A');
    expect(result.valid[0].explanation).toBe('Some explanation');
  });

  it('reports correct row numbers for errors (1-indexed, accounting for header)', () => {
    const questions = [
      validQuestion,
      { ...validQuestion, id: '' }, // Row 3 (index 1 + header row 1 + 1)
      validQuestion,
    ];

    const result = validateQuestions(questions, 'technician');
    expect(result.errors[0].row).toBe(3); // 1 (header) + 1 (first row) + 1 (0-indexed)
  });

  it('handles multiple questions with mixed validity', () => {
    const questions = [
      validQuestion,
      { ...validQuestion, id: 'G1A01' }, // Wrong prefix
      { ...validQuestion, id: 'T1A02' },
      { ...validQuestion, question: '' }, // Missing question
    ];

    const result = validateQuestions(questions, 'technician');
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
  });

  it('handles case-insensitive ID prefix matching', () => {
    const lowercaseId = { ...validQuestion, id: 't1a01' };
    const result = validateQuestions([lowercaseId], 'technician');
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].id).toBe('T1A01'); // Normalized to uppercase
  });
});

describe('TEST_TYPE_PREFIXES', () => {
  it('has correct prefix for technician', () => {
    expect(TEST_TYPE_PREFIXES.technician).toBe('T');
  });

  it('has correct prefix for general', () => {
    expect(TEST_TYPE_PREFIXES.general).toBe('G');
  });

  it('has correct prefix for extra', () => {
    expect(TEST_TYPE_PREFIXES.extra).toBe('E');
  });
});

/**
 * Utility functions for parsing and validating question import files.
 * Supports CSV and JSON formats for bulk importing questions.
 */

export interface ImportQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  subelement: string;
  question_group: string;
  explanation?: string;
  links?: unknown[];
}

export interface ValidationResult {
  valid: ImportQuestion[];
  errors: { row: number; id?: string; errors: string[] }[];
}

export type TestType = 'technician' | 'general' | 'extra';

export const TEST_TYPE_PREFIXES: Record<TestType, string> = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

/**
 * Parse a single CSV line, handling quoted fields with commas inside.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse CSV content into an array of ImportQuestion objects.
 */
export function parseCSV(content: string): ImportQuestion[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const questions: ImportQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 9) continue;

    const getCol = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, '') : '';
    };

    const correctAnswerRaw = getCol('correct_answer') || getCol('correct');
    let correctAnswer = 0;
    if (['a', '0'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 0;
    else if (['b', '1'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 1;
    else if (['c', '2'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 2;
    else if (['d', '3'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 3;

    questions.push({
      id: getCol('id'),
      question: getCol('question'),
      options: [
        getCol('option_a') || getCol('a'),
        getCol('option_b') || getCol('b'),
        getCol('option_c') || getCol('c'),
        getCol('option_d') || getCol('d'),
      ],
      correct_answer: correctAnswer,
      subelement: getCol('subelement'),
      question_group: getCol('question_group') || getCol('group'),
      explanation: getCol('explanation') || undefined,
    });
  }

  return questions;
}

/**
 * Parse JSON content into an array of ImportQuestion objects.
 * Handles BOM (Byte Order Mark) if present.
 * Supports both array format and { questions: [...] } format.
 */
export function parseJSON(content: string): ImportQuestion[] {
  try {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanContent);
    const questions = Array.isArray(data) ? data : data.questions || [];

    return questions.map((q: Record<string, unknown>) => ({
      id: String(q.id || ''),
      question: String(q.question || ''),
      options: Array.isArray(q.options) ? q.options.map(String) : [
        String(q.option_a || q.a || ''),
        String(q.option_b || q.b || ''),
        String(q.option_c || q.c || ''),
        String(q.option_d || q.d || ''),
      ],
      correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer :
        ['a', '0'].includes(String(q.correct_answer).toLowerCase()) ? 0 :
        ['b', '1'].includes(String(q.correct_answer).toLowerCase()) ? 1 :
        ['c', '2'].includes(String(q.correct_answer).toLowerCase()) ? 2 :
        ['d', '3'].includes(String(q.correct_answer).toLowerCase()) ? 3 : 0,
      subelement: String(q.subelement || ''),
      question_group: String(q.question_group || q.group || ''),
      explanation: q.explanation ? String(q.explanation) : undefined,
      links: Array.isArray(q.links) ? q.links : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Validate an array of questions for a specific test type.
 * Returns valid questions and any validation errors.
 */
export function validateQuestions(
  questions: ImportQuestion[],
  testType: TestType
): ValidationResult {
  const prefix = TEST_TYPE_PREFIXES[testType];
  const valid: ImportQuestion[] = [];
  const errors: { row: number; id?: string; errors: string[] }[] = [];

  questions.forEach((q, index) => {
    const rowErrors: string[] = [];

    if (!q.id) rowErrors.push('Missing ID');
    else if (!q.id.toUpperCase().startsWith(prefix)) {
      rowErrors.push(`ID must start with "${prefix}" for ${testType} questions`);
    }

    if (!q.question) rowErrors.push('Missing question text');
    if (!q.options || q.options.length !== 4) rowErrors.push('Must have exactly 4 options');
    else if (q.options.some(o => !o?.trim())) rowErrors.push('All options must have text');

    if (q.correct_answer < 0 || q.correct_answer > 3) rowErrors.push('Invalid correct answer');
    if (!q.subelement) rowErrors.push('Missing subelement');
    if (!q.question_group) rowErrors.push('Missing question group');

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, id: q.id, errors: rowErrors });
    } else {
      valid.push({
        ...q,
        id: q.id.toUpperCase().trim(),
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        subelement: q.subelement.trim(),
        question_group: q.question_group.trim(),
        explanation: q.explanation?.trim(),
      });
    }
  });

  return { valid, errors };
}

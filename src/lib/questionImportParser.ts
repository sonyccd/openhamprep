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
  fcc_reference?: string;      // FCC Part 97 rule reference, e.g., "97.1", "97.3(a)(22)"
  figure_reference?: string;   // Figure reference for questions with diagrams, e.g., "T-1", "G7-1"
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
 * Heuristic message warning that numeric answer keys may be 1-based.
 *
 * Digits in `correct_answer` are interpreted as 0-based indices (0=A … 3=D).
 * A file whose numeric keys are all in 1–4 with no 0 may be 1-based, which
 * would import every answer shifted by one (and reject the "4" rows). This is
 * a heuristic, not a certainty — a genuinely 0-based file where no question
 * uses answer A would also trip it — hence a warning rather than a hard error.
 */
export const ONE_BASED_KEY_WARNING =
  'correct_answer values may be 1-based (all 1–4, no 0). This importer reads digits ' +
  'as 0-based (0=A, 1=B, 2=C, 3=D), so 1-based keys import shifted by one and "4" is ' +
  'rejected. Use letters A–D, or 0–3, to be unambiguous. ' +
  '(This warning can also fire for a 0-based file where no question uses answer A.)';

/**
 * Map a single correct_answer token to a 0-based index (0=A … 3=D).
 * Accepts letters A–D (any case) and digit strings 0–3. Returns -1 for empty
 * or unrecognized input, which downstream validation reports as an error.
 * Shared by the CSV, JSON, and NCVEC parsers so the three stay in lockstep.
 */
export function parseAnswerKey(raw: string): number {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'a' || v === '0') return 0;
  if (v === 'b' || v === '1') return 1;
  if (v === 'c' || v === '2') return 2;
  if (v === 'd' || v === '3') return 3;
  return -1;
}

function looksOneBased(rawAnswerValues: string[]): boolean {
  const present = rawAnswerValues.map(v => v.trim()).filter(v => v !== '');
  if (present.length === 0) return false;
  // Letter keys (A–D) are unambiguous; if the file uses any, it isn't 1-based.
  if (present.some(v => /^[A-Da-d]$/.test(v))) return false;
  const nums = present.filter(v => /^\d+$/.test(v)).map(Number);
  if (nums.length === 0) return false;
  return nums.every(n => n >= 1 && n <= 4);
}

/**
 * Parse CSV content into an array of ImportQuestion objects.
 *
 * Pass a `warnings` array to collect non-blocking advisories (e.g. answer keys
 * that look 1-based).
 */
export function parseCSV(content: string, warnings?: string[]): ImportQuestion[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const questions: ImportQuestion[] = [];
  const rawAnswers: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 9) continue;

    const getCol = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, '') : '';
    };

    const correctAnswerRaw = getCol('correct_answer') || getCol('correct');
    rawAnswers.push(correctAnswerRaw);
    const correctAnswer = parseAnswerKey(correctAnswerRaw); // -1 if unparseable; fails validation

    questions.push({
      id: getCol('id') || getCol('display_name'),
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

  if (warnings && looksOneBased(rawAnswers)) warnings.push(ONE_BASED_KEY_WARNING);

  return questions;
}

/**
 * Parse JSON content into an array of ImportQuestion objects.
 * Handles BOM (Byte Order Mark) if present.
 * Supports both array format and { questions: [...] } format.
 */
export function parseJSON(content: string, warnings?: string[]): ImportQuestion[] {
  try {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanContent);
    const questions = Array.isArray(data) ? data : data.questions || [];

    if (warnings) {
      const rawAnswers = questions.map((q: Record<string, unknown>) =>
        q.correct_answer === undefined || q.correct_answer === null ? '' : String(q.correct_answer)
      );
      if (looksOneBased(rawAnswers)) warnings.push(ONE_BASED_KEY_WARNING);
    }

    return questions.map((q: Record<string, unknown>) => ({
      id: String(q.id || ''),
      question: String(q.question || ''),
      options: Array.isArray(q.options) ? q.options.map(String) : [
        String(q.option_a || q.a || ''),
        String(q.option_b || q.b || ''),
        String(q.option_c || q.c || ''),
        String(q.option_d || q.d || ''),
      ],
      correct_answer: parseAnswerKey(q.correct_answer == null ? '' : String(q.correct_answer)),
      subelement: String(q.subelement || ''),
      question_group: String(q.question_group || q.group || ''),
      explanation: q.explanation ? String(q.explanation) : undefined,
      links: Array.isArray(q.links) ? q.links : undefined,
      fcc_reference: q.fcc_reference ? String(q.fcc_reference) : undefined,
      figure_reference: q.figure_reference ? String(q.figure_reference) : undefined,
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

    if (q.correct_answer === -1) rowErrors.push('Could not parse correct_answer — use A/B/C/D or 0/1/2/3');
    else if (q.correct_answer < 0 || q.correct_answer > 3) rowErrors.push('Invalid correct answer (must be 0–3)');
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

/**
 * Merge an incoming question over an existing one.
 * Options and correct_answer always come from the same source so they stay aligned.
 */
export function mergeQuestion(existing: ImportQuestion, incoming: ImportQuestion): ImportQuestion {
  const useIncomingOptions = incoming.options.every(o => o);
  return {
    id: existing.id,
    question: incoming.question || existing.question,
    options: useIncomingOptions ? incoming.options : existing.options,
    correct_answer: useIncomingOptions ? incoming.correct_answer : existing.correct_answer,
    subelement: incoming.subelement || existing.subelement,
    question_group: incoming.question_group || existing.question_group,
    explanation: existing.explanation || incoming.explanation,
    links: (existing.links && existing.links.length > 0) ? existing.links : incoming.links,
  };
}

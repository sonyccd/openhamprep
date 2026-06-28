/**
 * NCVEC Question Pool Parser
 *
 * Parses official NCVEC amateur radio question pool documents (.docx format)
 * into structured data for import into the database.
 *
 * Supports Technician, General, and Extra class question pools.
 */

import mammoth from 'mammoth';
import { ImportQuestion, parseAnswerKey } from './questionImportParser';

export interface SyllabusEntry {
  code: string;
  title: string;
  license_type: string;
  type: 'subelement' | 'group';
  exam_questions: number | null;
}

export interface NCVECParseResult {
  questions: ImportQuestion[];
  syllabus: SyllabusEntry[];
  warnings: string[];
}

/**
 * Extract plain text from a .docx file using mammoth
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract FCC reference from question header line
 * e.g., "T1A01 (C) [97.1]" -> "97.1"
 */
function extractFccReference(headerLine: string): string | null {
  const match = headerLine.match(/\[([^\]]+)\]/);
  return match ? match[1].trim() : null;
}

/**
 * Extract figure reference from question text
 * e.g., "(See Figure T-1)" -> "T-1"
 */
function extractFigureReference(text: string): string | null {
  const match = text.match(/\([Ss]ee\s+[Ff]igure\s+([TGE][-\d]+)\)/i);
  return match ? match[1].trim() : null;
}

/**
 * Parse syllabus entries from the document text
 */
function parseSyllabus(text: string): SyllabusEntry[] {
  const entries: SyllabusEntry[] = [];
  const lines = text.split('\n');

  // Pattern for subelement headers: "SUBELEMENT T1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]"
  // Capture groups:
  //   [1] = Subelement code (e.g., "T1", "G2", "E3")
  //   [2] = Title/description text
  //   [3] = Number of exam questions
  const subelementPattern = /^SUBELEMENT\s+([TGE]\d+)\s*[–-]\s*(.+?)\s*-?\s*\[(\d+)\s*Exam Questions?/i;

  // Pattern for group headers: "T1A - Purpose and permissible use..."
  // Supports both regular hyphen (-) and en-dash (–)
  // Capture groups:
  //   [1] = Group code (e.g., "T1A", "G2B", "E3C")
  //   [2] = Group description text
  const groupPattern = /^([TGE]\d[A-Z])\s*[–-]\s*(.+)/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for subelement
    const subelementMatch = trimmedLine.match(subelementPattern);
    if (subelementMatch) {
      const code = subelementMatch[1].toUpperCase();
      entries.push({
        code,
        title: subelementMatch[2].trim(),
        license_type: code.charAt(0),
        type: 'subelement',
        exam_questions: parseInt(subelementMatch[3], 10),
      });
      continue;
    }

    // Check for group (but not if it looks like a question ID with answer)
    const groupMatch = trimmedLine.match(groupPattern);
    if (groupMatch && !trimmedLine.match(/^[TGE]\d[A-Z]\d{2}/)) {
      const code = groupMatch[1].toUpperCase();
      entries.push({
        code,
        title: groupMatch[2].trim(),
        license_type: code.charAt(0),
        type: 'group',
        exam_questions: null,
      });
    }
  }

  return entries;
}

// Question header, capturing [1] ID, [2] answer letter, [3] optional FCC ref:
// "T1A01 (C) [97.1]". Whitespace inside the parentheses is tolerated because
// hand-edited pools sometimes pad them (e.g. "T1A01 ( C )").
const HEADER_PATTERN = /^([TGE]\d[A-Z]\d{2})\s*\(\s*([A-D])\s*\)\s*(?:\[([^\]]+)\])?/i;

// Anchored variant used only to decide whether a line *is* a question header
// when splitting a block into questions. The whole line must be a header — ID,
// answer key, and an optional FCC ref — with nothing after it, so a stem line
// that merely starts like a header (e.g. quoting "T1A01 (A) ...") is not
// miscounted as a second question. Strict anchoring is safe because NCVEC
// header lines contain only that. Tradeoff: a header line with trailing
// garbage beyond the FCC ref would not be detected here and its question would
// be dropped — but we can't loosen this without re-admitting the stem-quote
// false positive above (the two cases are indistinguishable).
const HEADER_LINE_PATTERN = /^[TGE]\d[A-Z]\d{2}\s*\(\s*[A-D]\s*\)\s*(?:\[[^\]]+\])?\s*$/i;

// Looser still — a question ID immediately followed by "(" — used only to warn
// when a header-shaped line was skipped (e.g. a trailing footnote marker, or a
// typo'd answer key like "T1A01 (X)" that the stricter patterns reject). It
// stays quiet on syllabus lines ("T1A - ...") since those have no "(" after a
// two-digit number.
const HEADER_LIKE_PATTERN = /^[TGE]\d[A-Z]\d{2}\s*\(/i;

// Answer option "A. text", capturing [1] letter and [2] text. Case-sensitive
// on purpose: option letters are uppercase in the official pools, and matching
// lowercase would let a wrapped stem line beginning with "a."/"b."/"c."/"d."
// be misread as the start of the options.
const OPTION_PATTERN = /^([A-D])\.\s*(.+)/;

/**
 * Parse a single question from the lines of one question segment.
 * The segment's first line is the header; the remainder is question text
 * followed by the answer options.
 *
 * Returns null (and pushes a warning) if the segment has no question text.
 */
function parseQuestionSegment(lines: string[], warnings: string[]): ImportQuestion | null {
  const headerMatch = lines[0].match(HEADER_PATTERN);
  if (!headerMatch) return null;

  const questionId = headerMatch[1].toUpperCase();
  const correctAnswerLetter = headerMatch[2].toUpperCase();
  const fccReference = headerMatch[3] ? headerMatch[3].trim() : null;

  // Extract subelement and question group from ID
  // T1A01 -> subelement: T1, group: T1A
  const subelement = questionId.substring(0, 2); // T1, G2, E3, etc.
  const questionGroup = questionId.substring(0, 3); // T1A, G2B, etc.

  // Collect question text (lines after header until we hit options)
  const questionLines: string[] = [];
  let optionsStartIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (OPTION_PATTERN.test(lines[i])) {
      optionsStartIndex = i;
      break;
    }
    questionLines.push(lines[i]);
  }

  const questionText = questionLines.join(' ').trim();

  if (!questionText) {
    warnings.push(`Question ${questionId}: Missing question text`);
    return null;
  }

  // Extract figure reference from question text
  const figureReference = extractFigureReference(questionText);

  // Collect options. Each "A."–"D." line starts an option; any following line
  // that is not itself an option is a continuation of the previous option
  // (wrapped answer text), so it is appended rather than silently dropped.
  const options: string[] = ['', '', '', ''];
  let lastOptionIndex = -1;

  if (optionsStartIndex !== -1) {
    for (let i = optionsStartIndex; i < lines.length; i++) {
      const optionMatch = lines[i].match(OPTION_PATTERN);
      const idx = optionMatch ? parseAnswerKey(optionMatch[1]) : -1;
      // An option-shaped line starts a NEW option only if that slot is still
      // empty. A repeat letter (e.g. option B wrapping onto a line that begins
      // "A. ...") is a continuation, not a real second option A — NCVEC options
      // never repeat a letter. The idx >= 0 check also keeps a future, wider
      // OPTION_PATTERN from writing to options[-1].
      if (optionMatch && idx >= 0 && !options[idx]) {
        lastOptionIndex = idx;
        options[idx] = optionMatch[2].trim();
      } else if (lastOptionIndex !== -1) {
        options[lastOptionIndex] = `${options[lastOptionIndex]} ${lines[i]}`.trim();
      }
    }
  }

  // Validate we have all 4 options. Drop the question (don't return it with
  // empty slots) so it's reported once here, not a second time as a downstream
  // "All options must have text" validation error.
  const missingOptions = options.map((o, i) => o ? null : ['A', 'B', 'C', 'D'][i]).filter(Boolean);
  if (missingOptions.length > 0) {
    warnings.push(`Question ${questionId}: Missing options ${missingOptions.join(', ')}`);
    return null;
  }

  return {
    id: questionId,
    question: questionText,
    options,
    correct_answer: parseAnswerKey(correctAnswerLetter),
    subelement,
    question_group: questionGroup,
    fcc_reference: fccReference || undefined,
    figure_reference: figureReference || undefined,
  };
}

/**
 * Parse questions from the document text
 */
function parseQuestions(text: string): { questions: ImportQuestion[]; warnings: string[] } {
  const questions: ImportQuestion[] = [];
  const warnings: string[] = [];

  // Split by the ~~ delimiter to get individual question blocks
  const blocks = text.split(/~~+/);

  // Track seen question IDs to detect duplicates
  const seenIds = new Set<string>();

  const addQuestion = (q: ImportQuestion) => {
    // Check for duplicate question IDs — keep only the last occurrence
    if (seenIds.has(q.id)) {
      warnings.push(`Question ${q.id}: Duplicate ID found, only last occurrence will be used`);
      const prevIndex = questions.findIndex(existing => existing.id === q.id);
      if (prevIndex !== -1) {
        questions.splice(prevIndex, 1);
      }
    }
    seenIds.add(q.id);
    questions.push(q);
  };

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;

    // Find every question header in the block. A well-formed block has exactly
    // one. More than one means a "~~" delimiter is missing between questions —
    // we still parse each one rather than letting the later question's options
    // silently overwrite the earlier question's answers.
    const headerIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (HEADER_LINE_PATTERN.test(lines[i])) headerIndices.push(i);
    }

    if (headerIndices.length === 0) {
      // No strict header, but a line looks like one — e.g. a real header with
      // trailing junk past the FCC ref, or a typo'd answer key. Warn instead of
      // dropping the question silently. (Syllabus lines don't match, so this
      // doesn't fire on them.)
      const looksLikeHeader = lines.find(l => HEADER_LIKE_PATTERN.test(l));
      if (looksLikeHeader) {
        warnings.push(`Skipped a line that looks like a question header but isn't formatted as one: "${looksLikeHeader}"`);
      }
      continue;
    }

    if (headerIndices.length > 1) {
      const ids = headerIndices.map(i => lines[i].match(HEADER_PATTERN)?.[1].toUpperCase());
      warnings.push(
        `Missing "~~" delimiter: ${headerIndices.length} questions (${ids.join(', ')}) ` +
        `found in one block. Parsed them separately.`
      );
    }

    // Each header starts a segment that runs until the next header (or the end
    // of the block).
    for (let h = 0; h < headerIndices.length; h++) {
      const start = headerIndices[h];
      const end = h + 1 < headerIndices.length ? headerIndices[h + 1] : lines.length;
      const parsed = parseQuestionSegment(lines.slice(start, end), warnings);
      if (parsed) addQuestion(parsed);
    }
  }

  return { questions, warnings };
}

/**
 * Main entry point: Parse an NCVEC question pool document
 */
export async function parseNCVECDocument(file: File): Promise<NCVECParseResult> {
  // Extract text from the .docx file
  const text = await extractTextFromDocx(file);

  // Parse syllabus information
  const syllabus = parseSyllabus(text);

  // Parse questions
  const { questions, warnings } = parseQuestions(text);

  // Add summary warning if no questions found
  if (questions.length === 0) {
    warnings.unshift('No questions found in document. Ensure the document follows NCVEC format with ~~ delimiters.');
  }

  return {
    questions,
    syllabus,
    warnings,
  };
}

/**
 * Parse NCVEC document from raw text (useful for testing)
 */
export function parseNCVECText(text: string): NCVECParseResult {
  const syllabus = parseSyllabus(text);
  const { questions, warnings } = parseQuestions(text);

  if (questions.length === 0) {
    warnings.unshift('No questions found in text. Ensure the text follows NCVEC format with ~~ delimiters.');
  }

  return {
    questions,
    syllabus,
    warnings,
  };
}

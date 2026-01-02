/**
 * NCVEC Question Pool Parser
 *
 * Parses official NCVEC amateur radio question pool documents (.docx format)
 * into structured data for import into the database.
 *
 * Supports Technician, General, and Extra class question pools.
 */

import mammoth from 'mammoth';
import { ImportQuestion } from './questionImportParser';

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
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Convert answer letter (A, B, C, D) to 0-indexed number
 */
function convertAnswerToIndex(letter: string): number {
  const map: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  return map[letter.toUpperCase()] ?? 0;
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
 * Detect license type from question ID prefix
 */
function detectLicenseType(questionId: string): string {
  const prefix = questionId.charAt(0).toUpperCase();
  return prefix; // T, G, or E
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

/**
 * Parse questions from the document text
 */
function parseQuestions(text: string): { questions: ImportQuestion[]; warnings: string[] } {
  const questions: ImportQuestion[] = [];
  const warnings: string[] = [];

  // Split by the ~~ delimiter to get individual question blocks
  const blocks = text.split(/~~+/);

  // Pattern for question header: "T1A01 (C) [97.1]" or "T1A01 (C)"
  // Uses 'i' flag for case-insensitive matching of question IDs and answer letters
  // Capture groups:
  //   [1] = Question ID (e.g., "T1A01", "G2B03", "E3C12")
  //   [2] = Correct answer letter (A, B, C, or D)
  //   [3] = Optional FCC reference (e.g., "97.1", "97.3(a)(22)")
  const headerPattern = /^([TGE]\d[A-Z]\d{2})\s*\(([A-D])\)\s*(?:\[([^\]]+)\])?/i;

  // Pattern for answer options: "A. Answer text here"
  // Capture groups:
  //   [1] = Option letter (A, B, C, or D)
  //   [2] = Option text
  const optionPattern = /^([A-D])\.\s*(.+)/;

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;

    // Find the header line (contains question ID and correct answer)
    let headerLineIndex = -1;
    let headerMatch: RegExpMatchArray | null = null;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(headerPattern);
      if (match) {
        headerLineIndex = i;
        headerMatch = match;
        break;
      }
    }

    if (!headerMatch || headerLineIndex === -1) {
      // Not a question block, skip
      continue;
    }

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

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      if (lines[i].match(optionPattern)) {
        optionsStartIndex = i;
        break;
      }
      questionLines.push(lines[i]);
    }

    const questionText = questionLines.join(' ').trim();

    if (!questionText) {
      warnings.push(`Question ${questionId}: Missing question text`);
      continue;
    }

    // Extract figure reference from question text
    const figureReference = extractFigureReference(questionText);

    // Collect options
    const options: string[] = ['', '', '', ''];

    if (optionsStartIndex !== -1) {
      for (let i = optionsStartIndex; i < lines.length; i++) {
        const optionMatch = lines[i].match(optionPattern);
        if (optionMatch) {
          const optionLetter = optionMatch[1].toUpperCase();
          const optionText = optionMatch[2].trim();
          const optionIndex = convertAnswerToIndex(optionLetter);
          options[optionIndex] = optionText;
        }
      }
    }

    // Validate we have all 4 options
    const missingOptions = options.map((o, i) => o ? null : ['A', 'B', 'C', 'D'][i]).filter(Boolean);
    if (missingOptions.length > 0) {
      warnings.push(`Question ${questionId}: Missing options ${missingOptions.join(', ')}`);
    }

    questions.push({
      id: questionId,
      question: questionText,
      options,
      correct_answer: convertAnswerToIndex(correctAnswerLetter),
      subelement,
      question_group: questionGroup,
      fcc_reference: fccReference || undefined,
      figure_reference: figureReference || undefined,
    });
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

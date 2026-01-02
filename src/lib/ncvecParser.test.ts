import { describe, it, expect } from 'vitest';
import { parseNCVECText } from './ncvecParser';

// =============================================================================
// SAMPLE TEST DATA
// =============================================================================

const sampleNCVECText = `
SUBELEMENT T1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]

T1A - Purpose and permissible use of the Amateur Radio Service; Operator/primary station license grant; Meanings of basic terms used in FCC rules; Interference; RACES rules; Phonetics; Frequency Coordinator

T1A01 (C) [97.1]
Which of the following is part of the Basis and Purpose of the Amateur Radio Service?
A. Providing personal radio communications for as many citizens as possible
B. Providing communications for international non-profit organizations
C. Advancing skills in the technical and communication phases of the radio art
D. All these choices are correct
~~

T1A02 (C) [97.1]
Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?
A. FEMA
B. Homeland Security
C. The FCC
D. All these choices are correct
~~

T1A03 (B) [97.119(b)(2)]
What do the FCC rules state regarding the use of a phonetic alphabet for station identification in the Amateur Radio Service?
A. It is required when transmitting emergency messages
B. It is encouraged
C. It is required when in contact with foreign stations
D. All these choices are correct
~~
`;

const generalExamText = `
SUBELEMENT G1 – COMMISSION'S RULES - [5 Exam Questions - 5 Groups]

G1A - General class control operator frequency privileges; Primary and secondary allocations

G1A01 (A) [97.301(d)]
On which HF band segments may a General class licensee transmit SSB phone?
A. Only the band segments authorized for General class operators
B. Only the band segments authorized for Technician class operators
C. On any HF band segment
D. Technician band segments plus 30 meters
~~

G1A02 (B) [97.305]
On which amateur frequencies in the 10 meter band are General class licensees permitted to transmit CW?
A. 28.000 - 28.500 MHz
B. 28.000 - 28.300 MHz
C. 28.100 - 28.190 MHz
D. 28.000 - 29.700 MHz
~~
`;

const extraExamText = `
SUBELEMENT E1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]

E1A - Operating standards: frequency privileges for Extra Class; emission standards; automatic message forwarding

E1A01 (D) [97.301, 97.305]
Which of the following additional frequency segments are available to an Amateur Extra class operator?
A. 2400 - 2410 MHz
B. 5.66 - 5.92 MHz
C. 75 - 76 GHz
D. 3.5 - 3.6 MHz
~~
`;

const questionWithFigure = `
T7C01 (A) [97.xxx]
What component is shown in this schematic (See Figure T-1)?
A. Resistor
B. Transistor
C. Battery
D. Connector
~~
`;

const questionWithoutFccRef = `
T5A01 (B)
Electrical current is measured in which of the following units?
A. Volts
B. Amperes
C. Watts
D. Ohms
~~
`;

const multiLineQuestion = `
T1B01 (C) [97.301(e)]
Which of the following frequency ranges are available for phone operation by Technician licensees?
A. 28.050 MHz to 28.150 MHz
B. 28.100 MHz to 28.300 MHz
C. 28.300 MHz to 28.500 MHz
D. 28.500 MHz to 28.600 MHz
~~
`;

const complexSyllabusText = `
SUBELEMENT T1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]  67 Questions

T1A - Purpose and permissible use of the Amateur Radio Service; Operator/primary station license grant; Meanings of basic terms used in FCC rules; Interference; RACES rules; Phonetics; Frequency Coordinator

T1B - Frequency allocations; Emission modes; Spectrum sharing; Transmissions near band edges; Contacting the International Space Station; Power output

SUBELEMENT T2 - OPERATING PROCEDURES - [3 Exam Questions - 3 Groups]  36 Questions

T2A - Station operation: choosing an operating frequency, calling another station, test transmissions; Band plans: calling frequencies, repeater offsets

T2B – VHF/UHF operating practices: FM repeater, simplex, reverse splits; Access tones: CTCSS, DTMF; DMR operation; Resolving operational problems; Q signals
`;

// =============================================================================
// BASIC PARSING TESTS
// =============================================================================

describe('ncvecParser', () => {
  describe('parseNCVECText - basic functionality', () => {
    it('should parse questions from NCVEC text', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return empty arrays for empty input', () => {
      const result = parseNCVECText('');

      expect(result.questions).toHaveLength(0);
      expect(result.syllabus).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0); // Should warn about no questions
    });

    it('should return empty arrays for input without questions', () => {
      const result = parseNCVECText('Just some random text without any questions.');

      expect(result.questions).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle input with only whitespace', () => {
      const result = parseNCVECText('   \n\n\t\t   \n');

      expect(result.questions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // QUESTION ID PARSING TESTS
  // ===========================================================================

  describe('question ID parsing', () => {
    it('should correctly parse Technician question IDs', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].id).toBe('T1A01');
      expect(result.questions[1].id).toBe('T1A02');
      expect(result.questions[2].id).toBe('T1A03');
    });

    it('should correctly parse General question IDs', () => {
      const result = parseNCVECText(generalExamText);

      expect(result.questions[0].id).toBe('G1A01');
      expect(result.questions[1].id).toBe('G1A02');
    });

    it('should correctly parse Extra question IDs', () => {
      const result = parseNCVECText(extraExamText);

      expect(result.questions[0].id).toBe('E1A01');
    });

    it('should uppercase question IDs', () => {
      const lowercaseText = `
t1a01 (C) [97.1]
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(lowercaseText);

      expect(result.questions[0].id).toBe('T1A01');
    });

    it('should handle various question ID formats', () => {
      const variousIds = `
T1A01 (A)
Question 1?
A. A
B. B
C. C
D. D
~~
T9B12 (B)
Question 2?
A. A
B. B
C. C
D. D
~~
T0C03 (C)
Question 3?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(variousIds);

      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].id).toBe('T1A01');
      expect(result.questions[1].id).toBe('T9B12');
      expect(result.questions[2].id).toBe('T0C03');
    });
  });

  // ===========================================================================
  // CORRECT ANSWER PARSING TESTS
  // ===========================================================================

  describe('correct answer parsing', () => {
    it('should correctly parse answer A (index 0)', () => {
      const text = `
T1A01 (A)
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions[0].correct_answer).toBe(0);
    });

    it('should correctly parse answer B (index 1)', () => {
      const result = parseNCVECText(sampleNCVECText);
      expect(result.questions[2].correct_answer).toBe(1); // T1A03 has (B)
    });

    it('should correctly parse answer C (index 2)', () => {
      const result = parseNCVECText(sampleNCVECText);
      expect(result.questions[0].correct_answer).toBe(2); // T1A01 has (C)
      expect(result.questions[1].correct_answer).toBe(2); // T1A02 has (C)
    });

    it('should correctly parse answer D (index 3)', () => {
      const text = `
T1A01 (D)
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions[0].correct_answer).toBe(3);
    });

    it('should handle lowercase answer letters', () => {
      const text = `
T1A01 (c)
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions[0].correct_answer).toBe(2);
    });
  });

  // ===========================================================================
  // FCC REFERENCE PARSING TESTS
  // ===========================================================================

  describe('FCC reference parsing', () => {
    it('should correctly parse simple FCC references', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].fcc_reference).toBe('97.1');
      expect(result.questions[1].fcc_reference).toBe('97.1');
    });

    it('should correctly parse complex FCC references with subsections', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[2].fcc_reference).toBe('97.119(b)(2)');
    });

    it('should handle multiple FCC references in brackets', () => {
      const text = `
T1A01 (A) [97.301, 97.305]
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions[0].fcc_reference).toBe('97.301, 97.305');
    });

    it('should return undefined for questions without FCC references', () => {
      const result = parseNCVECText(questionWithoutFccRef);

      expect(result.questions[0].fcc_reference).toBeUndefined();
    });

    it('should handle FCC references with letters', () => {
      const text = `
T1A01 (A) [97.301(a-e)]
Test question?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions[0].fcc_reference).toBe('97.301(a-e)');
    });
  });

  // ===========================================================================
  // FIGURE REFERENCE PARSING TESTS
  // ===========================================================================

  describe('figure reference parsing', () => {
    it('should extract figure references from question text', () => {
      const result = parseNCVECText(questionWithFigure);

      expect(result.questions[0].figure_reference).toBe('T-1');
    });

    it('should handle various figure reference formats', () => {
      const figureTexts = [
        { text: 'What is shown in (See Figure T-1)?', expected: 'T-1' },
        { text: 'What is shown in (see figure G7-1)?', expected: 'G7-1' },
        { text: 'What is shown in (See figure E9-1)?', expected: 'E9-1' },
        { text: 'What is shown in (see Figure T-12)?', expected: 'T-12' },
      ];

      for (const { text, expected } of figureTexts) {
        const fullText = `
T1A01 (A)
${text}
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
        const result = parseNCVECText(fullText);
        expect(result.questions[0].figure_reference).toBe(expected);
      }
    });

    it('should return undefined for questions without figure references', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].figure_reference).toBeUndefined();
    });
  });

  // ===========================================================================
  // SUBELEMENT AND QUESTION GROUP PARSING TESTS
  // ===========================================================================

  describe('subelement and question group parsing', () => {
    it('should correctly extract subelement from question ID', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].subelement).toBe('T1');
      expect(result.questions[1].subelement).toBe('T1');
      expect(result.questions[2].subelement).toBe('T1');
    });

    it('should correctly extract question group from question ID', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].question_group).toBe('T1A');
      expect(result.questions[1].question_group).toBe('T1A');
      expect(result.questions[2].question_group).toBe('T1A');
    });

    it('should handle different subelements', () => {
      const text = `
T1A01 (A)
Q1?
A. A
B. B
C. C
D. D
~~
T2B03 (B)
Q2?
A. A
B. B
C. C
D. D
~~
T9C12 (C)
Q3?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions[0].subelement).toBe('T1');
      expect(result.questions[0].question_group).toBe('T1A');
      expect(result.questions[1].subelement).toBe('T2');
      expect(result.questions[1].question_group).toBe('T2B');
      expect(result.questions[2].subelement).toBe('T9');
      expect(result.questions[2].question_group).toBe('T9C');
    });

    it('should handle T0 (zero) subelement', () => {
      const text = `
T0A01 (A)
Safety question?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions[0].subelement).toBe('T0');
      expect(result.questions[0].question_group).toBe('T0A');
    });
  });

  // ===========================================================================
  // OPTIONS PARSING TESTS
  // ===========================================================================

  describe('options parsing', () => {
    it('should correctly parse all 4 options', () => {
      const result = parseNCVECText(sampleNCVECText);
      const q = result.questions[0];

      expect(q.options).toHaveLength(4);
      expect(q.options[0]).toBe('Providing personal radio communications for as many citizens as possible');
      expect(q.options[1]).toBe('Providing communications for international non-profit organizations');
      expect(q.options[2]).toBe('Advancing skills in the technical and communication phases of the radio art');
      expect(q.options[3]).toBe('All these choices are correct');
    });

    it('should handle options with special characters', () => {
      const text = `
T1A01 (A)
What is the formula?
A. E = IR (Ohm's Law)
B. P = I²R
C. 50Ω impedance
D. ±5% tolerance
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions[0].options[0]).toBe("E = IR (Ohm's Law)");
      expect(result.questions[0].options[1]).toBe('P = I²R');
      expect(result.questions[0].options[2]).toBe('50Ω impedance');
      expect(result.questions[0].options[3]).toBe('±5% tolerance');
    });

    it('should handle options with numbers and units', () => {
      const result = parseNCVECText(multiLineQuestion);

      expect(result.questions[0].options[0]).toBe('28.050 MHz to 28.150 MHz');
      expect(result.questions[0].options[1]).toBe('28.100 MHz to 28.300 MHz');
      expect(result.questions[0].options[2]).toBe('28.300 MHz to 28.500 MHz');
      expect(result.questions[0].options[3]).toBe('28.500 MHz to 28.600 MHz');
    });

    it('should warn about missing options', () => {
      const incompleteQuestion = `
T1A01 (A)
Test question?
A. Option A
B. Option B
~~
`;
      const result = parseNCVECText(incompleteQuestion);

      expect(result.warnings.some(w => w.includes('Missing options'))).toBe(true);
    });
  });

  // ===========================================================================
  // QUESTION TEXT PARSING TESTS
  // ===========================================================================

  describe('question text parsing', () => {
    it('should correctly extract question text', () => {
      const result = parseNCVECText(sampleNCVECText);

      expect(result.questions[0].question).toBe(
        'Which of the following is part of the Basis and Purpose of the Amateur Radio Service?'
      );
    });

    it('should handle multi-line question text', () => {
      const text = `
T1A01 (A) [97.1]
This is a very long question that spans
multiple lines in the document?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions[0].question).toBe(
        'This is a very long question that spans multiple lines in the document?'
      );
    });

    it('should trim whitespace from question text', () => {
      const text = `
T1A01 (A)
   What is the answer?
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions[0].question).toBe('What is the answer?');
    });
  });

  // ===========================================================================
  // SYLLABUS PARSING TESTS
  // ===========================================================================

  describe('syllabus parsing', () => {
    it('should parse subelement entries', () => {
      const result = parseNCVECText(sampleNCVECText);

      const subelement = result.syllabus.find(s => s.code === 'T1');
      expect(subelement).toBeDefined();
      expect(subelement?.type).toBe('subelement');
      expect(subelement?.exam_questions).toBe(6);
      expect(subelement?.license_type).toBe('T');
      expect(subelement?.title).toContain("COMMISSION'S RULES");
    });

    it('should parse group entries', () => {
      const result = parseNCVECText(sampleNCVECText);

      const group = result.syllabus.find(s => s.code === 'T1A');
      expect(group).toBeDefined();
      expect(group?.type).toBe('group');
      expect(group?.license_type).toBe('T');
      expect(group?.title).toContain('Purpose and permissible use');
    });

    it('should handle complex syllabus with multiple subelements and groups', () => {
      const result = parseNCVECText(complexSyllabusText);

      // Check subelements
      const t1 = result.syllabus.find(s => s.code === 'T1');
      const t2 = result.syllabus.find(s => s.code === 'T2');
      expect(t1).toBeDefined();
      expect(t2).toBeDefined();
      expect(t1?.exam_questions).toBe(6);
      expect(t2?.exam_questions).toBe(3);

      // Check groups
      const groups = result.syllabus.filter(s => s.type === 'group');
      expect(groups.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle em-dash and regular dash in subelement headers', () => {
      const dashVariations = `
SUBELEMENT T1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]
SUBELEMENT T2 - OPERATING PROCEDURES - [3 Exam Questions - 3 Groups]
`;
      const result = parseNCVECText(dashVariations);

      expect(result.syllabus.filter(s => s.type === 'subelement')).toHaveLength(2);
    });

    it('should extract license type from syllabus codes', () => {
      const result = parseNCVECText(generalExamText);

      const subelement = result.syllabus.find(s => s.code === 'G1');
      expect(subelement?.license_type).toBe('G');

      const group = result.syllabus.find(s => s.code === 'G1A');
      expect(group?.license_type).toBe('G');
    });
  });

  // ===========================================================================
  // DELIMITER HANDLING TESTS
  // ===========================================================================

  describe('delimiter handling', () => {
    it('should handle ~~ delimiter', () => {
      const result = parseNCVECText(sampleNCVECText);
      expect(result.questions).toHaveLength(3);
    });

    it('should handle multiple tildes', () => {
      const text = `
T1A01 (A)
Question 1?
A. A
B. B
C. C
D. D
~~~~

T1A02 (B)
Question 2?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions).toHaveLength(2);
    });

    it('should handle delimiter with surrounding whitespace', () => {
      const text = `
T1A01 (A)
Question 1?
A. A
B. B
C. C
D. D
  ~~

T1A02 (B)
Question 2?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions).toHaveLength(2);
    });
  });

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING TESTS
  // ===========================================================================

  describe('edge cases and error handling', () => {
    it('should handle questions without question text', () => {
      const text = `
T1A01 (A)
A. Option A
B. Option B
C. Option C
D. Option D
~~
`;
      const result = parseNCVECText(text);

      // Should either skip the question or add a warning
      expect(
        result.questions.length === 0 ||
        result.warnings.some(w => w.includes('Missing question text'))
      ).toBe(true);
    });

    it('should handle consecutive delimiters', () => {
      const text = `
T1A01 (A)
Question?
A. A
B. B
C. C
D. D
~~
~~
~~
T1A02 (B)
Question 2?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions).toHaveLength(2);
    });

    it('should handle text before first question', () => {
      const text = `
2022-2026 Technician Class Question Pool

Some introductory text here.

T1A01 (A)
Question?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe('T1A01');
    });

    it('should handle text after last question', () => {
      const text = `
T1A01 (A)
Question?
A. A
B. B
C. C
D. D
~~

End of document.
More trailing text.
`;
      const result = parseNCVECText(text);
      expect(result.questions).toHaveLength(1);
    });

    it('should not confuse group headers with question IDs', () => {
      const text = `
T1A - Purpose and permissible use of the Amateur Radio Service

T1A01 (A)
Question?
A. A
B. B
C. C
D. D
~~
`;
      const result = parseNCVECText(text);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe('T1A01');
      expect(result.syllabus.some(s => s.code === 'T1A')).toBe(true);
    });
  });

  // ===========================================================================
  // FULL DOCUMENT SIMULATION TESTS
  // ===========================================================================

  describe('full document simulation', () => {
    it('should parse a realistic technician exam section', () => {
      const realisticText = `
2022-2026 Technician Class
FCC Element 2 Question Pool
Effective 7/01/2022 – 6/30/2026

SUBELEMENT T1 – COMMISSION'S RULES - [6 Exam Questions - 6 Groups]

T1A - Purpose and permissible use of the Amateur Radio Service; Operator/primary station license grant

T1A01 (C) [97.1]
Which of the following is part of the Basis and Purpose of the Amateur Radio Service?
A. Providing personal radio communications for as many citizens as possible
B. Providing communications for international non-profit organizations
C. Advancing skills in the technical and communication phases of the radio art
D. All these choices are correct
~~

T1A02 (C) [97.1]
Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?
A. FEMA
B. Homeland Security
C. The FCC
D. All these choices are correct
~~

T1B - Frequency allocations; Emission modes; Spectrum sharing

T1B01 (C) [97.301(e)]
Which of the following frequency ranges are available for phone operation by Technician licensees?
A. 28.050 MHz to 28.150 MHz
B. 28.100 MHz to 28.300 MHz
C. 28.300 MHz to 28.500 MHz
D. 28.500 MHz to 28.600 MHz
~~
`;
      const result = parseNCVECText(realisticText);

      expect(result.questions).toHaveLength(3);
      expect(result.syllabus.length).toBeGreaterThanOrEqual(3); // 1 subelement + 2 groups

      // Verify subelement
      const t1 = result.syllabus.find(s => s.code === 'T1' && s.type === 'subelement');
      expect(t1).toBeDefined();
      expect(t1?.exam_questions).toBe(6);

      // Verify groups
      const t1a = result.syllabus.find(s => s.code === 'T1A' && s.type === 'group');
      const t1b = result.syllabus.find(s => s.code === 'T1B' && s.type === 'group');
      expect(t1a).toBeDefined();
      expect(t1b).toBeDefined();

      // Verify questions are in correct groups
      expect(result.questions[0].question_group).toBe('T1A');
      expect(result.questions[1].question_group).toBe('T1A');
      expect(result.questions[2].question_group).toBe('T1B');
    });

    it('should handle all three license types together', () => {
      const mixedText = sampleNCVECText + generalExamText + extraExamText;
      const result = parseNCVECText(mixedText);

      // Should have questions from all three exams
      const techQuestions = result.questions.filter(q => q.id.startsWith('T'));
      const generalQuestions = result.questions.filter(q => q.id.startsWith('G'));
      const extraQuestions = result.questions.filter(q => q.id.startsWith('E'));

      expect(techQuestions.length).toBeGreaterThan(0);
      expect(generalQuestions.length).toBeGreaterThan(0);
      expect(extraQuestions.length).toBeGreaterThan(0);

      // Should have syllabus for all three
      expect(result.syllabus.some(s => s.license_type === 'T')).toBe(true);
      expect(result.syllabus.some(s => s.license_type === 'G')).toBe(true);
      expect(result.syllabus.some(s => s.license_type === 'E')).toBe(true);
    });
  });
});

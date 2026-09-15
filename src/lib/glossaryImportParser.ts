export interface ImportTerm {
  term: string;
  definition: string;
  id?: string;
}

export interface GlossaryValidationResult {
  valid: ImportTerm[];
  errors: { row: number; term?: string; errors: string[] }[];
}

/** Splits one CSV line, honouring double-quoted fields containing commas. */
export const parseCSVLine = (line: string): string[] => {
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
};

export const parseCSV = (content: string): ImportTerm[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]
    .toLowerCase()
    .split(',')
    .map((h) => h.trim().replace(/"/g, ''));
  const terms: ImportTerm[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const getCol = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, '') : '';
    };

    terms.push({ term: getCol('term'), definition: getCol('definition') });
  }

  return terms;
};

export const parseJSON = (content: string): ImportTerm[] => {
  try {
    const data = JSON.parse(content);
    const terms = Array.isArray(data) ? data : data.terms || data.glossary || [];

    return terms.map((t: Record<string, unknown>) => ({
      term: String(t.term || ''),
      definition: String(t.definition || ''),
    }));
  } catch {
    return [];
  }
};

export const validateTerms = (terms: ImportTerm[]): GlossaryValidationResult => {
  const valid: ImportTerm[] = [];
  const errors: { row: number; term?: string; errors: string[] }[] = [];

  terms.forEach((t, index) => {
    const rowErrors: string[] = [];

    if (!t.term?.trim()) rowErrors.push('Missing term');
    if (!t.definition?.trim()) rowErrors.push('Missing definition');

    if (rowErrors.length > 0) {
      // Row 1 is the CSV header, so the first record is row 2.
      errors.push({ row: index + 2, term: t.term, errors: rowErrors });
    } else {
      valid.push({ term: t.term.trim(), definition: t.definition.trim() });
    }
  });

  return { valid, errors };
};

/**
 * Incoming wins on the term's spelling; the existing definition is kept when
 * there is one, so a merge never overwrites curated wording with an import.
 */
export const mergeTerm = (existing: ImportTerm, incoming: ImportTerm): ImportTerm => ({
  id: existing.id,
  term: incoming.term || existing.term,
  definition: existing.definition || incoming.definition,
});

export const EXAMPLE_GLOSSARY_CSV = `term,definition
Antenna,"A device that transmits and/or receives radio waves"
Bandwidth,"The range of frequencies occupied by a signal"
Carrier,"A radio wave that can be modulated to carry information"
Decibel (dB),"A unit used to express the ratio of two power levels"
Frequency,"The number of cycles per second of a radio wave, measured in Hertz"`;

export const EXAMPLE_GLOSSARY_JSON = [
  { term: 'Antenna', definition: 'A device that transmits and/or receives radio waves' },
  { term: 'Bandwidth', definition: 'The range of frequencies occupied by a signal' },
  {
    term: 'Carrier',
    definition: 'A radio wave that can be modulated to carry information',
  },
  { term: 'Decibel (dB)', definition: 'A unit used to express the ratio of two power levels' },
  {
    term: 'Frequency',
    definition: 'The number of cycles per second of a radio wave, measured in Hertz',
  },
];

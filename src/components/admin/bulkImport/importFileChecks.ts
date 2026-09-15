export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type ImportExtension = '.csv' | '.json' | '.docx';

/** text/plain is listed for CSV because some systems report it that way. */
const MIME_TYPES: Record<ImportExtension, string[]> = {
  '.csv': ['text/csv', 'text/plain'],
  '.json': ['application/json'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

/** "a, b, or c" — or "a or b" for two, which is what the glossary needs. */
const formatList = (items: string[]) =>
  items.length <= 2 ? items.join(' or ') : `${items.slice(0, -1).join(', ')}, or ${items.at(-1)}`;

/**
 * Checks a chosen file before anything reads it.
 *
 * Takes the extensions the calling importer actually handles: the question
 * pool accepts NCVEC .docx, the glossary does not, and a shared check that
 * waved .docx through would land it in a parser with no idea what to do
 * with it.
 *
 * Returns the message to show the user, or null when the file is acceptable —
 * so a caller cannot accidentally read "no problems" as a falsy failure.
 */
export function rejectImportFile(file: File, allowed: ImportExtension[]): string | null {
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB';
  }

  const name = file.name.toLowerCase();
  if (!allowed.some((ext) => name.endsWith(ext))) {
    return `Invalid file extension. Please upload a ${formatList(allowed)} file`;
  }

  // Some browsers report an empty type for certain files, so only a type the
  // browser actually gave us can disqualify one.
  const allowedTypes = allowed.flatMap((ext) => MIME_TYPES[ext]);
  if (file.type !== '' && !allowedTypes.includes(file.type)) {
    const names = formatList(allowed.map((ext) => ext.slice(1).toUpperCase()));
    return `Invalid file type detected. Please upload a valid ${names} file`;
  }

  return null;
}

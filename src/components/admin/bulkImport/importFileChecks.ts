export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.csv', '.json', '.docx'];

/** text/plain is here because some systems report CSV that way. */
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/json',
  'text/plain',
];

/**
 * Checks a chosen file before anything reads it.
 *
 * Returns the message to show the user, or null when the file is acceptable —
 * so a caller cannot accidentally treat "no problems" as a falsy failure.
 */
export function rejectImportFile(file: File): string | null {
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB';
  }

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return 'Invalid file extension. Please upload a .csv, .json, or .docx file';
  }

  // Some browsers report an empty type for certain files, so only a type the
  // browser actually gave us can disqualify one.
  if (file.type !== '' && !ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type detected. Please upload a valid CSV, JSON, or DOCX file';
  }

  return null;
}

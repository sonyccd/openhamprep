/** Extension for an image MIME type, so the name does not depend on what the user called the file. */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export interface ImageFileRules {
  allowedTypes: readonly string[];
  maxBytes: number;
  /** How the allowed types read in the rejection message, e.g. "PNG, JPEG, GIF, or WebP". */
  typesLabel: string;
}

/** Why this file cannot be uploaded, or null if it can. */
export function rejectImage(file: File, { allowedTypes, maxBytes, typesLabel }: ImageFileRules): string | null {
  if (!allowedTypes.includes(file.type)) return `Invalid file type. Please upload ${typesLabel}.`;
  if (file.size > maxBytes) return `File too large. Maximum size is ${maxBytes / (1024 * 1024)} MB.`;
  return null;
}

/** The storage object name for an upload, keyed to the row it belongs to. */
export function storageNameFor(ownerId: string, mimeType: string): string {
  return `${ownerId}.${MIME_TO_EXT[mimeType] ?? "png"}`;
}

/** The object name inside a public storage URL. A query such as ?t= is not part of the path. */
export function storageNameFromUrl(url: string): string {
  return new URL(url).pathname.split("/").pop()!;
}

/**
 * A readable message from whatever a storage call threw. Supabase's
 * StorageError is an Error, but a plain `{ message }` comes back from some
 * paths and would otherwise print as "[object Object]".
 */
export function describeStorageError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

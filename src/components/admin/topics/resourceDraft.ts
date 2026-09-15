export interface ResourceDraft {
  type: string;
  title: string;
  url: string;
  description: string;
}

export const EMPTY_RESOURCE_DRAFT: ResourceDraft = {
  type: 'link',
  title: '',
  url: '',
  description: '',
};

export const MAX_RESOURCE_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/** The types that can carry an uploaded file rather than only a URL. */
export const UPLOADABLE_TYPES = ['pdf', 'image', 'video', 'article'];

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  // SVG is excluded on purpose: it can carry executable JavaScript.
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  article: ['application/pdf', 'text/plain', 'text/markdown'],
};

/**
 * Checks an upload against the size cap and the chosen resource type.
 *
 * Returns the message to show, or null when the file is acceptable — so a
 * caller cannot read "no problems" as a falsy failure.
 */
export function rejectResourceFile(file: File, type: string): string | null {
  if (file.size > MAX_RESOURCE_FILE_SIZE) {
    return 'File too large. Maximum size is 25MB.';
  }

  const allowed = ALLOWED_FILE_TYPES[type];
  if (allowed && !allowed.includes(file.type)) {
    return `Invalid file type for ${type}. Allowed: ${allowed.join(', ')}`;
  }

  return null;
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Drops the extension, so an upload can name the resource. */
export const titleFromFileName = (name: string) => name.replace(/\.[^/.]+$/, '');

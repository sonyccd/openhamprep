/**
 * ARRL textbook chapter types for organizing questions by book chapters.
 */

export type LicenseType = 'T' | 'G' | 'E';

export interface ArrlChapter {
  id: string;
  licenseType: LicenseType;
  chapterNumber: number;
  title: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArrlChapterWithCount extends ArrlChapter {
  questionCount: number;
}

// Database row type (snake_case)
export interface ArrlChapterRow {
  id: string;
  license_type: string;
  chapter_number: number;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// For creating a new chapter
export interface CreateChapterInput {
  licenseType: LicenseType;
  chapterNumber: number;
  title: string;
  description?: string;
  displayOrder?: number;
}

// For updating an existing chapter
export interface UpdateChapterInput {
  id: string;
  chapterNumber?: number;
  title?: string;
  description?: string | null;
  displayOrder?: number;
}

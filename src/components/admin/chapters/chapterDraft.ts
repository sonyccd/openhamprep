export interface ChapterDraft {
  chapterNumber: string;
  title: string;
  description: string;
}

export const EMPTY_CHAPTER_DRAFT: ChapterDraft = {
  chapterNumber: "",
  title: "",
  description: "",
};

/** A draft is submittable once it has a positive number and a non-blank title. */
export const isChapterDraftValid = (draft: ChapterDraft): boolean => {
  const n = parseInt(draft.chapterNumber, 10);
  return !Number.isNaN(n) && n >= 1 && draft.title.trim().length > 0;
};

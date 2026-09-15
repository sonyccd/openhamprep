export interface ToolDraft {
  title: string;
  description: string;
  url: string;
  categoryId: string;
  isPublished: boolean;
  /** Only the edit dialog tracks this; the add flow uploads after creation. */
  storagePath: string | null;
}

export const EMPTY_TOOL_DRAFT: ToolDraft = {
  title: "",
  description: "",
  url: "",
  categoryId: "",
  isPublished: false,
  storagePath: null,
};

/**
 * Why a draft cannot be saved yet, or null when it can.
 *
 * One definition so the disabled submit button and the toast cannot disagree,
 * the asymmetry #302 found between two callers of the same form.
 */
export const toolDraftError = (draft: ToolDraft): string | null =>
  draft.title.trim() && draft.description.trim() && draft.url.trim()
    ? null
    : "Please fill in title, description, and URL";

export const isToolDraftValid = (draft: ToolDraft): boolean => toolDraftError(draft) === null;

/** The sentinel the category Select uses for "no category". */
export const NO_CATEGORY = "none";

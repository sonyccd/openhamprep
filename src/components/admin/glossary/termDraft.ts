import type { EditHistoryEntry } from "../EditHistoryViewer";

/** A stored glossary term. Lifted out of AdminGlossary, which declared it
 *  inline while four extracted components now need it. */
export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  edit_history?: EditHistoryEntry[];
}

export interface TermDraft {
  term: string;
  definition: string;
}

export const EMPTY_TERM_DRAFT: TermDraft = { term: "", definition: "" };

/**
 * Why a draft cannot be saved yet, or null when it can.
 *
 * One definition so the disabled submit button and the toast cannot disagree
 * about what "valid" means — the asymmetry #302 found between its two callers.
 */
export const termDraftError = (draft: TermDraft): string | null =>
  draft.term.trim() && draft.definition.trim()
    ? null
    : "Please fill in both term and definition";

export const isTermDraftValid = (draft: TermDraft): boolean => termDraftError(draft) === null;

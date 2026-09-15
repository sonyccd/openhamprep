/** The shape AdminTopics and AdminLessons both create: they are the same form. */
export interface ContentDraft {
  title: string;
  slug: string;
  description: string;
  licenseTypes: string[];
  isPublished: boolean;
}

import { LICENSE_OPTIONS } from "../shared/LicenseTypeCheckboxes";

export const EMPTY_CONTENT_DRAFT: ContentDraft = {
  title: "",
  slug: "",
  description: "",
  licenseTypes: LICENSE_OPTIONS.map((o) => o.value),
  isPublished: false,
};

/**
 * Why a draft cannot be submitted yet, or null when it can.
 *
 * One definition rather than two: the submit button disables on it and both
 * callers guard on it, so the button and the toast can never disagree about
 * what "valid" means.
 */
export const contentDraftError = (draft: ContentDraft): string | null => {
  if (!draft.title.trim()) return "Please enter a title";
  if (!draft.slug.trim()) return "Please enter a slug";
  return null;
};

/** Title and slug are both required; everything else has a sensible default. */
export const isContentDraftValid = (draft: ContentDraft): boolean =>
  contentDraftError(draft) === null;

export const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

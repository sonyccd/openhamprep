/** The shape AdminTopics and AdminLessons both create: they are the same form. */
export interface ContentDraft {
  title: string;
  slug: string;
  description: string;
  licenseTypes: string[];
  isPublished: boolean;
}

export const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
] as const;

export const EMPTY_CONTENT_DRAFT: ContentDraft = {
  title: "",
  slug: "",
  description: "",
  licenseTypes: LICENSE_OPTIONS.map((o) => o.value),
  isPublished: false,
};

/** Title and slug are both required; everything else has a sensible default. */
export const isContentDraftValid = (draft: ContentDraft): boolean =>
  draft.title.trim().length > 0 && draft.slug.trim().length > 0;

export const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

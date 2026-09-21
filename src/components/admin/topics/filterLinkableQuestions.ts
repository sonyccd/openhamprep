import type { LinkableQuestion } from "@/hooks/useTopicQuestionLinks";

export type TestTypeFilter = "all" | "technician" | "general" | "extra";

export const TEST_TYPE_FILTERS: { value: TestTypeFilter; label: string }[] = [
  { value: "all", label: "All Tests" },
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

const PREFIX: Record<Exclude<TestTypeFilter, "all">, string> = { technician: "T", general: "G", extra: "E" };

/**
 * A comma in the search turns it into a list of ids: the question matches if
 * its display name contains any of them. Otherwise one term is matched
 * against the display name and the question text.
 */
export function matchesSearch(q: Pick<LinkableQuestion, "display_name" | "question">, search: string): boolean {
  const name = q.display_name.toLowerCase();
  if (search.includes(",")) {
    const terms = search
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    return terms.some((t) => name.includes(t));
  }
  const term = search.toLowerCase();
  return name.includes(term) || q.question.toLowerCase().includes(term);
}

export function matchesTestType(q: Pick<LinkableQuestion, "display_name">, filter: TestTypeFilter): boolean {
  return filter === "all" || q.display_name.startsWith(PREFIX[filter]);
}

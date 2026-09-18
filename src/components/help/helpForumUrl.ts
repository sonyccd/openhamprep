import { Bug, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const STATUS_PAGE_URL = "https://status.openhamprep.com/status/openhamprep";

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;

export type ReportKind = "bug" | "feedback";

/** Icon and tint for each kind of report, on the option row and the form heading. */
export const REPORT_ICONS: Record<ReportKind, { icon: LucideIcon; token: "error" | "primary" }> = {
  bug: { icon: Bug, token: "error" },
  feedback: { icon: Lightbulb, token: "primary" },
};

/** Copy that differs between the two report forms. */
export const REPORT_COPY: Record<
  ReportKind,
  { heading: string; titlePlaceholder: string; descriptionPlaceholder: string; toast: string }
> = {
  bug: {
    heading: "Report a Bug",
    titlePlaceholder: "Brief summary of the issue",
    descriptionPlaceholder: "What happened? What were you trying to do?",
    toast: "Complete your bug report in the new tab.",
  },
  feedback: {
    heading: "Give Feedback",
    titlePlaceholder: "Brief summary of your idea",
    descriptionPlaceholder: "Tell us more about your idea or suggestion",
    toast: "Complete your feedback in the new tab.",
  },
};

/** A pre-filled new-topic link on the community forum. */
export const buildForumUrl = (kind: ReportKind, title: string, description: string) => {
  const tag = kind === "bug" ? "bug" : "feature";
  const truncatedTitle = title.slice(0, MAX_TITLE_LENGTH);
  const truncatedDescription = description.slice(0, MAX_DESCRIPTION_LENGTH);
  const bodyTemplate =
    kind === "bug"
      ? `**Issue Description:**\n${truncatedDescription}\n\n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n`
      : `**Feedback:**\n${truncatedDescription}\n\n**Why this would help:**\n`;

  const params = new URLSearchParams({
    category: "feedback",
    title: truncatedTitle,
    tags: tag,
    body: bodyTemplate,
  });

  return `https://forum.openhamprep.com/new-topic?${params.toString()}`;
};

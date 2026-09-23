import { Bell, Book, BookText, FileQuestion, GraduationCap, MessageSquare, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSection = "exam" | "glossary" | "learning" | "chapters" | "tools" | "discourse" | "alerts";

/** The admin's top-level sections, in the order they appear. */
export const ADMIN_SECTIONS: { value: AdminSection; label: string; icon: LucideIcon }[] = [
  { value: "exam", label: "Questions", icon: FileQuestion },
  { value: "glossary", label: "Glossary", icon: BookText },
  { value: "learning", label: "Learning", icon: GraduationCap },
  { value: "chapters", label: "Chapters", icon: Book },
  { value: "tools", label: "Tools", icon: Wrench },
  { value: "discourse", label: "Discourse", icon: MessageSquare },
  { value: "alerts", label: "Alerts", icon: Bell },
];

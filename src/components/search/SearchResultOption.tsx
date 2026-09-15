import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HelpCircle, BookText, Library, Wrench } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { SearchResult } from "@/hooks/useGlobalSearch";
import type { HTMLAttributes } from "react";

const ICONS = {
  question: HelpCircle,
  glossary: BookText,
  topic: Library,
  tool: Wrench,
} as const;

export const TYPE_LABELS = {
  question: "Question",
  glossary: "Glossary term",
  topic: "Topic",
  tool: "Tool",
} as const;

export const GROUP_LABELS = {
  question: "Questions",
  glossary: "Glossary",
  topic: "Topics",
  tool: "Tools",
} as const;

interface SearchResultOptionProps {
  result: SearchResult;
  /** From useAutocomplete's getOptionProps — carries id, role, and selection. */
  optionProps: HTMLAttributes<HTMLLIElement>;
}

/** One result row: type icon, title, and the subtitle under it. */
export function SearchResultOption({ result, optionProps }: SearchResultOptionProps) {
  const Icon = ICONS[result.type];

  return (
    <Box
      component="li"
      {...optionProps}
      // The visible row is two lines plus an icon, so the name is spelled out
      // rather than left to the concatenated text content.
      aria-label={`${TYPE_LABELS[result.type]}: ${result.title}. ${result.subtitle}`}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        px: 1.5,
        py: 1.5,
        cursor: "pointer",
        borderRadius: "8px",
        // useAutocomplete puts the active option's highlight on the DOM node
        // itself, adding Mui-focused via classList (useAutocomplete.js:349) —
        // it is not in the props getOptionProps returns. Styling the class is
        // the only way to see it, and it means arrow keys and the pointer
        // cannot disagree about which row is active.
        "&.Mui-focused": {
          bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
        },
      }}
    >
      <Box sx={{ mt: 0.25, flexShrink: 0 }}>
        <Box
          component={Icon}
          aria-hidden="true"
          sx={{ width: 16, height: 16, color: "text.secondary" }}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, overflow: "hidden" }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 500,
            fontSize: "0.875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result.title}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: "0.75rem",
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result.subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

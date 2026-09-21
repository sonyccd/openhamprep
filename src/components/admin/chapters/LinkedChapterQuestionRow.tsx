import { useState } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { X } from "lucide-react";
import type { ChapterQuestion } from "@/hooks/useArrlChapters";
import { tokenAlpha } from "@/theme/muiTheme";
import { QuestionIdTag } from "@/components/admin/shared/QuestionIdTag";

interface LinkedChapterQuestionRowProps {
  question: ChapterQuestion;
  onUnlink: () => void;
  onPageChange: (page: string | null) => void;
  isPending: boolean;
}

/**
 * A question already in this chapter, with its page reference editable in
 * place: Enter or blur saves a changed value, Escape puts the old one back.
 */
export function LinkedChapterQuestionRow({ question, onUnlink, onPageChange, isPending }: LinkedChapterQuestionRowProps) {
  const saved = question.arrl_page_reference || "";
  const [pageValue, setPageValue] = useState(saved);

  const commit = () => {
    const trimmed = pageValue.trim();
    if (trimmed !== saved) onPageChange(trimmed || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") setPageValue(saved);
  };

  return (
    <ListItem
      sx={{
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 5),
        ...(isPending && { opacity: 0.5 }),
      }}
    >
      <Checkbox
        checked
        disabled
        size="small"
        slotProps={{ input: { "aria-label": `${question.display_name} is linked` } }}
        sx={{ p: 0.5, mt: -0.5 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <QuestionIdTag name={question.display_name} />
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "text.secondary",
            mt: 0.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {question.question}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <TextField
          label="Page"
          size="small"
          value={pageValue}
          onChange={(e) => setPageValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 45"
          disabled={isPending}
          sx={{ width: 96 }}
          slotProps={{ htmlInput: { sx: { fontSize: "0.75rem", py: 0.5 } } }}
        />
        <Tooltip title="Unlink question">
          <span>
            <IconButton
              size="small"
              onClick={onUnlink}
              disabled={isPending}
              aria-label="Unlink question"
              sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
            >
              <Box component={X} aria-hidden="true" sx={{ width: 16, height: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </ListItem>
  );
}

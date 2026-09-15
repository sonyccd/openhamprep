import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { tokenAlpha } from "@/theme/muiTheme";
import type { AnswerLetter, Question } from "@/hooks/useQuestions";

interface AnswerReviewListProps {
  questions: Question[];
  answers: Record<string, AnswerLetter>;
  onSelect: (index: number) => void;
  /** TestResultReview scrolls this list inside a fixed-height panel. */
  scrollable?: boolean;
}

/**
 * Every question in the sitting, right or wrong, as a jump list.
 *
 * A real List rather than a stack of bare buttons: 35 sibling buttons with no
 * grouping is what this was, and a screen reader had no way to know how many
 * there were or where it was in them.
 *
 * The tick and cross are the other half of that — they were bare glyphs, so
 * correctness reached sighted users as a colour and a symbol and everyone else
 * as either nothing or a literal "check mark". The glyph is decorative now and
 * the state is spelled out.
 */
export function AnswerReviewList({
  questions,
  answers,
  onSelect,
  scrollable = false,
}: AnswerReviewListProps) {
  return (
    <List
      disablePadding
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        ...(scrollable && { overflowY: "auto", flex: 1, minHeight: 0, pr: 1 }),
      }}
    >
      {questions.map((q, idx) => {
        const isCorrect = answers[q.id] === q.correctAnswer;
        const token = isCorrect ? "success" : "error";

        return (
          <ListItem key={q.id} disablePadding disableGutters>
            <ListItemButton
              onClick={() => onSelect(idx)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: "8px",
                border: "1px solid",
                textAlign: "left",
                transition: "background-color 200ms",
                borderColor: (t) => tokenAlpha(t.vars.palette[token].main, 30),
                bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 5),
                "&:hover": {
                  bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 10),
                },
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  bgcolor: `${token}.main`,
                  color: `${token}.contrastText`,
                }}
              >
                {idx + 1}
              </Box>
              <Typography
                component="span"
                sx={{
                  flex: 1,
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {q.displayName}: {q.question.substring(0, 60)}...
              </Typography>
              <Box
                component="span"
                aria-hidden="true"
                sx={{ fontSize: "0.75rem", fontFamily: "monospace", flexShrink: 0, color: `${token}.main` }}
              >
                {isCorrect ? "✓" : "✗"}
              </Box>
              <Box component="span" sx={visuallyHidden}>
                {isCorrect ? "Answered correctly" : "Answered incorrectly"}
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

interface QuestionGroupListProps {
  /** Already filtered and grouped: group key → its questions, plus the sort order. */
  groups: Record<string, Question[]>;
  sortedKeys: string[];
  /** The unfiltered pool, so a row can report its index in the real session. */
  allQuestions: Question[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onStartPractice: (startIndex?: number) => void;
}

/**
 * The grouped question rows.
 *
 * Rows are `MotionBox component="button"` rather than MUI's ButtonBase: this is
 * a left-aligned block of text, and ButtonBase sets alignItems/justifyContent
 * to center (ButtonBase.js:52-53), which silently centres every row. That
 * mistake reached a preview deploy in B1.
 */
export function QuestionGroupList({
  groups,
  sortedKeys,
  allQuestions,
  hoveredId,
  onHover,
  onStartPractice,
}: QuestionGroupListProps) {
  return (
    <>
      {sortedKeys.map((groupKey, groupIndex) => (
        <MotionBox
          key={groupKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + groupIndex * 0.03 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.05em", // tracking-wider
              }}
            >
              {groupKey}
            </Typography>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
          </Box>

          <Stack spacing={0.5}>
            {groups[groupKey].map((q, qIndex) => {
              const globalIndex = allQuestions.findIndex((orig) => orig.id === q.id);
              const hovered = hoveredId === q.id;

              return (
                <MotionBox
                  key={q.id}
                  component="button"
                  onClick={() => onStartPractice(globalIndex)}
                  onMouseEnter={() => onHover(q.id)}
                  onMouseLeave={() => onHover(null)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * qIndex }}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: "8px", // rounded-lg
                    transition: "all 150ms",
                    border: "1px solid transparent",
                    bgcolor: "transparent",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    position: "relative",
                    "&:hover": { bgcolor: "secondary.main", borderColor: "divider" },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: (t) => tokenAlpha(t.vars.palette.primary.main, 30),
                      outlineOffset: 0,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "primary.main",
                          }}
                        >
                          {q.displayName}
                        </Typography>
                      </Box>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "0.875rem",
                          lineHeight: 1.375, // leading-snug
                          transition: "color 150ms",
                          color: hovered ? "text.primary" : "text.secondary",
                        }}
                      >
                        {q.question.length > 120
                          ? q.question.substring(0, 120) + "..."
                          : q.question}
                      </Typography>
                    </Box>

                    <AnimatePresence>
                      {hovered && (
                        <MotionBox
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          sx={{ flexShrink: 0 }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                            }}
                          >
                            <Box
                              component={Play}
                              aria-hidden="true"
                              sx={{ width: 14, height: 14, color: "primary.main", ml: "2px" }}
                            />
                          </Box>
                        </MotionBox>
                      )}
                    </AnimatePresence>
                  </Box>
                </MotionBox>
              );
            })}
          </Stack>
        </MotionBox>
      ))}
    </>
  );
}

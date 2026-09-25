import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Bookmark, MessageSquare, Trash2 } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

interface BookmarkListProps {
  questions: Question[];
  /** question_id -> the note on it, if any. */
  noteFor: (questionId: string) => string | null | undefined;
  onSelect: (index: number) => void;
  onRemove: (questionId: string) => void;
  onStartPractice: () => void;
}

/** Nothing bookmarked yet — the only route out is to go practise. */
function EmptyState({ onStartPractice }: { onStartPractice: () => void }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pt: 3 }}>
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ textAlign: "center", py: 4 }}
        >
          <Icon icon={Bookmark} size={48} sx={{ color: "text.secondary", mx: "auto", mb: 2 }} />
          <Typography sx={{ color: "text.primary", fontWeight: 500, mb: 1 }}>
            No bookmarks yet
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            Bookmark questions during practice to review them later
          </Typography>
          <Button variant="contained" onClick={onStartPractice}>
            Start Practicing
          </Button>
        </MotionBox>
      </CardContent>
    </Card>
  );
}

export function BookmarkList({
  questions,
  noteFor,
  onSelect,
  onRemove,
  onStartPractice,
}: BookmarkListProps) {
  if (questions.length === 0) {
    return <EmptyState onStartPractice={onStartPractice} />;
  }

  return (
    <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <Typography
          component="h2"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Icon icon={Bookmark} size={20} />
          Bookmarked Questions
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {questions.map((question, index) => {
          const note = noteFor(question.id);
          return (
            <Card
              key={question.id}
              variant="outlined"
              sx={{
                transition: "border-color 200ms",
                "&:hover": {
                  borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: 2 }}>
                {/*
                  CardActionArea rather than a ButtonBase or a bare button: it is
                  the native clickable-card region, and it is display:block with
                  textAlign:inherit, so it does not centre the text the way
                  ButtonBase would.
                */}
                <CardActionArea
                  onClick={() => onSelect(index)}
                  sx={{ flex: 1, borderRadius: 1, p: 0.5, m: -0.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Chip
                      color="secondary"
                      label={question.displayName}
                      size="small"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem", height: 20, color: "text.secondary" }}
                    />
                    {note && (
                      <Chip
                        icon={
                          <Icon icon={MessageSquare} size={12} />
                        }
                        label="Has note"
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.75rem",
                          height: 20,
                          color: "accent",
                          borderColor: (t) => tokenAlpha(t.vars.palette.accent, 30),
                          "& .MuiChip-icon": { color: "accent" },
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      color: "text.primary",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {question.question}
                  </Typography>
                </CardActionArea>
                <IconButton
                  aria-label={`Remove bookmark for ${question.id}`}
                  onClick={() => onRemove(question.id)}
                  sx={{
                    width: 32,
                    height: 32,
                    color: "text.secondary",
                    "&:hover": { color: "error.main" },
                  }}
                >
                  <Icon icon={Trash2} size={16} />
                </IconButton>
              </Box>
            </Card>
          );
        })}
      </Stack>
    </MotionBox>
  );
}

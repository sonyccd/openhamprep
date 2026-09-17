import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Flame } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";
import { StreakDots } from "./StreakDots";

interface WeakQuestionListProps {
  questions: Question[];
  streaks: Record<string, number>;
  streakToClear: number;
  clearedCount: number;
  streakModeEnabled: boolean;
  onStreakModeChange: (enabled: boolean) => void;
  onSelect: (index: number) => void;
}

/** Every weak question, each a button into practice on it. */
export function WeakQuestionList({
  questions,
  streaks,
  streakToClear,
  clearedCount,
  streakModeEnabled,
  onStreakModeChange,
  onSelect,
}: WeakQuestionListProps) {
  return (
    <PageContainer width="standard" mobileNavPadding>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontSize: "1.125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box component={AlertTriangle} aria-hidden="true" sx={{ width: 20, height: 20, color: "error.main" }} />
              Weak Questions
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              {questions.length} question{questions.length !== 1 ? "s" : ""} to review
              {clearedCount > 0 && (
                <Box component="span" sx={{ color: "success.main", ml: 0.5 }}>
                  ({clearedCount} cleared)
                </Box>
              )}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
            <FormControlLabel
              sx={{ m: 0, gap: 1 }}
              label={
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component={Flame}
                    aria-hidden="true"
                    sx={{ width: 16, height: 16, color: streakModeEnabled ? "warning.main" : "text.secondary" }}
                  />
                  <Box component="span" sx={{ fontSize: "0.875rem" }}>Streak mode</Box>
                  <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    ({streakModeEnabled ? `${streakToClear}x to clear` : "1x to clear"})
                  </Box>
                </Box>
              }
              labelPlacement="start"
              control={
                <Switch
                  checked={streakModeEnabled}
                  onChange={(event) => onStreakModeChange(event.target.checked)}
                />
              }
            />
          </Box>
        </Box>

        {questions.map((question, index) => (
          <Box
            key={question.id}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              p: 2,
              transition: "border-color 150ms",
              "&:hover": { borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50) },
            }}
          >
            {/* Everything inside is a span: a <button> takes phrasing content
                only, and the old markup nested divs and a <p> in it. */}
            <Box
              component="button"
              type="button"
              onClick={() => onSelect(index)}
              sx={{
                width: "100%",
                textAlign: "left",
                bgcolor: "transparent",
                border: 0,
                p: 0,
                color: "text.primary",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
              >
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      bgcolor: "secondary.main",
                      px: 1,
                      py: 0.25,
                      borderRadius: "4px",
                    }}
                  >
                    {question.displayName}
                  </Box>
                  <Box component="span" sx={{ fontSize: "0.75rem", color: "error.main" }}>
                    Needs practice
                  </Box>
                </Box>
                {streakModeEnabled && (
                  <StreakDots filled={streaks[question.id] || 0} total={streakToClear} />
                )}
              </Box>
              <Box
                component="span"
                sx={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  fontSize: "0.875rem",
                }}
              >
                {question.question}
              </Box>
            </Box>
          </Box>
        ))}
      </MotionBox>
    </PageContainer>
  );
}

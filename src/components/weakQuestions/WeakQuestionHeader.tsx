import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { AlertTriangle, ArrowLeft, CheckCircle, Flame } from "lucide-react";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { StreakDots } from "./StreakDots";

interface WeakQuestionHeaderProps {
  isJustCleared: boolean;
  streakModeEnabled: boolean;
  currentStreak: number;
  streakToClear: number;
  onBack: () => void;
}

/** Above the question: the way back, the status, and — in streak mode — the dots. */
export function WeakQuestionHeader({
  isJustCleared,
  streakModeEnabled,
  currentStreak,
  streakToClear,
  onBack,
}: WeakQuestionHeaderProps) {
  const status = isJustCleared
    ? { icon: CheckCircle, label: "Cleared!", color: "success.main" }
    : { icon: AlertTriangle, label: "Weak Area", color: "error.main" };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button
          variant="text"
          onClick={onBack}
          startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
          sx={{ color: "text.primary" }}
        >
          Back to Weak Questions
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyboardShortcutsHelp />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: status.color }}>
            <Box component={status.icon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
            <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
              {status.label}
            </Box>
          </Box>
        </Box>
      </Box>

      {isJustCleared && (
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
            border: "1px solid",
            borderColor: (t) => tokenAlpha(t.vars.palette.success.main, 30),
            borderRadius: "8px",
            p: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "success.main" }}>
            <Box component={CheckCircle} aria-hidden="true" sx={{ width: 20, height: 20 }} />
            <Box component="span" sx={{ fontWeight: 500 }}>
              Question cleared from weak areas!
            </Box>
          </Box>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>
            Take your time to review the explanation. Click Next to continue.
          </Typography>
        </MotionBox>
      )}

      {streakModeEnabled && !isJustCleared && (
        <Paper
          component={MotionBox}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="outlined"
          sx={{ p: 2, mb: 2, borderRadius: "8px" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box component={Flame} aria-hidden="true" sx={{ width: 16, height: 16, color: "warning.main" }} />
              <Box component="span" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                Streak to clear ({streakToClear} correct in a row)
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StreakDots filled={currentStreak} total={streakToClear} size={12} />
              <Box
                component="span"
                sx={{ fontSize: "0.875rem", fontFamily: "monospace", color: "primary.main", ml: 1 }}
              >
                {currentStreak}/{streakToClear}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

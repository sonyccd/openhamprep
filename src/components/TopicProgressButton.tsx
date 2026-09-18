import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import type { SxProps, Theme } from "@mui/material/styles";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToggleTopicComplete, useTopicCompleted } from "@/hooks/useTopics";

interface TopicProgressButtonProps {
  topicId: string;
  questionCount: number;
  sx?: SxProps<Theme>;
}

/**
 * A topic's completion state, in the header.
 *
 * With questions it is a status only — the quiz decides completion. Without
 * them it is a manual toggle. Guests see nothing: there is no account to
 * record completion against.
 */
export function TopicProgressButton({ topicId, questionCount, sx }: TopicProgressButtonProps) {
  const { user } = useAuth();
  const isCompleted = useTopicCompleted(topicId);
  const { mutate: toggleComplete, isPending } = useToggleTopicComplete();

  if (!user) return null;

  if (questionCount > 0) {
    return (
      <Chip
        icon={
          <Box
            component={isCompleted ? CheckCircle2 : Target}
            aria-hidden="true"
            sx={{ width: 16, height: 16 }}
          />
        }
        label={isCompleted ? "Completed" : "Score 80% to complete"}
        sx={[
          {
            height: "auto",
            py: 0.75,
            px: 0.5,
            fontSize: "0.875rem",
            fontWeight: 500,
            ...(isCompleted
              ? { bgcolor: "success.main", color: "success.contrastText" }
              : { bgcolor: "muted", color: "text.secondary" }),
            "& .MuiChip-icon": { color: "inherit" },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  }

  return (
    <Button
      variant={isCompleted ? "contained" : "outlined"}
      color={isCompleted ? "success" : "primary"}
      onClick={() => toggleComplete({ topicId, isCompleted: !isCompleted })}
      disabled={isPending}
      startIcon={
        isPending ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <Box
            component={isCompleted ? CheckCircle2 : Circle}
            aria-hidden="true"
            sx={{ width: 16, height: 16 }}
          />
        )
      }
      sx={[
        !isCompleted && {
          "&:hover": { borderColor: "success.main", color: "success.main" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {isCompleted ? "Completed" : "Mark as Complete"}
    </Button>
  );
}

import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PlayCircle } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicQuizCtaProps {
  questionCount: number;
  isCompleted: boolean;
  onStart: () => void;
}

/** The "Ready to test your knowledge?" block after the article. */
export function TopicQuizCta({ questionCount, isCompleted, onStart }: TopicQuizCtaProps) {
  return (
    <Box sx={{ mt: 5, pt: 4, borderTop: "1px solid", borderColor: "divider" }}>
      <Box
        sx={{
          bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
          borderRadius: "12px",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" component="h3" sx={{ fontSize: "1.125rem", fontWeight: 600, mb: 1 }}>
          Ready to test your knowledge?
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 2 }}>
          {isCompleted
            ? "You've already completed this topic. Take the quiz again to reinforce your learning."
            : `Answer ${questionCount} question${questionCount !== 1 ? "s" : ""} and score 80% or higher to complete this topic.`}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onStart}
          startIcon={<Icon icon={PlayCircle} size={20} />}
        >
          {isCompleted ? "Retake Quiz" : "Take Quiz"}
        </Button>
      </Box>
    </Box>
  );
}

import { useId } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { ComponentProps } from "react";
import { TopicQuiz } from "@/components/TopicQuiz";

type QuizProps = ComponentProps<typeof TopicQuiz>;

interface TopicQuizDialogProps extends Omit<QuizProps, "questions"> {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Undefined until the full rows behind the topic's question links arrive. */
  questions: QuizProps["questions"] | undefined;
  isLoadingQuestions: boolean;
}

/** The quiz in a modal, loading its questions first. */
export function TopicQuizDialog({
  open,
  onClose,
  title,
  isLoadingQuestions,
  questions,
  ...quiz
}: TopicQuizDialogProps) {
  const id = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={`${id}-title`}
      slotProps={{ paper: { sx: { maxWidth: 672, maxHeight: "90vh" } } }}
    >
      <DialogTitle id={`${id}-title`}>Quiz: {title}</DialogTitle>
      <DialogContent>
        {isLoadingQuestions || !questions ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={24} aria-label="Loading quiz" />
          </Box>
        ) : (
          <TopicQuiz questions={questions} {...quiz} />
        )}
      </DialogContent>
    </Dialog>
  );
}

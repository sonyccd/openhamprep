import { Plus, Loader2, Link as LinkIcon, Image } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FigureUpload } from "../FigureUpload";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

interface QuestionAddDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newId: string;
  newQuestion: string;
  newOptions: string[];
  newCorrectAnswer: string;
  newExplanation: string;
  newFigureUrl: string | null;
  isPending: boolean;
  onIdChange: (value: string) => void;
  onQuestionChange: (value: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onCorrectAnswerChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onFigureUrlChange: (url: string | null) => void;
  onAdd: () => void;
}

export function QuestionAddDialog({
  isOpen,
  onOpenChange,
  newId,
  newQuestion,
  newOptions,
  newCorrectAnswer,
  newExplanation,
  newFigureUrl,
  isPending,
  onIdChange,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onExplanationChange,
  onFigureUrlChange,
  onAdd,
}: QuestionAddDialogProps) {
  return (
    <>
      {/* MUI has no DialogTrigger: the trigger is an ordinary button that flips
          the same state the dialog already reads. */}
      <Button variant="contained" startIcon={<Plus className="w-4 h-4" />} onClick={() => onOpenChange(true)}>
        Add Question
      </Button>

      <Dialog open={isOpen} onClose={() => onOpenChange(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <TextField
              label="Question ID (FCC assigned, e.g., T1A01)"
              placeholder="e.g., T1A01"
              value={newId}
              onChange={(e) => onIdChange(e.target.value)}
              helperText="This is the official FCC question ID and cannot be changed after creation."
              fullWidth
            />

            <TextField
              label="Question Text"
              placeholder="Enter the question..."
              value={newQuestion}
              onChange={(e) => onQuestionChange(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Options</Typography>
              {OPTION_LETTERS.map((letter, index) => (
                <TextField
                  key={letter}
                  label={`Option ${letter}`}
                  placeholder={`Option ${letter}`}
                  value={newOptions[index]}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                  fullWidth
                />
              ))}
            </Stack>

            <TextField
              select
              label="Correct Answer"
              value={newCorrectAnswer}
              onChange={(e) => onCorrectAnswerChange(e.target.value)}
              fullWidth
            >
              {OPTION_LETTERS.map((letter, index) => (
                <MenuItem key={letter} value={String(index)}>
                  {letter}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Explanation (shown after answering)"
              placeholder="Explain why this is the correct answer..."
              value={newExplanation}
              onChange={(e) => onExplanationChange(e.target.value)}
              helperText="This explanation will be shown to users after they answer the question."
              multiline
              rows={3}
              fullWidth
            />

            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Image className="w-4 h-4" aria-hidden="true" />
                Question Figure (Optional)
              </Typography>
              <FigureUpload
                questionId={newId || "new-question"}
                currentFigureUrl={newFigureUrl}
                onUpload={(url) => onFigureUrlChange(url)}
                onRemove={() => onFigureUrlChange(null)}
              />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkIcon className="w-4 h-4" aria-hidden="true" />
                Learning Resources
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Links are automatically extracted from the explanation. Use markdown syntax:{" "}
                <Box component="code" sx={{ px: 0.5, py: 0.25, borderRadius: 1, bgcolor: "action.hover", fontSize: "0.75rem" }}>
                  [Link Text](https://...)
                </Box>
              </Typography>
            </Stack>

            <Button
              variant="contained"
              onClick={onAdd}
              disabled={isPending}
              fullWidth
              startIcon={
                isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
              }
            >
              Add Question
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

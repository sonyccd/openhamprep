import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Dices,
  MessageSquare,
} from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { QuestionCard } from "@/components/QuestionCard";
import { tokenAlpha } from "@/theme/muiTheme";
import type { AnswerLetter, Question } from "@/hooks/useQuestions";

interface BookmarkQuestionViewProps {
  question: Question;
  note?: string | null;
  selectedAnswer: AnswerLetter | null;
  showResult: boolean;
  index: number;
  total: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onSelectAnswer: (answer: AnswerLetter) => void;
  onBackToList: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRandomize: () => void;
  onTryAgain: () => void;
  onTopicClick: (slug: string) => void;
}

export function BookmarkQuestionView({
  question,
  note,
  selectedAnswer,
  showResult,
  index,
  total,
  canGoPrev,
  canGoNext,
  onSelectAnswer,
  onBackToList,
  onPrev,
  onNext,
  onRandomize,
  onTryAgain,
  onTopicClick,
}: BookmarkQuestionViewProps) {
  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
        >
          <Button
            variant="text"
            onClick={onBackToList}
            startIcon={<Box component={ArrowLeft} sx={{ width: 16, height: 16 }} />}
            sx={{ color: "text.primary" }}
          >
            Back to Bookmarks
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <KeyboardShortcutsHelp />
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.primary" }}
            >
              <Box component={Bookmark} aria-hidden="true" sx={{ width: 20, height: 20 }} />
              <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                Bookmarked
              </Box>
            </Box>
          </Box>
        </Box>

        {note && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mb: 2 }}
          >
            {/*
              Paper, not Alert. A saved note is not an alert — Alert carries
              role="alert" and would have a screen reader interrupt to announce
              the user's own note every time the question loads.
            */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: "8px",
                bgcolor: (t) => tokenAlpha(t.vars.palette.accent, 10),
                borderColor: (t) => tokenAlpha(t.vars.palette.accent, 30),
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Box
                  component={MessageSquare}
                  aria-hidden="true"
                  sx={{ width: 16, height: 16, color: "accent", mt: 0.25 }}
                />
                <Box>
                  <Typography
                    component="p"
                    sx={{ fontSize: "0.875rem", fontWeight: 500, color: "accent", mb: 0.5 }}
                  >
                    Your Note
                  </Typography>
                  <Typography
                    component="p"
                    sx={{ fontSize: "0.875rem", color: "text.primary" }}
                  >
                    {note}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </MotionBox>
        )}
      </Box>

      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer}
        showResult={showResult}
        enableGlossaryHighlight
        onTopicClick={onTopicClick}
      />

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onPrev}
          disabled={!canGoPrev}
          startIcon={<Box component={ChevronLeft} sx={{ width: 16, height: 16 }} />}
        >
          Previous
        </Button>
        {/*
          Tooltip rather than the bare title attribute this replaced. A span
          wrapper because MUI's Tooltip listens on its child, and a disabled
          button fires no pointer events — without it the hint would vanish in
          exactly the single-bookmark case that explains why it is disabled.
        */}
        <Tooltip title="Random question">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <Button
              variant="outlined"
              onClick={onRandomize}
              disabled={total <= 1}
              aria-label="Jump to random question"
            >
              <Box component={Dices} aria-hidden="true" sx={{ width: 16, height: 16 }} />
            </Button>
          </Box>
        </Tooltip>
        {showResult && (
          <Button variant="outlined" onClick={onTryAgain}>
            Try Again
          </Button>
        )}
        <Button
          variant={showResult ? "contained" : "outlined"}
          onClick={onNext}
          disabled={!canGoNext}
          endIcon={<Box component={ChevronRight} sx={{ width: 16, height: 16 }} />}
        >
          Next
        </Button>
      </Box>

      {total > 1 && (
        <MotionBox
          component="p"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.875rem", mt: 2 }}
        >
          Question {index + 1} of {total}
        </MotionBox>
      )}
    </>
  );
}

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { HelpCircle } from "lucide-react";
import { useTopicQuestions, TopicQuestion } from "@/hooks/useTopics";
import { CollapsibleSection } from "@/components/ohp/CollapsibleSection";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicQuestionsPanelProps {
  topicId: string;
  onQuestionClick?: (questionId: string) => void;
}

function QuestionItem({ question, onClick }: { question: TopicQuestion; onClick?: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        borderRadius: "8px",
        border: "1px solid transparent",
        bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
        color: "inherit",
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        transition: "background-color 150ms, border-color 150ms",
        "&:hover": { bgcolor: "secondary.main", borderColor: "divider" },
      }}
    >
      {/* spans: this is inside a <button> */}
      <Box
        component="span"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.75rem",
          color: "primary.main",
          bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          px: 1,
          py: 0.5,
          borderRadius: "4px",
          flexShrink: 0,
        }}
      >
        {question.displayName}
      </Box>
      <Box
        component="span"
        sx={{
          flex: 1,
          fontSize: "0.875rem",
          color: "text.secondary",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {question.question}
      </Box>
    </Box>
  );
}

/** The questions linked to a topic, in the topic page's sidebar. */
export function TopicQuestionsPanel({ topicId, onQuestionClick }: TopicQuestionsPanelProps) {
  const { data: questions, isLoading } = useTopicQuestions(topicId);

  if (isLoading) {
    return (
      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
          <Skeleton variant="rounded" width={16} height={16} />
          <Skeleton variant="rounded" width={96} height={16} />
        </Box>
        <Skeleton variant="rounded" width="100%" height={64} />
        <Skeleton variant="rounded" width="100%" height={64} />
      </Box>
    );
  }

  // The parent decides whether the sidebar exists at all; an empty list is nothing to show.
  if (!questions || questions.length === 0) return null;

  const items = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {questions.map((question) => (
        <QuestionItem key={question.id} question={question} onClick={() => onQuestionClick?.(question.id)} />
      ))}
    </Box>
  );
  const icon = <Box component={HelpCircle} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary" }} />;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <CollapsibleSection title="Related Questions" icon={icon} count={questions.length}>
          {items}
        </CollapsibleSection>
      </Box>
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <CollapsibleSection title="Related Questions" icon={icon} count={questions.length} variant="card">
          {items}
        </CollapsibleSection>
      </Box>
    </Box>
  );
}

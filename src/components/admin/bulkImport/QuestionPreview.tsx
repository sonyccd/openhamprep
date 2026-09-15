import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ImportQuestion } from "@/lib/questionImportParser";
import type { AnswerLetter } from "@/services/questions/questionService";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D"];

interface QuestionPreviewProps {
  question: ImportQuestion;
  /**
   * The database copy a merge started from. Given, the explanation and links
   * lines say whether the merge kept what was there or added to it.
   */
  against?: ImportQuestion;
}

/** The compact question summary shown on each side of a conflict. */
export function QuestionPreview({ question, against }: QuestionPreviewProps) {
  const hasLinks = Boolean(question.links && question.links.length > 0);
  const explanationState = question.explanation
    ? against
      ? against.explanation
        ? "Kept"
        : "Added"
      : "Yes"
    : "None";

  return (
    <Box sx={{ fontSize: "0.75rem" }}>
      <Typography
        sx={{
          fontSize: "inherit",
          fontWeight: 500,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {question.question}
      </Typography>
      <Box sx={{ color: "text.secondary", fontSize: "inherit" }}>
        <p>Options: {question.options.filter((o) => o).length}/4</p>
        <p>Answer: {LETTERS[question.correct_answer]}</p>
        <Box component="p" sx={{ color: question.explanation ? "success.main" : "warning.main" }}>
          Explanation: {explanationState}
        </Box>
        <Box component="p" sx={{ color: hasLinks ? "success.main" : "warning.main" }}>
          Links: {question.links?.length || 0}
          {against?.links && against.links.length > 0 ? " (Kept)" : ""}
        </Box>
      </Box>
    </Box>
  );
}

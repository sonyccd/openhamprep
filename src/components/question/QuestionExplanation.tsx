import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { GetMoreHelp } from "@/components/GetMoreHelp";
import { LinkPreview } from "@/components/LinkPreview";
import { MarkdownText } from "@/components/MarkdownText";
import { useAuth } from "@/hooks/useAuth";
import { useExplanationFeedback } from "@/hooks/useExplanationFeedback";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

interface QuestionExplanationProps {
  question: Question;
  selectedAnswer: string | null;
  onTopicClick?: (slug: string) => void;
}

/** Did the explanation help? A genuine toggle, so aria-pressed is correct. */
function FeedbackButtons({ questionId }: { questionId: string }) {
  const { userFeedback, submitFeedback, removeFeedback } = useExplanationFeedback(questionId);

  const handleFeedback = (isHelpful: boolean) => {
    if (userFeedback?.is_helpful === isHelpful) {
      // Toggle off if clicking the same button
      removeFeedback.mutate(questionId);
    } else {
      submitFeedback.mutate({ question_id: questionId, is_helpful: isHelpful });
    }
  };

  const buttons = [
    {
      helpful: true,
      icon: ThumbsUp,
      title: "Helpful",
      label: "Mark explanation as helpful",
      token: "success" as const,
    },
    {
      helpful: false,
      icon: ThumbsDown,
      title: "Not helpful",
      label: "Mark explanation as not helpful",
      token: "error" as const,
    },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", mr: 0.5 }}>
        Helpful?
      </Typography>
      {buttons.map(({ helpful, icon, title, label, token }) => {
        const pressed = userFeedback?.is_helpful === helpful;
        return (
          <Tooltip key={label} title={title}>
            <IconButton
              onClick={() => handleFeedback(helpful)}
              aria-label={label}
              aria-pressed={pressed}
              sx={{
                width: 28,
                height: 28,
                ...(pressed && {
                  color: `${token}.main`,
                  bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 10),
                }),
              }}
            >
              <Icon icon={icon} size={16} />
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}

/**
 * The explanation and reference links, revealed once the question is answered.
 *
 * Either half can be absent, and whichever survives alone spans both columns —
 * hence the gridColumn on each rather than a column count on the grid.
 */
export function QuestionExplanation({
  question,
  selectedAnswer,
  onTopicClick,
}: QuestionExplanationProps) {
  const { user } = useAuth();
  const hasLinks = Boolean(question.links && question.links.length > 0);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      sx={{
        mt: 5, // mt-10
        pt: 4, // pt-8
        borderTop: "1px solid",
        borderColor: (t) => tokenAlpha(t.vars.palette.divider, 50),
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3, // gap-6
        }}
      >
        {question.explanation && (
          <Box
            sx={{
              p: 3, // p-6
              borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
              bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
              ...(!hasLinks && { gridColumn: { md: "span 2" } }),
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                component="h3"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: (t) => tokenAlpha(t.vars.palette.text.primary, 80),
                }}
              >
                Explanation
              </Typography>
              {user && <FeedbackButtons questionId={question.id} />}
            </Box>
            <Box sx={{ fontSize: "0.875rem", lineHeight: 1.625, color: "text.secondary" }}>
              <MarkdownText text={question.explanation} />
            </Box>
          </Box>
        )}

        {hasLinks && (
          <Box sx={{ ...(!question.explanation && { gridColumn: { md: "span 2" } }) }}>
            <Typography
              component="h3"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: (t) => tokenAlpha(t.vars.palette.text.secondary, 80),
                mb: 1.5,
              }}
            >
              Learn more:
            </Typography>
            <Stack spacing={1.5}>
              {question.links.map((link, index) => (
                <LinkPreview key={index} link={link} />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      <GetMoreHelp
        question={question}
        selectedAnswer={selectedAnswer}
        onTopicClick={onTopicClick}
      />
    </MotionBox>
  );
}

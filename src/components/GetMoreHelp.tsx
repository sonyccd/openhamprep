import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { Question } from "@/hooks/useQuestions";
import { getSafeUrl } from "@/lib/utils";
import { tokenAlpha } from "@/theme/muiTheme";
import { buildAiPrompt, getLicenseClass } from "@/lib/aiPrompt";
import { trackAiPromptCopied } from "@/lib/amplitude";
import { toast } from "sonner";
import { BookOpen, Users, Sparkles, ExternalLink } from "lucide-react";

/**
 * Constructs a Discourse auth URL that logs the user in via OIDC
 * and redirects them to the specified forum topic after authentication.
 */
function getForumAuthUrl(forumUrl: string): string | null {
  const safeUrl = getSafeUrl(forumUrl);
  if (!safeUrl) return null;

  try {
    const url = new URL(safeUrl);
    const origin = url.pathname + url.search + url.hash;
    return `https://forum.openhamprep.com/auth/oidc?origin=${encodeURIComponent(origin)}`;
  } catch {
    return null;
  }
}

/** Every action here reads as the same kind of thing: a quiet, tappable pill. */
const actionSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  fontSize: "0.875rem",
  py: 1.25,
  px: 2,
  borderRadius: "8px",
  bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
  transition: "background-color 200ms",
  "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50) },
} as const;

/** The small upper-case caption over each group of actions. */
function GroupLabel({ children }: { children: string }) {
  return (
    <Typography
      component="span"
      sx={{
        fontSize: "0.75rem",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: (t) => tokenAlpha(t.vars.palette.text.primary, 60),
      }}
    >
      {children}
    </Typography>
  );
}

interface GetMoreHelpProps {
  question: Question;
  selectedAnswer: string | null;
  onTopicClick?: (slug: string) => void;
}

export function GetMoreHelp({ question, selectedAnswer, onTopicClick }: GetMoreHelpProps) {
  const hasTopics = question.topics && question.topics.length > 0;
  const authUrl = question.forumUrl ? getForumAuthUrl(question.forumUrl) : null;
  const hasForum = !!authUrl;

  const licenseClass = getLicenseClass(question.displayName);

  const handleCopyPrompt = async () => {
    if (!selectedAnswer) return;

    const prompt = buildAiPrompt({
      questionText: question.question,
      options: question.options,
      userAnswer: selectedAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? null,
      licenseClass,
      subelement: question.subelement,
      questionId: question.displayName,
    });

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied! Paste into your favorite AI chatbot.");
      trackAiPromptCopied({
        question_id: question.displayName,
        is_correct: selectedAnswer === question.correctAnswer,
        license_class: licenseClass.toLowerCase(),
      });
    } catch {
      toast.error("Failed to copy prompt to clipboard");
    }
  };

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      {hasTopics && (
        <Box>
          <GroupLabel>Study</GroupLabel>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
            {question.topics!.map((topic) => (
              <ButtonBase key={topic.id} onClick={() => onTopicClick?.(topic.slug)} sx={actionSx}>
                <Box component={BookOpen} aria-hidden="true" sx={{ width: 16, height: 16, flexShrink: 0 }} />
                {topic.title}
              </ButtonBase>
            ))}
          </Box>
        </Box>
      )}

      <Box>
        <GroupLabel>Ask</GroupLabel>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
          {hasForum && (
            <ButtonBase component="a" href={authUrl!} target="_blank" rel="noopener noreferrer" sx={actionSx}>
              <Box component={Users} aria-hidden="true" sx={{ width: 16, height: 16, flexShrink: 0 }} />
              Discuss with Other Hams
              <Box component={ExternalLink} aria-hidden="true" sx={{ width: 12, height: 12, opacity: 0.5, flexShrink: 0 }} />
            </ButtonBase>
          )}

          <ButtonBase onClick={handleCopyPrompt} aria-label="Copy AI chatbot prompt to clipboard" sx={actionSx}>
            <Box component={Sparkles} aria-hidden="true" sx={{ width: 16, height: 16, flexShrink: 0 }} />
            Get AI Prompt
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}

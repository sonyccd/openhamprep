import { Question } from "@/hooks/useQuestions";
import { getSafeUrl } from "@/lib/utils";
import { buildAiPrompt, getLicenseClass } from "@/lib/aiPrompt";
import { trackAiPromptCopied } from "@/lib/amplitude";
import { toast } from "sonner";
import { BookOpen, Users, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

const actionStyle = "inline-flex items-center gap-2 text-sm text-foreground hover:text-foreground transition-colors py-2.5 px-4 rounded-lg bg-muted/30 hover:bg-muted/50";

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
    const prompt = buildAiPrompt({
      questionText: question.question,
      options: question.options,
      userAnswer: selectedAnswer ?? '',
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
    <div className="mt-8 space-y-4">
      {/* Study — topic lessons */}
      {hasTopics && (
        <div>
          <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Study</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {question.topics!.map((topic) => (
              <button
                key={topic.id}
                className={cn(actionStyle, onTopicClick && "cursor-pointer")}
                onClick={() => onTopicClick?.(topic.slug)}
              >
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                {topic.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ask — community and AI help */}
      <div>
        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Ask</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {hasForum && (
            <a
              href={authUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className={actionStyle}
            >
              <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
              Discuss with Other Hams
              <ExternalLink className="w-3 h-3 opacity-50 shrink-0" aria-hidden="true" />
            </a>
          )}

          <button
            onClick={handleCopyPrompt}
            className={actionStyle}
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            Get AI Prompt
          </button>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ohp/PageContainer";
import type { UseQuizSession } from "@/hooks/useQuizSession";

/**
 * The page frame every quiz mode renders into.
 *
 * Intentionally thin. The five modes turned out to share the wrapper, the
 * pending and failed states, and the footer note — but not their controls:
 * PracticeTest has a 35-question navigator and a Finish button,
 * WeakQuestionsReview has Randomize and Try Again, and only the three drill
 * modes share Previous/Skip/Next. Those live in QuizNavControls below rather
 * than behind flags here, so this component has no idea which mode it is.
 *
 * Stays Tailwind/shadcn on purpose — C4 ports it to MUI, and the point of
 * extracting it now is that C4 ports one frame instead of five.
 */
interface QuizShellProps {
  /** Mode-specific chrome above the question: score, progress, back links. */
  header?: ReactNode;
  /** Controls below the question. Rendered as given — the modes disagree on layout. */
  actions?: ReactNode;
  /** Centred note under the controls, e.g. "Question 3 of 12". Styling is shared, content is not. */
  footer?: ReactNode;
  /** The QuestionCard. */
  children: ReactNode;
  width?: "standard" | "narrow";
}

export function QuizShell({
  header,
  actions,
  footer,
  children,
  width = "standard",
}: QuizShellProps) {
  return (
    <PageContainer width={width} mobileNavPadding>
      {header}
      {children}
      {actions}
      {footer && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm mt-4"
        >
          {footer}
        </motion.p>
      )}
    </PageContainer>
  );
}

/** Questions are still loading. Every mode rendered its own copy of this. */
export function QuizShellPending({
  message,
  width = "standard",
}: {
  message?: string;
  width?: "standard" | "narrow";
}) {
  return (
    <PageContainer
      width={width}
      mobileNavPadding
      className="flex items-center justify-center"
    >
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </PageContainer>
  );
}

/** Questions failed to load, with the way back out. */
export function QuizShellError({
  message = "Failed to load questions",
  onBack,
  width = "standard",
}: {
  message?: string;
  onBack: () => void;
  width?: "standard" | "narrow";
}) {
  return (
    <PageContainer
      width={width}
      mobileNavPadding
      className="flex items-center justify-center"
    >
      <div className="text-center">
        <p className="text-destructive mb-4">{message}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    </PageContainer>
  );
}

/**
 * Previous / Skip / Next, driven entirely by the session.
 *
 * Only the three drill modes use this — they are the ones with a draw and a
 * history stack to move through. See the family analysis on issue #259.
 */
export function QuizNavControls({
  session,
  nextIcon = <ChevronRight className="w-4 h-4" />,
  className = "mt-8 flex justify-center gap-4",
}: {
  session: UseQuizSession;
  nextIcon?: ReactNode;
  /**
   * Only here because the modes disagree on the gap above the controls —
   * mt-10 in random and subelement practice, mt-8 in chapter practice and weak
   * questions. Two against two, so there is no drift to quietly correct, and
   * changing either pair would be a visual change this extraction is not
   * supposed to make. Worth settling when C4 gives these screens a design pass;
   * until then each mode keeps the spacing it had.
   */
  className?: string;
}) {
  const { showResult, canGoBack, isViewingHistory } = session;

  return (
    <div className={className}>
      {canGoBack && (
        <Button variant="outline" onClick={session.previous} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
      )}
      {!showResult ? (
        <Button variant="outline" onClick={session.skip} className="gap-2">
          <SkipForward className="w-4 h-4" />
          Skip Question
        </Button>
      ) : (
        <Button onClick={session.next} variant="default" size="lg" className="gap-2">
          {isViewingHistory ? "Next" : "Next Question"}
          {nextIcon}
        </Button>
      )}
    </div>
  );
}

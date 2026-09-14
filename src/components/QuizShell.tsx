import type { ReactNode } from "react";
import { SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import type { SxProps, Theme } from "@mui/material/styles";
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
 * Extracting it before the MUI port was the point: C4 ported one frame instead
 * of five.
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
        <MotionBox
          // Was a <motion.p>. Box defaults to a div, so without this the note
          // silently stops being a paragraph and drops out of a screen
          // reader's paragraph navigation.
          component="p"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.875rem", mt: 2 }}
        >
          {footer}
        </MotionBox>
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
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        {message && <Typography sx={{ color: "text.secondary" }}>{message}</Typography>}
      </Box>
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
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ color: "error.main", mb: 2 }}>{message}</Typography>
        <Button variant="contained" onClick={onBack}>
          Go Back
        </Button>
      </Box>
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
  nextIcon = <Box component={ChevronRight} sx={{ width: 16, height: 16 }} />,
  sx,
}: {
  session: UseQuizSession;
  nextIcon?: ReactNode;
  /**
   * Only here because the modes disagree on the gap above the controls — mt-10
   * in random and subelement practice, mt-8 in chapter practice and weak
   * questions. Two against two, so there is no drift to quietly correct, and
   * changing either pair would be a visual change. C0 flagged this as worth
   * settling "when C4 gives these screens a design pass"; C4 turned out to be a
   * port rather than a redesign, so it is still open.
   */
  sx?: SxProps<Theme>;
}) {
  const { showResult, canGoBack, isViewingHistory } = session;

  return (
    <Box sx={[{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {/*
        Text buttons, not the IconButton + Tooltip the C4 issue prescribes.
        These carry visible labels today; making them icon-only would be a
        visual regression and would put the label behind a hover.
      */}
      {canGoBack && (
        <Button
          variant="outlined"
          onClick={session.previous}
          startIcon={<Box component={ChevronLeft} sx={{ width: 16, height: 16 }} />}
        >
          Previous
        </Button>
      )}
      {!showResult ? (
        <Button
          variant="outlined"
          onClick={session.skip}
          startIcon={<Box component={SkipForward} sx={{ width: 16, height: 16 }} />}
        >
          Skip Question
        </Button>
      ) : (
        <Button variant="contained" size="large" onClick={session.next} endIcon={nextIcon}>
          {isViewingHistory ? "Next" : "Next Question"}
        </Button>
      )}
    </Box>
  );
}

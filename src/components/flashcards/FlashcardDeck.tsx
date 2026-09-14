import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import { ArrowLeft } from "lucide-react";
import { FlashcardControls } from "./FlashcardControls";
import { FlashcardFace } from "./FlashcardFace";
import type { FlashcardMode } from "./types";

interface FlashcardDeckProps {
  mode: FlashcardMode;
  front?: string;
  back?: string;
  isFlipped: boolean;
  currentIndex: number;
  total: number;
  knownCount: number;
  unknownCount: number;
  sessionProgress: number;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMarkKnown: () => void;
  onMarkUnknown: () => void;
  onBack: () => void;
}

export function FlashcardDeck({
  mode,
  front,
  back,
  isFlipped,
  currentIndex,
  total,
  knownCount,
  unknownCount,
  sessionProgress,
  onFlip,
  onPrev,
  onNext,
  onMarkKnown,
  onMarkUnknown,
  onBack,
}: FlashcardDeckProps) {
  const showingTerm =
    (mode === "term-to-definition" && !isFlipped) ||
    (mode === "definition-to-term" && isFlipped);
  const faceLabel = showingTerm ? "Term" : "Definition";

  return (
    <>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Button
          variant="text"
          size="small"
          onClick={onBack}
          startIcon={<Box component={ArrowLeft} sx={{ width: 16, height: 16 }} />}
          sx={{ ml: -1, color: "text.secondary" }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Back
          </Box>
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: "0.875rem" }}>
            <Box component="span" sx={{ color: "success.main", fontFamily: "monospace" }}>
              {knownCount}
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              /
            </Box>
            <Box component="span" sx={{ color: "error.main", fontFamily: "monospace" }}>
              {unknownCount}
            </Box>
          </Box>
          <Box sx={{ fontFamily: "monospace", color: "text.secondary" }}>
            {currentIndex + 1}
            <Box component="span" sx={{ opacity: 0.5 }}>
              /{total}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={sessionProgress}
          aria-label="Session progress"
          aria-valuetext={`${knownCount + unknownCount} of ${total} cards reviewed`}
          sx={{ height: 4, borderRadius: "9999px", bgcolor: "secondary.main" }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          width: "100%",
        }}
      >
        <FlashcardFace
          faceLabel={faceLabel}
          content={isFlipped ? back : front}
          showingTerm={showingTerm}
          isFlipped={isFlipped}
          currentIndex={currentIndex}
          onFlip={onFlip}
        />
        <FlashcardControls
          currentIndex={currentIndex}
          total={total}
          onPrev={onPrev}
          onNext={onNext}
          onMarkKnown={onMarkKnown}
          onMarkUnknown={onMarkUnknown}
        />
      </Box>
    </>
  );
}

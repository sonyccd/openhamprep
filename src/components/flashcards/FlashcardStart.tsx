import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { ArrowLeft, Shuffle, Waves } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";

export type FlashcardMode = "term-to-definition" | "definition-to-term";

interface FlashcardStartProps {
  termCount: number;
  mode: FlashcardMode;
  onModeChange: (mode: FlashcardMode) => void;
  onStart: () => void;
  onBack: () => void;
}

export function FlashcardStart({
  termCount,
  mode,
  onModeChange,
  onStart,
  onBack,
}: FlashcardStartProps) {
  return (
    <>
      <Button
        variant="text"
        onClick={onBack}
        startIcon={<Box component={ArrowLeft} sx={{ width: 16, height: 16 }} />}
        sx={{ alignSelf: "flex-start", mb: 4, color: "text.secondary" }}
      >
        Back
      </Button>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ textAlign: "center", mb: 5 }}
        >
          <Box
            sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
          >
            <Box
              component={Waves}
              aria-hidden="true"
              sx={{ width: 24, height: 24, color: "primary.main" }}
            />
            <Typography
              component="h1"
              sx={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.025em" }}
            >
              Study Terms
            </Typography>
            <Box
              component={Waves}
              aria-hidden="true"
              sx={{ width: 24, height: 24, color: "primary.main" }}
            />
          </Box>
          <Typography sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {termCount} TERMS LOADED
          </Typography>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          sx={{ width: "100%", maxWidth: 384, mb: 5 }}
        >
          <Typography
            id="flashcard-mode-label"
            sx={{
              fontSize: "0.875rem",
              fontFamily: "monospace",
              color: "text.secondary",
              mb: 1.5,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Select Mode
          </Typography>
          {/*
            ToggleButtonGroup, which is the native exclusive-choice control.
            What it replaces was two bare <button>s with a spring-animated pill
            sliding behind them: no group role, no pressed state, and the
            selection readable only from colour. The sliding pill is gone with
            it — flagged for the design pass rather than rebuilt by hand.
          */}
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={mode}
            onChange={(_event, next: FlashcardMode | null) => next && onModeChange(next)}
            aria-labelledby="flashcard-mode-label"
            sx={{ bgcolor: "background.paper" }}
          >
            <ToggleButton value="term-to-definition">Term → Definition</ToggleButton>
            <ToggleButton value="definition-to-term">Definition → Term</ToggleButton>
          </ToggleButtonGroup>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={onStart}
            startIcon={<Box component={Shuffle} sx={{ width: 20, height: 20 }} />}
            sx={{ px: 4, py: 1.5, fontSize: "1.125rem", fontWeight: 600, borderRadius: 1 }}
          >
            Start Studying
          </Button>
        </MotionBox>
      </Box>
    </>
  );
}

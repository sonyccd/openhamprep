import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FlashcardControlsProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onMarkKnown: () => void;
  onMarkUnknown: () => void;
}

/** Step back, mark the card, step forward. */
export function FlashcardControls({
  currentIndex,
  total,
  onPrev,
  onNext,
  onMarkKnown,
  onMarkUnknown,
}: FlashcardControlsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        mt: 4,
        width: "100%",
        maxWidth: 448,
      }}
    >
      <IconButton
        aria-label="Previous term"
        onClick={onPrev}
        disabled={currentIndex === 0}
        sx={{ width: 40, height: 40, color: "text.secondary" }}
      >
        <Icon icon={ChevronLeft} size={20} />
      </IconButton>

      <Button
        variant="outlined"
        color="error"
        onClick={onMarkUnknown}
        sx={{ flex: 1, maxWidth: 140, py: 1.25, borderRadius: 1, gap: 1 }}
      >
        <Box component="span" aria-hidden="true" sx={{ fontSize: "1.125rem" }}>
          ✗
        </Box>
        Review
      </Button>

      <Button
        variant="contained"
        color="success"
        onClick={onMarkKnown}
        sx={{ flex: 1, maxWidth: 140, py: 1.25, borderRadius: 1, gap: 1 }}
      >
        <Box component="span" aria-hidden="true" sx={{ fontSize: "1.125rem" }}>
          ✓
        </Box>
        Got It
      </Button>

      <IconButton
        aria-label="Next term"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        sx={{ width: 40, height: 40, color: "text.secondary" }}
      >
        <Icon icon={ChevronRight} size={20} />
      </IconButton>
    </Box>
  );
}

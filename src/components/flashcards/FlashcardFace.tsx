import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { AnimatePresence } from "framer-motion";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface FlashcardFaceProps {
  faceLabel: string;
  content?: string;
  showingTerm: boolean;
  isFlipped: boolean;
  /** Part of the animation key, so a new card cross-fades. */
  currentIndex: number;
  onFlip: () => void;
}

/** The card itself: which face it is, what it says, and the tap affordance. */
export function FlashcardFace({
  faceLabel,
  content,
  showingTerm,
  isFlipped,
  currentIndex,
  onFlip,
}: FlashcardFaceProps) {
  return (
    <Box sx={{ width: { xs: "100%", sm: 448 }, px: { xs: 2, sm: 0 } }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: "16px",
          borderWidth: 2,
          transition: "border-color 300ms, box-shadow 300ms",
          boxShadow: 3,
          borderColor: isFlipped
            ? (t) => tokenAlpha(t.vars.palette.primary.main, 40)
            : "divider",
          "&:hover": {
            boxShadow: 6,
            borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 30),
          },
        }}
      >
        {/*
          CardActionArea, not the <div onClick> this replaces. The card was
          flippable by mouse only — no role, no tab stop, no Enter/Space —
          so the whole exercise was unusable from the keyboard. aria-pressed
          reports which face is showing, since that is the state the click
          toggles.
        */}
        <CardActionArea
          onClick={onFlip}
          aria-pressed={isFlipped}
          aria-label={isFlipped ? "Hide the answer" : "Reveal the answer"}
          sx={{
            height: { xs: 300, sm: 320 },
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2, height: 28 }}>
            <Chip
              label={faceLabel}
              size="small"
              sx={{
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                ...(isFlipped
                  ? {
                      bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                      color: "primary.main",
                    }
                  : { bgcolor: "secondary.main", color: "text.secondary" }),
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <AnimatePresence mode="wait">
              <MotionBox
                key={`${currentIndex}-${isFlipped}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflowY: "auto",
                  px: 1,
                }}
              >
                <Typography
                  component="p"
                  sx={{
                    textAlign: "center",
                    lineHeight: 1.625,
                    ...(showingTerm
                      ? {
                          fontSize: { xs: "1.25rem", sm: "1.5rem" },
                          fontWeight: 700,
                          color: "text.primary",
                        }
                      : {
                          fontSize: { xs: "1rem", sm: "1.125rem" },
                          color: (t) => tokenAlpha(t.vars.palette.text.primary, 90),
                        }),
                  }}
                >
                  {content}
                </Typography>
              </MotionBox>
            </AnimatePresence>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, height: 20 }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: (t) => tokenAlpha(t.vars.palette.text.secondary, 70),
              }}
            >
              {isFlipped ? "tap to hide" : "tap to reveal"}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Box>
  );
}

import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";
import { AnimatePresence } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";

interface StreakIndicatorProps {
  streak: number;
  /** True for a moment after a milestone, to play the trophy burst. */
  celebrating: boolean;
}

/**
 * The flame-and-count that appears once a run of correct answers starts.
 *
 * Only shown while there is a streak; the enter/exit slide is what tells the
 * user it started or broke. The count has a hidden "streak" label — as with
 * the scoreline, a bare number next to an icon is just a number to a screen
 * reader.
 */
export function StreakIndicator({ streak, celebrating }: StreakIndicatorProps) {
  return (
    <AnimatePresence>
      {streak > 0 && (
        <MotionBox
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          sx={{
            ml: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "primary.main",
            position: "relative",
          }}
        >
          {celebrating && (
            <MotionBox
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 2, 1], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1 }}
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box component={Trophy} sx={{ width: 24, height: 24 }} />
            </MotionBox>
          )}
          <Box
            component={Flame}
            aria-hidden="true"
            sx={{
              width: 16,
              height: 16,
              // The flame pulses once the streak is worth noticing.
              ...(streak >= 5 && {
                animation: "streak-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "@keyframes streak-pulse": { "50%": { opacity: 0.5 } },
              }),
            }}
          />
          <Box component="span" sx={{ fontWeight: 600 }}>
            {streak}
            <Box component="span" sx={visuallyHidden}>
              {" "}
              streak
            </Box>
          </Box>
        </MotionBox>
      )}
    </AnimatePresence>
  );
}

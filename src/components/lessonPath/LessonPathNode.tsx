import Box from "@mui/material/Box";
import { Check, Lock, Zap } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { glow, type NodeState } from "./nodeState";

interface LessonPathNodeProps {
  state: NodeState;
  index: number;
}

/**
 * The 48px circle at the head of a lesson-path row: a tick, a bolt, a lock or
 * the step number, with the pulsing halo on the current step and the small
 * numbered badge on a completed one. Spans throughout — it renders inside the
 * row's <button>.
 */
export function LessonPathNode({ state, index }: LessonPathNodeProps) {
  const completed = state === "completed";
  const isCurrent = state === "current";
  const isLocked = state === "locked";

  return (
      <Box component="span" sx={{ position: "relative", flexShrink: 0, display: "block" }}>
        {isCurrent && (
          <MotionBox
            component="span"
            aria-hidden="true"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            sx={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              display: "block",
              bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 20),
            }}
          />
        )}

        <MotionBox
          component="span"
          className="LessonPath-node"
          whileHover={!isLocked ? { scale: 1.05 } : undefined}
          whileTap={!isLocked ? { scale: 0.98 } : undefined}
          sx={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid",
            transition: "border-color 300ms, box-shadow 300ms, background-color 300ms",
            ...(state === "completed" && {
              bgcolor: "success.main",
              borderColor: "success.main",
              color: "success.contrastText",
              boxShadow: (t) => glow(t, "success", 20, 40),
            }),
            ...(state === "current" && {
              bgcolor: "primary.main",
              borderColor: "primary.main",
              color: "primary.contrastText",
              boxShadow: (t) => glow(t, "primary", 25, 50),
            }),
            ...(state === "locked" && {
              bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
              borderColor: "divider",
              color: "text.secondary",
            }),
            ...(state === "upcoming" && {
              bgcolor: "background.paper",
              borderColor: "divider",
              color: "text.primary",
            }),
          }}
        >
          {completed ? (
            <MotionBox
              component="span"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              sx={{ display: "flex" }}
            >
              <Box component={Check} aria-hidden="true" sx={{ width: 20, height: 20, strokeWidth: 3 }} />
            </MotionBox>
          ) : isCurrent ? (
            <Box component={Zap} aria-hidden="true" sx={{ width: 20, height: 20, fill: "currentColor" }} />
          ) : isLocked ? (
            <Box component={Lock} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          ) : (
            <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.875rem" }}>
              {index + 1}
            </Box>
          )}
        </MotionBox>

        {completed && (
          <Box
            component="span"
            sx={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: "50%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "success.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: 700,
              color: "success.main",
            }}
          >
            {index + 1}
          </Box>
        )}
      </Box>

  );
}

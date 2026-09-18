import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";
import { ChevronRight } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import type { LessonTopic } from "@/types/lessons";
import { LessonPathNode } from "./LessonPathNode";
import { glow, toneFor, type NodeState } from "./nodeState";

interface LessonPathRowProps {
  topic: NonNullable<LessonTopic["topic"]>;
  index: number;
  state: NodeState;
  onClick: () => void;
}

/**
 * One topic in the path: the node, the title and description, the subelement
 * chips, and the chevron.
 *
 * The whole row is the button. Everything inside is a span: a <button> takes
 * phrasing content only, and the old markup nested divs, an <h3> and a <p> in
 * it.
 */
export function LessonPathRow({ topic, index, state, onClick }: LessonPathRowProps) {
  const completed = state === "completed";
  const isCurrent = state === "current";
  const isLocked = state === "locked";
  const tone = toneFor(state);

  return (
    <Box
      component="button"
      type="button"
      onClick={() => !isLocked && onClick()}
      disabled={isLocked}
      aria-current={isCurrent ? "step" : undefined}
      sx={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        width: "100%",
        textAlign: "left",
        py: 2,
        pr: 2,
        pl: 0,
        bgcolor: "transparent",
        border: 0,
        borderRadius: "8px",
        color: "inherit",
        font: "inherit",
        cursor: isLocked ? "default" : "pointer",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
          outlineOffset: 2,
        },
        "&:hover .LessonPath-title": state === "upcoming" ? { color: "primary.main" } : {},
        "&:hover .LessonPath-node": state === "upcoming"
          ? { borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50), boxShadow: (t) => glow(t, "primary", 15, 20) }
          : {},
        "&:hover .LessonPath-arrow": {
          ...(tone && { bgcolor: (t) => tokenAlpha(t.vars.palette[tone].main, 10) }),
          ...(state === "upcoming" && { color: "primary.main", bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10) }),
        },
      }}
    >
      <LessonPathNode state={state} index={index} />

      {/* Content */}
      <Box
        component="span"
        sx={{ flex: 1, minWidth: 0, py: 0.25, display: "block", transition: "opacity 300ms", opacity: isLocked ? 0.5 : 1 }}
      >
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Box
            component="span"
            className="LessonPath-title"
            sx={{
              fontFamily: "monospace",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: "-0.025em",
              transition: "color 150ms",
              color:
                state === "completed" ? "success.main"
                : state === "current" ? "primary.main"
                : state === "locked" ? "text.secondary"
                : "text.primary",
            }}
          >
            {topic.title}
          </Box>
          {isCurrent && (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                height: 20,
                px: 0.75,
                borderRadius: "4px",
                border: "1px solid",
                borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
                bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                color: "primary.main",
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Next
            </Box>
          )}
        </Box>

        {topic.description && (
          <Box
            component="span"
            sx={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              fontSize: "0.875rem",
              lineHeight: 1.625,
              mb: 1.25,
              color: completed ? (t) => tokenAlpha(t.vars.palette.success.main, 70) : "text.secondary",
            }}
          >
            {topic.description}
          </Box>
        )}

        {topic.subelements && topic.subelements.length > 0 && (
          <Box component="span" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {topic.subelements.slice(0, 4).map((sub) => (
              <Box
                key={sub.id}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.25,
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  fontWeight: 500,
                  letterSpacing: "0.025em",
                  border: "1px solid",
                  transition: "color 150ms, background-color 150ms",
                  ...(tone
                    ? {
                        bgcolor: (t) => tokenAlpha(t.vars.palette[tone].main, 15),
                        borderColor: (t) => tokenAlpha(t.vars.palette[tone].main, 30),
                        color: `${tone}.main`,
                      }
                    : { bgcolor: "muted", borderColor: "divider", color: "text.secondary" }),
                }}
              >
                {sub.subelement}
              </Box>
            ))}
            {topic.subelements.length > 4 && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.25,
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "text.secondary",
                  bgcolor: "muted",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                +{topic.subelements.length - 4}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Action indicator */}
      <Box component="span" sx={{ flexShrink: 0, alignSelf: "center", transition: "opacity 300ms", opacity: isLocked ? 0 : 1 }}>
        <MotionBox
          component="span"
          className="LessonPath-arrow"
          whileHover={{ x: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 150ms, background-color 150ms",
            color: tone ? `${tone}.main` : "text.secondary",
          }}
        >
          <Box component={ChevronRight} aria-hidden="true" sx={{ width: 20, height: 20 }} />
        </MotionBox>
      </Box>

      {/* Appends to the button's content-derived name rather than
          overriding it, so the title, description and badges survive. */}
      {completed && (
        <Box component="span" sx={visuallyHidden}>
          (completed)
        </Box>
      )}
    </Box>

  );
}

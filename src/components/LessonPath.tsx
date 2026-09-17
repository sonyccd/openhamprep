import Box from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import { Check, ChevronRight, Lock, Zap } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { LessonTopic } from "@/types/lessons";

interface TopicProgress {
  topic_id: string;
  is_completed: boolean;
}

interface LessonPathProps {
  topics: LessonTopic[];
  topicProgress: TopicProgress[] | undefined;
  currentTopicIndex: number;
  onTopicClick: (slug: string) => void;
}

type NodeState = "completed" | "current" | "locked" | "upcoming";

/**
 * Per-state styling, keyed once rather than repeated as four cn() branches per
 * element. `tone` is the palette key the state draws on; "upcoming" has none
 * and takes neutral surfaces.
 */
const TONE: Record<Exclude<NodeState, "upcoming">, "success" | "primary"> = {
  completed: "success",
  current: "primary",
  locked: "primary", // unused for locked; it is styled neutrally below
};

const glow = (t: Theme, key: "success" | "primary", px: number, pct: number) =>
  `0 0 ${px}px ${tokenAlpha(t.vars.palette[key].main, pct)}`;

export function LessonPath({
  topics,
  topicProgress,
  currentTopicIndex,
  onTopicClick,
}: LessonPathProps) {
  const isCompleted = (topicId: string) =>
    topicProgress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;

  return (
    <Box sx={{ position: "relative" }}>
      {topics.map((lessonTopic, index) => {
        const topic = lessonTopic.topic;
        if (!topic) return null;

        const completed = isCompleted(topic.id);
        const isCurrent = index === currentTopicIndex;
        const isLocked = !completed && index > currentTopicIndex;
        const isLast = index === topics.length - 1;
        const state: NodeState = completed
          ? "completed"
          : isCurrent
            ? "current"
            : isLocked
              ? "locked"
              : "upcoming";
        const tone = state === "completed" || state === "current" ? TONE[state] : null;

        return (
          <MotionBox
            key={lessonTopic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            sx={{ position: "relative" }}
          >
            {/* Connecting track behind the nodes */}
            {!isLast && (
              <Box sx={{ position: "absolute", left: 22, top: 48, width: 4, height: "100%", zIndex: 0 }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "9999px",
                    bgcolor: (t) => tokenAlpha(t.vars.palette.divider, 50),
                  }}
                />
                <MotionBox
                  initial={{ height: 0 }}
                  animate={{ height: completed ? "100%" : "0%" }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    borderRadius: "9999px",
                    bgcolor: completed
                      ? "success.main"
                      : (t) => tokenAlpha(t.vars.palette.divider, 30),
                  }}
                />
              </Box>
            )}

            {/* The whole row is the button. Everything inside is a span: a
                <button> takes phrasing content only, and the old markup nested
                divs, an <h3> and a <p> in it. */}
            <Box
              component="button"
              type="button"
              onClick={() => !isLocked && onTopicClick(topic.slug)}
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
              {/* Node */}
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

            {!isLast && <Box sx={{ height: 8 }} />}
          </MotionBox>
        );
      })}

      {topics.length === 0 && (
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: "center", py: 8 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              borderRadius: "50%",
              bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box component={Zap} aria-hidden="true" sx={{ width: 32, height: 32, color: "text.secondary" }} />
          </Box>
          <Box sx={{ color: "text.secondary", fontWeight: 500 }}>
            No topics have been added to this lesson yet.
          </Box>
        </MotionBox>
      )}
    </Box>
  );
}

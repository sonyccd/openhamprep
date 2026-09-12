import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { CheckCircle2, Route } from "lucide-react";
import { Lesson } from "@/types/lessons";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface LessonCardProps {
  lesson: Lesson;
  completion: {
    total: number;
    completed: number;
    percentage: number;
  };
  onClick: () => void;
}

// Tailwind's line-clamp-2 has no MUI prop equivalent.
const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

export function LessonCard({ lesson, completion, onClick }: LessonCardProps) {
  const isComplete = completion.percentage === 100;

  return (
    <Card
      sx={{
        overflow: "hidden",
        transition: "transform 200ms, box-shadow 200ms",
        "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
        // Was ring-2 ring-success/50 on the completed card.
        ...(isComplete && {
          outline: "2px solid",
          outlineColor: (theme) => tokenAlpha(theme.vars.palette.success.main, 50),
        }),
      }}
    >
      {/*
        CardActionArea renders a real button, so Enter and Space work natively.
        This replaces a div carrying role="button", tabIndex={0} and a
        hand-rolled Enter/Space handler — the same pattern that turned out to be
        broken in HamRadioToolCard (#272), and which nothing here tested.
      */}
      <CardActionArea
        onClick={onClick}
        aria-label={`${lesson.title}, ${completion.percentage}% complete${isComplete ? " (completed)" : ""}`}
        // Replaces group-hover:, which has no MUI equivalent: the hover lives on
        // this element and the transforms apply to descendants.
        sx={{
          "&:hover .LessonCard-thumb": { transform: "scale(1.05)" },
          "&:hover .LessonCard-title": { color: "primary.main" },
          // Material's focus-visible is a translucent tint over the surface,
          // which all but disappears over the thumbnail. The card previously
          // had focus-visible:ring-2 ring-offset-2, so keyboard users got a
          // distinct ring; this restores that.
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
          // The tint would otherwise sit on top of the restored ring.
          "& .MuiCardActionArea-focusHighlight": { opacity: 0 },
        }}
      >
        <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "muted", overflow: "hidden" }}>
          {lesson.thumbnail_url ? (
            <Box
              component="img"
              className="LessonCard-thumb"
              src={lesson.thumbnail_url}
              alt={lesson.title}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 300ms",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: (theme) =>
                  `linear-gradient(to bottom right, ${tokenAlpha(theme.vars.palette.accent, 10)}, ${tokenAlpha(theme.vars.palette.accent, 5)})`,
              }}
            >
              <Box
                component={Route}
                aria-hidden="true"
                sx={{ width: 48, height: 48, color: (theme) => tokenAlpha(theme.vars.palette.accent, 40) }}
              />
            </Box>
          )}

          {isComplete && (
            <Chip
              size="small"
              icon={<Box component={CheckCircle2} sx={{ width: 12, height: 12 }} />}
              label="Completed"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "success.main",
                color: "success.contrastText",
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          )}

          <Chip
            size="small"
            label={`${completion.completed}/${completion.total} topics`}
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              fontSize: "0.75rem",
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.background.default, 80),
              backdropFilter: "blur(4px)",
            }}
          />
        </Box>

        <CardContent sx={{ p: 2, width: "100%" }}>
          <Typography
            variant="subtitle1"
            // span, not h3. CardActionArea renders a real <button>, and a
            // button may contain only phrasing content — a heading there is
            // invalid HTML. Nothing is lost: ARIA gives button presentational
            // children, so the h3 inside the old role="button" div was never
            // exposed as a heading either, and the accessible name comes from
            // the aria-label on the button regardless.
            component="span"
            className="LessonCard-title"
            sx={{ display: "block", fontWeight: 600, mb: 1, transition: "color 200ms", ...clamp2 }}
          >
            {lesson.title}
          </Typography>
          {lesson.description && (
            <Typography
              variant="body2"
              // body2 maps to <p>, which is flow content — same problem as the
              // heading above.
              component="span"
              sx={{ display: "block", color: "text.secondary", ...clamp2 }}
            >
              {lesson.description}
            </Typography>
          )}

          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ display: "block", color: "text.secondary", mb: 0.75 }}
            >
              {completion.percentage}% complete
            </Typography>
            <Box sx={{ height: 6, bgcolor: "muted", borderRadius: 999, overflow: "hidden" }}>
              {/*
                Kept on framer-motion rather than moved to LinearProgress: the
                fill grows from zero on mount, and LinearProgress renders a
                static determinate value with no entry animation.
              */}
              <MotionBox
                sx={{
                  height: "100%",
                  borderRadius: 999,
                  bgcolor: isComplete ? "success.main" : "primary.main",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${completion.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

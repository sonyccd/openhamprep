import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { CheckCircle2, FileText } from "lucide-react";
import { Topic } from "@/hooks/useTopics";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicCardProps {
  topic: Topic;
  isCompleted?: boolean;
  onClick: () => void;
}

// Tailwind's line-clamp-2 has no MUI prop equivalent.
const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const overlayChip = {
  fontSize: "0.75rem",
  bgcolor: (theme) => tokenAlpha(theme.vars.palette.background.default, 80),
  backdropFilter: "blur(4px)",
} as const;

export function TopicCard({ topic, isCompleted = false, onClick }: TopicCardProps) {
  const subelements = topic.subelements ?? [];

  return (
    <Card
      sx={{
        overflow: "hidden",
        transition: "transform 200ms, box-shadow 200ms",
        "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
        // Was ring-2 ring-success/50 on the completed card.
        ...(isCompleted && {
          outline: "2px solid",
          outlineColor: (theme) => tokenAlpha(theme.vars.palette.success.main, 50),
        }),
      }}
    >
      {/* A real button, so Enter and Space work natively — see LessonCard. */}
      <CardActionArea
        onClick={onClick}
        aria-label={`${topic.title}${isCompleted ? " (completed)" : ""}`}
        sx={{
          "&:hover .TopicCard-thumb": { transform: "scale(1.05)" },
          "&:hover .TopicCard-title": { color: "primary.main" },
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
        <Box
          sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "muted", overflow: "hidden" }}
        >
          {topic.thumbnail_url ? (
            <Box
              component="img"
              className="TopicCard-thumb"
              src={topic.thumbnail_url}
              alt={topic.title}
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
                // primary here, where LessonCard uses accent — the two card
                // types are deliberately tinted differently.
                background: (theme) =>
                  `linear-gradient(to bottom right, ${tokenAlpha(theme.vars.palette.primary.main, 10)}, ${tokenAlpha(theme.vars.palette.primary.main, 5)})`,
              }}
            >
              <Box
                component={FileText}
                aria-hidden="true"
                sx={{
                  width: 48,
                  height: 48,
                  color: (theme) => tokenAlpha(theme.vars.palette.primary.main, 40),
                }}
              />
            </Box>
          )}

          {isCompleted && (
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

          {subelements.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                left: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
              }}
            >
              {subelements.slice(0, 3).map((sub) => (
                <Chip key={sub.id} size="small" label={sub.subelement} sx={overlayChip} />
              ))}
              {subelements.length > 3 && (
                <Chip size="small" label={`+${subelements.length - 3}`} sx={overlayChip} />
              )}
            </Box>
          )}
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
            className="TopicCard-title"
            sx={{ display: "block", fontWeight: 600, mb: 1, transition: "color 200ms", ...clamp2 }}
          >
            {topic.title}
          </Typography>
          {topic.description && (
            <Typography
              variant="body2"
              // body2 maps to <p>, which is flow content — same problem as the
              // heading above.
              component="span"
              sx={{ display: "block", color: "text.secondary", ...clamp2 }}
            >
              {topic.description}
            </Typography>
          )}

          {topic.resources && topic.resources.length > 0 && (
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
            >
              {topic.resources.length} resource{topic.resources.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

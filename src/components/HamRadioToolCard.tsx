import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { ExternalLink, Wrench } from "lucide-react";
import { HamRadioTool, getToolImageUrl } from "@/hooks/useHamRadioTools";
import { tokenAlpha } from "@/theme/muiTheme";

interface HamRadioToolCardProps {
  tool: HamRadioTool;
}

// Tailwind's line-clamp-2 has no MUI prop equivalent.
const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const overlayChip = {
  bgcolor: (theme) => tokenAlpha(theme.vars.palette.background.default, 80),
  backdropFilter: "blur(4px)",
} as const;

export function HamRadioToolCard({ tool }: HamRadioToolCardProps) {
  const imageUrl = getToolImageUrl(tool);

  return (
    /*
      Still a plain anchor, deliberately — this opens an external site, and the
      element already has the right semantics and native Enter activation.
      CardActionArea was the answer for LessonCard and TopicCard because those
      were divs pretending to be buttons; there is nothing to fix here, and
      routing a link through ButtonBase would add button behaviour (ripple,
      Space activation) that a link should not have.

      It also keeps the heading below meaningful. ARIA gives `button`
      presentational children, which is why the other two cards had to drop
      their <h3>; `link` is not on that list, so this one is genuinely exposed
      to assistive tech and should stay a heading.
    */
    <Box
      component="a"
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${tool.title} (opens in new tab)`}
      sx={{
        display: "block",
        borderRadius: 2,
        textDecoration: "none",
        color: "inherit",
        "&:focus": { outline: "none" },
        // Was focus-visible:ring-2 ring-offset-2 on this anchor.
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
        "&:hover .HamRadioToolCard-thumb": { transform: "scale(1.05)" },
        "&:hover .HamRadioToolCard-title": { color: "primary.main" },
      }}
    >
      <Card
        sx={{
          height: "100%",
          overflow: "hidden",
          transition: "transform 200ms, box-shadow 200ms",
          "a:hover &": { transform: "scale(1.02)", boxShadow: 6 },
        }}
      >
        <Box
          sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "muted", overflow: "hidden" }}
        >
          {imageUrl ? (
            <Box
              component="img"
              className="HamRadioToolCard-thumb"
              src={imageUrl}
              alt={tool.title}
              loading="lazy"
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
                  `linear-gradient(to bottom right, ${tokenAlpha(theme.vars.palette.primary.main, 10)}, ${tokenAlpha(theme.vars.palette.primary.main, 5)})`,
              }}
            >
              <Box
                component={Wrench}
                aria-hidden="true"
                sx={{
                  width: 48,
                  height: 48,
                  color: (theme) => tokenAlpha(theme.vars.palette.primary.main, 40),
                }}
              />
            </Box>
          )}

          <Chip
            size="small"
            aria-hidden="true"
            label={<Box component={ExternalLink} sx={{ width: 12, height: 12, display: "block" }} />}
            sx={{ position: "absolute", top: 8, right: 8, ...overlayChip }}
          />

          {tool.category && (
            <Chip
              size="small"
              label={tool.category.name}
              sx={{
                position: "absolute",
                bottom: 8,
                left: 8,
                fontSize: "0.75rem",
                ...overlayChip,
              }}
            />
          )}
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            component="h3"
            className="HamRadioToolCard-title"
            sx={{ fontWeight: 600, mb: 1, transition: "color 200ms", ...clamp2 }}
          >
            {tool.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", ...clamp2 }}>
            {tool.description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

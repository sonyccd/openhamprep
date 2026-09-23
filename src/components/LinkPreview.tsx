import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { ExternalLink } from "lucide-react";
import type { LinkData } from "@/hooks/useQuestions";
import { LINK_TYPE_CONFIG, type LinkType } from "@/lib/resourceTypes";
import { tokenAlpha } from "@/theme/muiTheme";

interface LinkPreviewProps {
  link: LinkData;
}

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
});

/** One external resource: its kind, title, blurb and thumbnail, as a single link. */
export function LinkPreview({ link }: LinkPreviewProps) {
  const config = LINK_TYPE_CONFIG[link.type as LinkType];
  const TypeIcon = config?.icon;
  const typeLabel = config?.label ?? "Link";
  const token = config?.token ?? "text.secondary";

  const linkTitle = link.title || link.url;

  return (
    <ButtonBase
      component="a"
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${linkTitle} (opens in new tab)`}
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 2,
        p: 2,
        borderRadius: "8px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (t) => tokenAlpha(t.vars.palette.background.paper, 50),
        textAlign: "left",
        transition: "all 200ms",
        "&:hover": {
          bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
          borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 30),
          ".LinkPreview-title, .LinkPreview-open": { color: "primary.main" },
        },
      }}
    >
      {link.image && (
        <Box sx={{ flexShrink: 0, width: 96, height: 96, borderRadius: "6px", overflow: "hidden", bgcolor: "secondary.main" }}>
          <Box
            component="img"
            src={link.image}
            alt={link.title}
            width={96}
            height={96}
            loading="lazy"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: token,
              bgcolor: "secondary.main",
            }}
          >
            {TypeIcon && <Box component={TypeIcon} aria-hidden="true" sx={{ width: 12, height: 12 }} />}
            {typeLabel}
          </Box>
          {link.siteName && (
            <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", ...clamp(1) }}>
              {link.siteName}
            </Box>
          )}
        </Box>

        <Typography
          component="h4"
          className="LinkPreview-title"
          sx={{ fontWeight: 500, mb: 0.5, transition: "color 200ms", ...clamp(2) }}
        >
          {link.title || link.url}
        </Typography>

        {link.description && (
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", ...clamp(2) }}>
            {link.description}
          </Typography>
        )}
      </Box>

      <Box
        component={ExternalLink}
        className="LinkPreview-open"
        aria-hidden="true"
        sx={{ flexShrink: 0, width: 16, height: 16, color: "text.secondary", transition: "color 200ms", mt: 0.5 }}
      />
    </ButtonBase>
  );
}

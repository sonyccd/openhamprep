import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ExternalLink, Pencil, Wrench } from "lucide-react";
import { getToolImageUrl, type HamRadioTool } from "@/hooks/useHamRadioTools";
import { tokenAlpha } from "@/theme/muiTheme";

interface ToolListProps {
  tools: HamRadioTool[];
  onEdit: (tool: HamRadioTool) => void;
}

export function ToolList({ tools, onEdit }: ToolListProps) {
  if (tools.length === 0) {
    return (
      <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
        No tools found
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ height: "100%", overflowY: "auto", pb: 2 }}>
      {tools.map((tool) => {
        const imageUrl = getToolImageUrl(tool);
        return (
          <Box
            key={tool.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              transition: "background-color 200ms",
              "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "6px",
                overflow: "hidden",
                bgcolor: "muted",
                flexShrink: 0,
              }}
            >
              {imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={tool.title}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: (t) =>
                      `linear-gradient(to bottom right, ${tokenAlpha(
                        t.vars.palette.primary.main,
                        10
                      )}, ${tokenAlpha(t.vars.palette.primary.main, 5)})`,
                  }}
                >
                  <Box
                    component={Wrench}
                    aria-hidden="true"
                    sx={{
                      width: 24,
                      height: 24,
                      color: (t) => tokenAlpha(t.vars.palette.primary.main, 40),
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography component="h4" sx={{ fontWeight: 600 }}>
                  {tool.title}
                </Typography>
                <Chip
                  size="small"
                  label={tool.is_published ? "Published" : "Draft"}
                  color={tool.is_published ? "primary" : "default"}
                  sx={{ fontSize: "0.75rem" }}
                />
                {tool.category && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={tool.category.name}
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tool.description}
              </Typography>
              <Link
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: "0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.5,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {tool.url}
                <Box component={ExternalLink} aria-hidden="true" sx={{ width: 12, height: 12 }} />
              </Link>
            </Box>

            {/*
              The old button was a bare icon with no aria-label, so every row
              announced as "button" and nothing else. Named after its tool now.
            */}
            <IconButton
              aria-label={`Edit ${tool.title}`}
              onClick={() => onEdit(tool)}
              sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
            >
              <Box component={Pencil} aria-hidden="true" sx={{ width: 16, height: 16 }} />
            </IconButton>
          </Box>
        );
      })}
    </Stack>
  );
}

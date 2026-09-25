import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Download, ExternalLink, Pencil, Trash2, Upload } from "lucide-react";
import { getResourceColorToken, getResourceIcon } from "@/lib/resourceTypes";
import { tokenAlpha } from "@/theme/muiTheme";
import type { TopicResource } from "@/hooks/useTopics";

interface ResourceRowProps {
  resource: TopicResource;
  /** Resolves an uploaded file's public URL. */
  fileUrl: (storagePath: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}

/** One resource: its icon, title, where it points, and its row actions. */
export function ResourceRow({ resource, fileUrl, onEdit, onDelete }: ResourceRowProps) {
  const Glyph = getResourceIcon(resource.resource_type);

  return (
    <Card
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        transition: "background-color 150ms",
        "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) },
        // The actions are revealed on hover, and — this is the part the old
        // markup missed — whenever anything inside the row takes focus. With
        // only group-hover, a keyboard user tabbing to Edit landed on a
        // control they could not see.
        "&:hover .ResourceRow-actions, &:focus-within .ResourceRow-actions": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "secondary.main",
          flexShrink: 0,
        }}
      >
        <Icon icon={Glyph} size={16} sx={{ color: getResourceColorToken(resource.resource_type) }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography noWrap sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
            {resource.title}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={resource.resource_type}
            sx={{ fontSize: "0.75rem", flexShrink: 0 }}
          />
          {resource.storage_path && (
            <Chip
              color="secondary"
              size="small"
              icon={<Icon icon={Upload} size={12} />}
              label="Uploaded"
              sx={{ fontSize: "0.75rem", flexShrink: 0 }}
            />
          )}
        </Box>

        {resource.storage_path ? (
          <Link
            href={fileUrl(resource.storage_path)}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { color: "primary.main" },
            }}
          >
            <Icon icon={Download} size={12} />
            Download file
          </Link>
        ) : resource.url ? (
          <Link
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
              "&:hover": { color: "primary.main" },
            }}
          >
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {resource.url}
            </Box>
            <Icon icon={ExternalLink} size={12} sx={{ flexShrink: 0 }} />
          </Link>
        ) : null}
      </Box>

      <Box
        className="ResourceRow-actions"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          opacity: 0,
          transition: "opacity 150ms",
        }}
      >
        <IconButton
          aria-label={`Edit ${resource.title}`}
          onClick={onEdit}
          sx={{ width: 32, height: 32 }}
        >
          <Icon icon={Pencil} size={16} />
        </IconButton>
        <IconButton
          aria-label={`Delete ${resource.title}`}
          onClick={onDelete}
          sx={{ width: 32, height: 32, color: "error.main" }}
        >
          <Icon icon={Trash2} size={16} />
        </IconButton>
      </Box>
    </Card>
  );
}

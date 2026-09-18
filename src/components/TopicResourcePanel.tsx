import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { Download, ExternalLink, Link as LinkIcon } from "lucide-react";
import type { TopicResource } from "@/hooks/useTopics";
import { CollapsibleSection } from "@/components/ohp/CollapsibleSection";
import { RESOURCE_TYPE_CONFIG } from "@/lib/resourceTypes";
import { topicContentUrl } from "@/lib/storageUrl";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicResourcePanelProps {
  resources: TopicResource[];
}

/** Only exact YouTube hosts; a URL that merely mentions youtube is not one. */
const isYouTubeUrl = (url: string | null) => {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(host);
  } catch {
    return false;
  }
};

function ResourceItem({ resource }: { resource: TopicResource }) {
  const config = RESOURCE_TYPE_CONFIG[resource.resource_type as keyof typeof RESOURCE_TYPE_CONFIG];
  const Icon = config?.icon ?? LinkIcon;
  const token = config?.token ?? "text.secondary";
  const isUploaded = Boolean(resource.storage_path);
  const url = resource.storage_path ? topicContentUrl(resource.storage_path) : resource.url;

  return (
    <Box
      component="a"
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      download={isUploaded ? true : undefined}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        borderRadius: "8px",
        border: "1px solid transparent",
        bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
        color: "inherit",
        textDecoration: "none",
        transition: "background-color 150ms, border-color 150ms",
        "&:hover": { bgcolor: "secondary.main", borderColor: "divider" },
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
          flexShrink: 0,
          bgcolor: "background.default",
        }}
      >
        <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16, color: token }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="span"
            sx={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {resource.title}
          </Box>
          {isUploaded ? (
            <Box component={Download} aria-hidden="true" sx={{ width: 12, height: 12, color: "text.secondary", flexShrink: 0 }} />
          ) : url ? (
            <Box component={ExternalLink} aria-hidden="true" sx={{ width: 12, height: 12, color: "text.secondary", flexShrink: 0 }} />
          ) : null}
        </Box>
        {resource.description && (
          <Box
            component="p"
            sx={{
              m: 0,
              mt: 0.5,
              fontSize: "0.75rem",
              color: "text.secondary",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {resource.description}
          </Box>
        )}
        {isYouTubeUrl(url) && (
          <Chip color="secondary" size="small" label="YouTube" sx={{ mt: 0.5, fontSize: "0.75rem" }} />
        )}
        {isUploaded && (
          <Chip variant="outlined" size="small" label="Download" sx={{ mt: 0.5, fontSize: "0.75rem" }} />
        )}
      </Box>
    </Box>
  );
}

function ResourceGroup({ type, resources }: { type: string; resources: TopicResource[] }) {
  const config = RESOURCE_TYPE_CONFIG[type as keyof typeof RESOURCE_TYPE_CONFIG];
  const Icon = config?.icon ?? LinkIcon;
  const token = config?.token ?? "text.secondary";
  const label = config?.pluralLabel ?? "Resources";

  return (
    <CollapsibleSection
      title={label}
      icon={<Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16, color: token }} />}
      count={resources.length}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1.5 }}>
        {/* Copy before sorting: .sort() is in place. Today this is a per-type
            group built fresh each render, so it would be harmless — but it is
            a prop from where this component stands, and the habit is cheap. */}
        {[...resources]
          .sort((a, b) => a.display_order - b.display_order)
          .map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
      </Box>
    </CollapsibleSection>
  );
}

const TYPE_ORDER = ["video", "article", "link", "pdf", "image"];

/** A topic's resources, grouped by type, in the topic page's sidebar. */
export function TopicResourcePanel({ resources }: TopicResourcePanelProps) {
  // The parent decides whether the sidebar exists at all.
  if (!resources || resources.length === 0) return null;

  const grouped = resources.reduce<Record<string, TopicResource[]>>((acc, resource) => {
    (acc[resource.resource_type] ??= []).push(resource);
    return acc;
  }, {});

  const groups = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {TYPE_ORDER.map((type) =>
        grouped[type] ? <ResourceGroup key={type} type={type} resources={grouped[type]} /> : null
      )}
    </Box>
  );
  const icon = <Box component={LinkIcon} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary" }} />;

  return (
    <Box>
      {/* Desktop: a static heading over the always-visible groups. */}
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <CollapsibleSection title="Resources" icon={icon} count={resources.length} static>
          {groups}
        </CollapsibleSection>
      </Box>
      {/* Mobile: the whole thing folds into a card. */}
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <CollapsibleSection title="Resources" icon={icon} count={resources.length} variant="card">
          {groups}
        </CollapsibleSection>
      </Box>
    </Box>
  );
}

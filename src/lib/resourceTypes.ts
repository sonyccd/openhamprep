import {
  Video,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  File,
  Globe,
  type LucideIcon,
} from "lucide-react";

export type ResourceType = "video" | "article" | "link" | "pdf" | "image";
export type LinkType = "video" | "article" | "website";

interface ResourceTypeConfig {
  icon: LucideIcon;
  label: string;
  pluralLabel: string;
  /** The MUI palette token for this type's icon and text. */
  token: string;
}

interface LinkTypeConfig {
  icon: LucideIcon;
  label: string;
  /** The MUI palette token for this type's text. */
  token: string;
  /** The palette key behind the chip's tint; absent where the tint is neutral. */
  tintToken?: "error" | "info";
}

/**
 * Centralized configuration for resource types.
 * Uses semantic color tokens from the design system.
 */
export const RESOURCE_TYPE_CONFIG: Record<ResourceType, ResourceTypeConfig> = {
  video: {
    icon: Video,
    label: "Video",
    pluralLabel: "Videos",
    token: "error.main",
  },
  article: {
    icon: FileText,
    label: "Article",
    pluralLabel: "Articles",
    token: "info.main",
  },
  pdf: {
    icon: File,
    label: "PDF",
    pluralLabel: "PDFs",
    token: "warning.main",
  },
  image: {
    icon: ImageIcon,
    label: "Image",
    pluralLabel: "Images",
    token: "success.main",
  },
  link: {
    icon: LinkIcon,
    label: "Link",
    pluralLabel: "Links",
    token: "accent",
  },
};

/**
 * Configuration for question link types (video, article, website).
 * Used in LinkPreview and question link displays.
 */
export const LINK_TYPE_CONFIG: Record<LinkType, LinkTypeConfig> = {
  video: {
    icon: Video,
    label: "Video",
    token: "error.main",
    tintToken: "error",
  },
  article: {
    icon: FileText,
    label: "Article",
    token: "info.main",
    tintToken: "info",
  },
  website: {
    icon: Globe,
    label: "Website",
    token: "text.secondary",
  },
};

/**
 * Get the icon component for a resource type.
 */
export function getResourceIcon(type: string): LucideIcon {
  return RESOURCE_TYPE_CONFIG[type as ResourceType]?.icon ?? LinkIcon;
}

/**
 * Get the MUI palette token for a resource type.
 *
 * `accent` is flat on the palette rather than a {main} object, which sx
 * resolves the same way — it emits var(--mui-palette-accent).
 */
export function getResourceColorToken(type: string): string {
  return RESOURCE_TYPE_CONFIG[type as ResourceType]?.token ?? "text.secondary";
}

/**
 * Get all resource types as an array for dropdowns/selects.
 */
export function getResourceTypeOptions() {
  return Object.entries(RESOURCE_TYPE_CONFIG).map(([value, config]) => ({
    value: value as ResourceType,
    label: config.label,
    icon: config.icon,
    token: config.token,
  }));
}

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
  /** Semantic color class for the icon/text — for the Tailwind consumers */
  colorClass: string;
  /**
   * The same colour as an MUI palette token, for ported components.
   *
   * Kept alongside colorClass rather than replacing it: TopicResourcePanel and
   * LinkPreview still read the class, and they are ported separately. The two
   * must stay in step — a resource type is the same colour in both.
   */
  token: string;
  /** Background color class with opacity for badges */
  bgClass: string;
  /** Border color class with opacity */
  borderClass: string;
}

interface LinkTypeConfig {
  icon: LucideIcon;
  label: string;
  colorClass: string;
  bgClass: string;
  /** The same colour as an MUI palette token, for ported components. */
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
    colorClass: "text-destructive",
    token: "error.main",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/30",
  },
  article: {
    icon: FileText,
    label: "Article",
    pluralLabel: "Articles",
    colorClass: "text-info",
    token: "info.main",
    bgClass: "bg-info/10",
    borderClass: "border-info/30",
  },
  pdf: {
    icon: File,
    label: "PDF",
    pluralLabel: "PDFs",
    colorClass: "text-warning",
    token: "warning.main",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/30",
  },
  image: {
    icon: ImageIcon,
    label: "Image",
    pluralLabel: "Images",
    colorClass: "text-success",
    token: "success.main",
    bgClass: "bg-success/10",
    borderClass: "border-success/30",
  },
  link: {
    icon: LinkIcon,
    label: "Link",
    pluralLabel: "Links",
    colorClass: "text-accent",
    token: "accent",
    bgClass: "bg-accent/10",
    borderClass: "border-accent/30",
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
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
    token: "error.main",
    tintToken: "error",
  },
  article: {
    icon: FileText,
    label: "Article",
    colorClass: "text-info",
    bgClass: "bg-info/10",
    token: "info.main",
    tintToken: "info",
  },
  website: {
    icon: Globe,
    label: "Website",
    colorClass: "text-muted-foreground",
    bgClass: "bg-secondary",
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
 * Get the color class for a resource type.
 */
export function getResourceColorClass(type: string): string {
  return RESOURCE_TYPE_CONFIG[type as ResourceType]?.colorClass ?? "text-muted-foreground";
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
    colorClass: config.colorClass,
    token: config.token,
  }));
}

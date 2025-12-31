import { TopicResource } from "@/hooks/useTopics";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  File,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

function getStorageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("topic-content")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

interface TopicResourcePanelProps {
  resources: TopicResource[];
}

const resourceTypeConfig: Record<
  string,
  { icon: typeof Video; label: string; color: string }
> = {
  video: { icon: Video, label: "Videos", color: "text-red-500" },
  article: { icon: FileText, label: "Articles", color: "text-blue-500" },
  pdf: { icon: File, label: "PDFs", color: "text-orange-500" },
  image: { icon: ImageIcon, label: "Images", color: "text-green-500" },
  link: { icon: LinkIcon, label: "Links", color: "text-purple-500" },
};

function ResourceItem({ resource }: { resource: TopicResource }) {
  const config = resourceTypeConfig[resource.resource_type] || {
    icon: LinkIcon,
    label: "Resource",
    color: "text-muted-foreground",
  };
  const Icon = config.icon;

  // Generate the proper URL - use storage URL for uploaded files
  const url = resource.storage_path
    ? getStorageUrl(resource.storage_path)
    : resource.url;

  const isUploaded = !!resource.storage_path;

  // Check if it's a YouTube video
  const isYouTube = url?.includes("youtube.com") || url?.includes("youtu.be");

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      download={isUploaded ? true : undefined}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        "bg-secondary/30 hover:bg-secondary",
        "border border-transparent hover:border-border"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
          "bg-background"
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {resource.title}
          </span>
          {isUploaded ? (
            <Download className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : url ? (
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : null}
        </div>
        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {resource.description}
          </p>
        )}
        {isYouTube && (
          <Badge variant="secondary" className="mt-1 text-xs">
            YouTube
          </Badge>
        )}
        {isUploaded && (
          <Badge variant="outline" className="mt-1 text-xs">
            Download
          </Badge>
        )}
      </div>
    </a>
  );
}

function ResourceGroup({
  type,
  resources,
  defaultOpen = true,
}: {
  type: string;
  resources: TopicResource[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = resourceTypeConfig[type] || {
    icon: LinkIcon,
    label: "Resources",
    color: "text-muted-foreground",
  };
  const Icon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-2 px-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
          <span className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", config.color)} />
            {config.label}
            <Badge variant="secondary" className="text-xs">
              {resources.length}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-3">
          {resources
            .sort((a, b) => a.display_order - b.display_order)
            .map((resource) => (
              <ResourceItem key={resource.id} resource={resource} />
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TopicResourcePanel({ resources }: TopicResourcePanelProps) {
  if (!resources || resources.length === 0) {
    return null; // Return null when no resources - the parent handles empty state
  }

  // Group resources by type
  const grouped = resources.reduce((acc, resource) => {
    const type = resource.resource_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, TopicResource[]>);

  // Order of resource types to display
  const typeOrder = ["video", "article", "link", "pdf", "image"];

  return (
    <div>
      {/* Desktop view */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <LinkIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Resources</span>
          <Badge variant="secondary" className="ml-auto">
            {resources.length}
          </Badge>
        </div>
        <div className="space-y-1">
          {typeOrder.map((type) =>
            grouped[type] ? (
              <ResourceGroup
                key={type}
                type={type}
                resources={grouped[type]}
                defaultOpen={type === "video"}
              />
            ) : null
          )}
        </div>
      </div>

      {/* Mobile view - collapsible card */}
      <div className="lg:hidden">
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors py-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Resources
                    <Badge variant="secondary">{resources.length}</Badge>
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {typeOrder.map((type) =>
                    grouped[type] ? (
                      <ResourceGroup
                        key={type}
                        type={type}
                        resources={grouped[type]}
                        defaultOpen={false}
                      />
                    ) : null
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}

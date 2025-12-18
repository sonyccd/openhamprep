import { ExternalLink, Video, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkData } from "@/hooks/useQuestions";

interface LinkPreviewProps {
  link: LinkData;
}

export function LinkPreview({ link }: LinkPreviewProps) {
  const TypeIcon = {
    video: Video,
    article: FileText,
    website: Globe,
  }[link.type];

  const typeLabel = {
    video: 'Video',
    article: 'Article',
    website: 'Website',
  }[link.type];

  const typeColor = {
    video: 'text-red-500 bg-red-500/10',
    article: 'text-blue-500 bg-blue-500/10',
    website: 'text-muted-foreground bg-secondary',
  }[link.type];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex gap-4 p-4 rounded-lg border border-border bg-card/50",
        "hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200",
        "group"
      )}
    >
      {link.image && (
        <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-secondary">
          <img
            src={link.image}
            alt={link.title}
            width={96}
            height={96}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", typeColor)}>
            <TypeIcon className="w-3 h-3" />
            {typeLabel}
          </span>
          {link.siteName && (
            <span className="text-xs text-muted-foreground truncate">
              {link.siteName}
            </span>
          )}
        </div>
        
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
          {link.title || link.url}
        </h4>
        
        {link.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {link.description}
          </p>
        )}
      </div>
      
      <ExternalLink className="flex-shrink-0 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
    </a>
  );
}

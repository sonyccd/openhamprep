import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Wrench } from "lucide-react";
import { HamRadioTool, getToolImageUrl } from "@/hooks/useHamRadioTools";
import { cn } from "@/lib/utils";

interface HamRadioToolCardProps {
  tool: HamRadioTool;
}

export function HamRadioToolCard({ tool }: HamRadioToolCardProps) {
  const imageUrl = getToolImageUrl(tool);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`${tool.title} (opens in new tab)`}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group overflow-hidden h-full",
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={tool.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Wrench className="w-12 h-12 text-primary/40" />
            </div>
          )}

          {/* External link indicator */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <ExternalLink className="w-3 h-3" />
            </Badge>
          </div>

          {/* Category badge */}
          {tool.category && (
            <div className="absolute bottom-2 left-2">
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                {tool.category.name}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {tool.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        </CardContent>
      </Card>
    </a>
  );
}

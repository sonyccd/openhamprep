import { useState } from "react";
import { Maximize2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { FigureLightbox } from "@/components/FigureLightbox";

interface FigureImageProps {
  figureUrl: string | null | undefined;
  questionId: string;
}

export function FigureImage({ figureUrl, questionId }: FigureImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Only render if figureUrl is provided
  if (!figureUrl) {
    return null;
  }

  // Show error state if image failed to load
  if (imageError) {
    return (
      <div className="mb-6 p-4 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm">Figure failed to load</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 relative group">
        <div
          className={cn(
            "relative rounded-lg overflow-hidden border border-border bg-muted/20",
            "cursor-pointer transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md"
          )}
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
          aria-label={`View figure for question ${questionId} in full size`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={figureUrl}
            alt={`Figure for question ${questionId}`}
            className={cn(
              "w-full h-auto object-contain",
              "max-h-[200px] md:max-h-[300px]",
              isLoading && "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />

          {/* Expand button */}
          <button
            className={cn(
              "absolute top-2 right-2 p-2 rounded-md",
              "bg-background/80 backdrop-blur-sm border border-border",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "transition-opacity duration-200",
              "hover:bg-background hover:border-primary/50",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            aria-label="Expand figure"
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <FigureLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        figureUrl={figureUrl}
        questionId={questionId}
      />
    </>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText } from "lucide-react";
import { Topic } from "@/hooks/useTopics";
import { cn } from "@/lib/utils";

interface TopicCardProps {
  topic: Topic;
  isCompleted?: boolean;
  onClick: () => void;
}

export function TopicCard({ topic, isCompleted = false, onClick }: TopicCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group overflow-hidden",
        isCompleted && "ring-2 ring-success/50"
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {topic.thumbnail_url ? (
          <img
            src={topic.thumbnail_url}
            alt={topic.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <FileText className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Completion badge overlay */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </Badge>
          </div>
        )}

        {/* Subelement badges */}
        {topic.subelements && topic.subelements.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {topic.subelements.slice(0, 3).map((sub) => (
              <Badge
                key={sub.id}
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                {sub.subelement}
              </Badge>
            ))}
            {topic.subelements.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                +{topic.subelements.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {topic.title}
        </h3>
        {topic.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {topic.description}
          </p>
        )}

        {/* Resource count */}
        {topic.resources && topic.resources.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {topic.resources.length} resource{topic.resources.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

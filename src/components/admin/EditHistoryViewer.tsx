import { format } from "date-fns";
import { History, Clock, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface EditHistoryEntry {
  user_id: string;
  user_email: string;
  action: 'created' | 'updated' | 'deleted';
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: string;
}

interface EditHistoryViewerProps {
  history: EditHistoryEntry[];
  entityType: 'question' | 'term' | 'tool';
}

export function EditHistoryViewer({ history, entityType }: EditHistoryViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic flex items-center gap-2 py-2">
        <History className="w-4 h-4" />
        No edit history recorded
      </div>
    );
  }

  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const actionColors = {
    created: 'bg-success/20 text-success',
    updated: 'bg-primary/20 text-primary',
    deleted: 'bg-destructive/20 text-destructive',
  };

  const formatChangeValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
          <History className="w-4 h-4" />
          Edit History ({history.length} {history.length === 1 ? 'change' : 'changes'})
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="h-[200px] rounded-md border border-border bg-secondary/20 mt-2">
          <div className="p-3 space-y-3">
            {sortedHistory.map((entry, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-background border border-border space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge className={actionColors[entry.action]}>
                      {entry.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.user_email}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                
                {entry.action === 'updated' && Object.keys(entry.changes).length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    {Object.entries(entry.changes).map(([field, change]) => (
                      <div key={field} className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{field}:</span>
                        <div className="flex items-start gap-2 pl-2">
                          <span className="text-destructive/80 line-through truncate max-w-[45%]">
                            {formatChangeValue(change.from)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-success truncate max-w-[45%]">
                            {formatChangeValue(change.to)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

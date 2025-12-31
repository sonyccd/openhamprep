import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, GitMerge, Replace, Database, Upload as UploadIcon, ChevronDown, ChevronUp } from "lucide-react";

export type ResolutionAction = 'keep' | 'replace' | 'merge';

export interface ConflictItem<T> {
  id: string;
  existing: T;
  incoming: T;
  resolution: ResolutionAction;
}

interface ConflictResolutionDialogProps<T> {
  conflicts: ConflictItem<T>[];
  onResolve: (conflicts: ConflictItem<T>[]) => void;
  onCancel: () => void;
  renderExisting: (item: T) => React.ReactNode;
  renderIncoming: (item: T) => React.ReactNode;
  renderMerged: (existing: T, incoming: T) => React.ReactNode;
  getItemLabel: (item: T) => string;
  itemType: 'question' | 'term';
}

export function ConflictResolutionDialog<T>({
  conflicts,
  onResolve,
  onCancel,
  renderExisting,
  renderIncoming,
  renderMerged,
  getItemLabel,
  itemType,
}: ConflictResolutionDialogProps<T>) {
  const [resolvedConflicts, setResolvedConflicts] = useState<ConflictItem<T>[]>(conflicts);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(conflicts.slice(0, 3).map(c => c.id)));

  const handleResolutionChange = (id: string, resolution: ResolutionAction) => {
    setResolvedConflicts(prev =>
      prev.map(c => c.id === id ? { ...c, resolution } : c)
    );
  };

  const applyToAll = (resolution: ResolutionAction) => {
    setResolvedConflicts(prev =>
      prev.map(c => ({ ...c, resolution }))
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resolutionCounts = {
    keep: resolvedConflicts.filter(c => c.resolution === 'keep').length,
    replace: resolvedConflicts.filter(c => c.resolution === 'replace').length,
    merge: resolvedConflicts.filter(c => c.resolution === 'merge').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resolve {conflicts.length} Conflicts</h3>
          <p className="text-sm text-muted-foreground">
            {conflicts.length} {itemType === 'question' ? 'questions' : 'terms'} already exist in the database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-info/20 text-info">
            <Database className="w-3 h-3 mr-1" />
            {resolutionCounts.keep} Keep
          </Badge>
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            <Replace className="w-3 h-3 mr-1" />
            {resolutionCounts.replace} Replace
          </Badge>
          <Badge variant="secondary" className="bg-success/20 text-success">
            <GitMerge className="w-3 h-3 mr-1" />
            {resolutionCounts.merge} Merge
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
        <span className="text-sm text-muted-foreground">Apply to all:</span>
        <Button variant="outline" size="sm" onClick={() => applyToAll('keep')}>
          <Database className="w-3 h-3 mr-1" />
          Keep Existing
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyToAll('replace')}>
          <Replace className="w-3 h-3 mr-1" />
          Replace All
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyToAll('merge')}>
          <GitMerge className="w-3 h-3 mr-1" />
          Merge All
        </Button>
      </div>

      {/* Conflict List */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-3 space-y-3">
          {resolvedConflicts.map((conflict) => {
            const isExpanded = expandedItems.has(conflict.id);
            return (
              <Card key={conflict.id} className="p-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(conflict.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{getItemLabel(conflict.incoming)}</span>
                  </div>
                  <RadioGroup
                    value={conflict.resolution}
                    onValueChange={(value) => handleResolutionChange(conflict.id, value as ResolutionAction)}
                    className="flex items-center gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="keep" id={`${conflict.id}-keep`} />
                      <Label htmlFor={`${conflict.id}-keep`} className="text-xs cursor-pointer">Keep</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="replace" id={`${conflict.id}-replace`} />
                      <Label htmlFor={`${conflict.id}-replace`} className="text-xs cursor-pointer">Replace</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="merge" id={`${conflict.id}-merge`} />
                      <Label htmlFor={`${conflict.id}-merge`} className="text-xs cursor-pointer">Merge</Label>
                    </div>
                  </RadioGroup>
                </div>

                {isExpanded && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {/* Existing */}
                    <div className={`p-2 rounded-lg border ${conflict.resolution === 'keep' ? 'border-info bg-info/10' : 'border-border bg-secondary/30'}`}>
                      <div className="flex items-center gap-1 mb-2 text-xs font-medium text-muted-foreground">
                        <Database className="w-3 h-3" />
                        Current in Database
                      </div>
                      {renderExisting(conflict.existing)}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Incoming or Merged */}
                    <div className={`p-2 rounded-lg border ${
                      conflict.resolution === 'replace'
                        ? 'border-warning bg-warning/10'
                        : conflict.resolution === 'merge'
                        ? 'border-success bg-success/10'
                        : 'border-border bg-secondary/30'
                    }`}>
                      <div className="flex items-center gap-1 mb-2 text-xs font-medium text-muted-foreground">
                        {conflict.resolution === 'merge' ? (
                          <>
                            <GitMerge className="w-3 h-3" />
                            Merged Result
                          </>
                        ) : (
                          <>
                            <UploadIcon className="w-3 h-3" />
                            Incoming Upload
                          </>
                        )}
                      </div>
                      {conflict.resolution === 'merge' 
                        ? renderMerged(conflict.existing, conflict.incoming)
                        : renderIncoming(conflict.incoming)
                      }
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onResolve(resolvedConflicts)}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Apply Resolutions
        </Button>
      </div>
    </div>
  );
}

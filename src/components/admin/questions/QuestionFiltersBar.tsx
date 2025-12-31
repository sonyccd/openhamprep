import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ThumbsDown, X } from 'lucide-react';

interface QuestionFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showNegativeFeedbackOnly: boolean;
  onNegativeFeedbackChange: (checked: boolean) => void;
  filteredCount: number;
}

export function QuestionFiltersBar({
  searchTerm,
  onSearchChange,
  showNegativeFeedbackOnly,
  onNegativeFeedbackChange,
  filteredCount,
}: QuestionFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Checkbox
            id="negative-feedback-filter"
            checked={showNegativeFeedbackOnly}
            onCheckedChange={(checked) => onNegativeFeedbackChange(checked === true)}
          />
          <label
            htmlFor="negative-feedback-filter"
            className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
          >
            <ThumbsDown className="w-3 h-3 text-destructive" />
            Negative feedback
          </label>
        </div>
        {showNegativeFeedbackOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNegativeFeedbackChange(false)}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filter
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredCount} question{filteredCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

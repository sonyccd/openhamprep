import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2, Link as LinkIcon, Image } from 'lucide-react';
import { FigureUpload } from '../FigureUpload';

interface QuestionAddDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newId: string;
  newQuestion: string;
  newOptions: string[];
  newCorrectAnswer: string;
  newExplanation: string;
  newFigureUrl: string | null;
  isPending: boolean;
  onIdChange: (value: string) => void;
  onQuestionChange: (value: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onCorrectAnswerChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onFigureUrlChange: (url: string | null) => void;
  onAdd: () => void;
}

export function QuestionAddDialog({
  isOpen,
  onOpenChange,
  newId,
  newQuestion,
  newOptions,
  newCorrectAnswer,
  newExplanation,
  newFigureUrl,
  isPending,
  onIdChange,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onExplanationChange,
  onFigureUrlChange,
  onAdd,
}: QuestionAddDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Question ID (FCC assigned, e.g., T1A01)</Label>
            <Input
              placeholder="e.g., T1A01"
              value={newId}
              onChange={(e) => onIdChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the official FCC question ID and cannot be changed after creation.
            </p>
          </div>

          <div>
            <Label>Question Text</Label>
            <Textarea
              placeholder="Enter the question..."
              value={newQuestion}
              onChange={(e) => onQuestionChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            {['A', 'B', 'C', 'D'].map((letter, index) => (
              <div key={letter} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-mono">
                  {letter}
                </span>
                <Input
                  placeholder={`Option ${letter}`}
                  value={newOptions[index]}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div>
            <Label>Correct Answer</Label>
            <Select value={newCorrectAnswer} onValueChange={onCorrectAnswerChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">A</SelectItem>
                <SelectItem value="1">B</SelectItem>
                <SelectItem value="2">C</SelectItem>
                <SelectItem value="3">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Explanation Section */}
          <div>
            <Label>Explanation (shown after answering)</Label>
            <Textarea
              placeholder="Explain why this is the correct answer..."
              value={newExplanation}
              onChange={(e) => onExplanationChange(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This explanation will be shown to users after they answer the question.
            </p>
          </div>

          <Separator />

          {/* Figure Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Question Figure (Optional)
            </Label>
            <FigureUpload
              questionId={newId || 'new-question'}
              currentFigureUrl={newFigureUrl}
              onUpload={(url) => onFigureUrlChange(url)}
              onRemove={() => onFigureUrlChange(null)}
            />
          </div>

          <Separator />

          {/* Learning Resources Info */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Learning Resources
            </Label>
            <p className="text-sm text-muted-foreground">
              Links are automatically extracted from the explanation. Use markdown syntax:{' '}
              <code className="px-1 py-0.5 rounded bg-muted text-xs">
                [Link Text](https://...)
              </code>
            </p>
          </div>

          <Button onClick={onAdd} disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

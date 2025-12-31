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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  Image,
  BookOpen,
} from 'lucide-react';
import { FigureUpload } from '../FigureUpload';
import { EditHistoryViewer } from '../EditHistoryViewer';
import { getSafeUrl } from '@/lib/utils';
import { LINK_TYPE_CONFIG, type LinkType } from '@/lib/resourceTypes';
import type { Question } from './types';

interface QuestionEditDialogProps {
  question: Question | null;
  highlightQuestionId?: string;
  editQuestion: string;
  editOptions: string[];
  editCorrectAnswer: string;
  editExplanation: string;
  editFigureUrl: string | null;
  editForumUrl: string | null;
  linkedTopicNames: string[];
  isDeleteDialogOpen: boolean;
  isUpdatePending: boolean;
  onClose: () => void;
  onQuestionChange: (value: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onCorrectAnswerChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onFigureUrlChange: (url: string | null) => void;
  onForumUrlChange: (url: string | null) => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function QuestionEditDialog({
  question,
  highlightQuestionId,
  editQuestion,
  editOptions,
  editCorrectAnswer,
  editExplanation,
  editFigureUrl,
  editForumUrl,
  linkedTopicNames,
  isDeleteDialogOpen,
  isUpdatePending,
  onClose,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onExplanationChange,
  onFigureUrlChange,
  onForumUrlChange,
  onDeleteDialogOpenChange,
  onUpdate,
  onDelete,
}: QuestionEditDialogProps) {
  const safeForumUrl = getSafeUrl(editForumUrl);

  return (
    <Dialog open={!!question} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Question: {question?.display_name}
            {highlightQuestionId === question?.display_name && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                From Stats
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Question Text</Label>
            <Textarea
              placeholder="Enter the question..."
              value={editQuestion}
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
                  value={editOptions[index]}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div>
            <Label>Correct Answer</Label>
            <Select value={editCorrectAnswer} onValueChange={onCorrectAnswerChange}>
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
              value={editExplanation}
              onChange={(e) => onExplanationChange(e.target.value)}
              rows={4}
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
              questionId={question?.id || ''}
              currentFigureUrl={editFigureUrl}
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
            {question?.links && question.links.length > 0 && (
              <div className="space-y-2 mt-2">
                {question.links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded bg-secondary/30 border border-border"
                  >
                    <span
                      className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                        LINK_TYPE_CONFIG[link.type as LinkType]?.bgClass ?? 'bg-secondary'
                      } ${
                        LINK_TYPE_CONFIG[link.type as LinkType]?.colorClass ??
                        'text-muted-foreground'
                      }`}
                    >
                      {link.type}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground hover:text-primary truncate flex items-center gap-1"
                    >
                      {link.title || link.url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Forum URL Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Discourse Forum Topic (Optional)
            </Label>
            <Input
              placeholder="https://forum.openhamprep.com/t/topic-slug/123"
              value={editForumUrl || ''}
              onChange={(e) => onForumUrlChange(e.target.value || null)}
            />
            <p className="text-xs text-muted-foreground">
              Link to the Discourse forum topic for this question. When set, explanations
              will sync bidirectionally.
            </p>
            {safeForumUrl ? (
              <a
                href={safeForumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open in Forum <ExternalLink className="w-3 h-3" />
              </a>
            ) : editForumUrl ? (
              <p className="text-xs text-destructive">
                Invalid URL format. Please enter a valid http:// or https:// URL.
              </p>
            ) : null}
          </div>

          <Separator />

          {/* Linked Topics (Read-only) */}
          {question && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Linked Topics
              </Label>
              <p className="text-sm text-muted-foreground">
                Topics are linked from the Topics admin section. Go to Admin &gt; Topics to
                manage topic-question links.
              </p>
              {linkedTopicNames.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {linkedTopicNames.map((name, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary/10">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No topics linked</p>
              )}
            </div>
          )}

          <Separator />

          <EditHistoryViewer
            history={question?.edit_history || []}
            entityType="question"
          />

          <div className="flex justify-between gap-2">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Question
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Question</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete question "{question?.display_name}"?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onUpdate} disabled={isUpdatePending}>
                {isUpdatePending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

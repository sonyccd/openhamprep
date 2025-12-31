import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Link as LinkIcon, BookOpen, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { SyncStatusBadge } from '../SyncStatusBadge';
import type { Question } from './types';

interface QuestionListItemProps {
  question: Question;
  isHighlighted: boolean;
  feedbackStats?: { helpful: number; notHelpful: number };
  onEdit: () => void;
  onRetrySync: () => void;
}

export function QuestionListItem({
  question,
  isHighlighted,
  feedbackStats,
  onEdit,
  onRetrySync,
}: QuestionListItemProps) {
  return (
    <div
      className={`flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors ${
        isHighlighted ? 'border-amber-500 bg-amber-500/5' : 'border-border'
      }`}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
            {question.display_name}
          </span>
          {question.links && question.links.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              <LinkIcon className="w-3 h-3 mr-1" />
              {question.links.length}
            </Badge>
          )}
          {question.linked_topic_ids && question.linked_topic_ids.length > 0 && (
            <Badge variant="outline" className="text-xs bg-primary/5">
              <BookOpen className="w-3 h-3 mr-1" />
              {question.linked_topic_ids.length} topic
              {question.linked_topic_ids.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {question.forum_url ? (
            <SyncStatusBadge
              status={question.discourse_sync_status}
              syncAt={question.discourse_sync_at}
              error={question.discourse_sync_error}
              questionId={question.display_name}
              forumUrl={question.forum_url}
              onRetrySync={onRetrySync}
            />
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3 mr-1" />
              No Topic
            </Badge>
          )}
          {feedbackStats && (
            <Badge variant="outline" className="text-xs gap-1">
              <ThumbsUp className="w-3 h-3 text-success" />
              <span className="text-success">{feedbackStats.helpful}</span>
              <ThumbsDown className="w-3 h-3 text-destructive ml-1" />
              <span className="text-destructive">{feedbackStats.notHelpful}</span>
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-2">{question.question}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-primary"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}

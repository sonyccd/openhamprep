import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Question } from './types';

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'] as const;

interface QuestionReviewTableProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  highlightQuestionId?: string;
}

export function QuestionReviewTable({
  questions,
  onEdit,
  highlightQuestionId,
}: QuestionReviewTableProps) {
  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-24 shrink-0">ID</TableHead>
            <TableHead className="min-w-[240px]">Question</TableHead>
            <TableHead className="min-w-[200px]">Answer</TableHead>
            <TableHead className="min-w-[240px]">Explanation</TableHead>
            <TableHead className="w-12 text-right">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q) => {
            const letter = ANSWER_LETTERS[q.correct_answer] ?? '?';
            const answerText = q.options[q.correct_answer] ?? '(missing)';
            return (
              <TableRow
                key={q.id}
                className={cn(
                  'align-top',
                  highlightQuestionId === q.display_name && 'bg-amber-500/10'
                )}
              >
                <TableCell className="font-mono text-xs pt-3 shrink-0">
                  {q.display_name}
                </TableCell>
                <TableCell className="text-sm pt-3">{q.question}</TableCell>
                <TableCell className="text-sm pt-3">
                  <span className="font-medium text-primary">{letter}.</span>{' '}
                  {answerText}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground pt-3">
                  {q.explanation || <span className="italic">—</span>}
                </TableCell>
                <TableCell className="text-right pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(q)}
                    aria-label={`Edit ${q.display_name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

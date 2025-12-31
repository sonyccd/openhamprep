import { useTopicQuestions, TopicQuestion } from "@/hooks/useTopics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TopicQuestionsPanelProps {
  topicId: string;
  onQuestionClick?: (questionId: string) => void;
}

function QuestionItem({
  question,
  onClick,
}: {
  question: TopicQuestion;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
        "bg-secondary/30 hover:bg-secondary",
        "border border-transparent hover:border-border"
      )}
    >
      <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded shrink-0">
        {question.displayName}
      </span>
      <span className="text-sm text-muted-foreground line-clamp-2 flex-1">
        {question.question}
      </span>
    </button>
  );
}

export function TopicQuestionsPanel({
  topicId,
  onQuestionClick,
}: TopicQuestionsPanelProps) {
  const { data: questions, isLoading } = useTopicQuestions(topicId);
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null; // Don't show the panel if there are no questions
  }

  return (
    <div className="mb-6">
      {/* Desktop view */}
      <div className="hidden lg:block">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between py-2 px-1 text-sm font-medium text-foreground hover:text-primary transition-colors mb-2 border-b border-border pb-3">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                Related Questions
                <Badge variant="secondary" className="ml-1">
                  {questions.length}
                </Badge>
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2">
              {questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onClick={() => onQuestionClick?.(question.id)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mobile view - collapsible card */}
      <div className="lg:hidden">
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors py-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Related Questions
                    <Badge variant="secondary">{questions.length}</Badge>
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2">
                {questions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onClick={() => onQuestionClick?.(question.id)}
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Loader2, X, HelpCircle, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useQuestionsForLicense,
  useChapterQuestionMutations,
  type ChapterQuestion,
} from "@/hooks/useArrlChapters";
import type { LicenseType } from "@/types/chapters";

interface ChapterQuestionManagerProps {
  chapterId: string;
  licenseType: LicenseType;
}

export function ChapterQuestionManager({
  chapterId,
  licenseType,
}: ChapterQuestionManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkInput, setBulkInput] = useState("");

  // Fetch all questions for this license type
  const { data: allQuestions = [], isLoading } = useQuestionsForLicense(licenseType);

  const { linkQuestion, unlinkQuestion, updatePageReference, bulkLinkQuestions } =
    useChapterQuestionMutations();

  // Filter questions by search term
  const filteredQuestions = allQuestions.filter(
    (q) =>
      q.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate linked (to this chapter) and available questions
  const linkedQuestions = filteredQuestions.filter(
    (q) => q.arrl_chapter_id === chapterId
  );
  const availableQuestions = filteredQuestions.filter(
    (q) => q.arrl_chapter_id !== chapterId
  );

  const handleLinkQuestion = (questionId: string) => {
    linkQuestion.mutate({ questionId, chapterId });
  };

  const handleUnlinkQuestion = (questionId: string) => {
    unlinkQuestion.mutate(questionId);
  };

  const handleBulkLink = async () => {
    if (!bulkInput.trim()) return;

    // Parse comma-separated input
    const displayNames = bulkInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.toUpperCase());

    if (displayNames.length === 0) {
      toast.error('Please enter at least one question ID');
      return;
    }

    try {
      await bulkLinkQuestions.mutateAsync({
        chapterId,
        displayNames,
        allQuestions,
      });
      setBulkInput(''); // Clear input on success
    } catch {
      // Error is handled by the mutation's onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Chapter Questions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Link exam questions to this chapter. You can optionally add page references for each question.
        </p>
      </div>

      {/* Bulk Link Section */}
      <div className="space-y-2 p-4 border border-border rounded-lg bg-secondary/20">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ListPlus className="w-4 h-4" />
          Bulk Link Questions
        </div>
        <p className="text-xs text-muted-foreground">
          Enter question IDs separated by commas (e.g., T1A01, T1A02, T1A03)
        </p>
        <Textarea
          placeholder="T1A01, T1A02, T1A03..."
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="min-h-[60px] resize-none"
          disabled={bulkLinkQuestions.isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleBulkLink}
            disabled={bulkLinkQuestions.isPending || !bulkInput.trim()}
            size="sm"
          >
            {bulkLinkQuestions.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ListPlus className="w-4 h-4 mr-2" />
            )}
            Link Questions
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions by ID or text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="default" className="bg-primary/20 text-primary">
          {linkedQuestions.length} linked
        </Badge>
        <span className="text-muted-foreground">
          {filteredQuestions.length} questions match filter
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Linked Questions Section */}
          {linkedQuestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                Linked Questions
                <Badge variant="secondary">{linkedQuestions.length}</Badge>
              </h4>
              <div className="border border-border rounded-lg divide-y divide-border max-h-[350px] overflow-y-auto">
                {linkedQuestions.map((q) => (
                  <LinkedQuestionRow
                    key={q.id}
                    question={q}
                    onUnlink={() => handleUnlinkQuestion(q.id)}
                    onPageChange={(page) =>
                      updatePageReference.mutate({
                        questionId: q.id,
                        pageReference: page,
                      })
                    }
                    isPending={unlinkQuestion.isPending || updatePageReference.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Questions Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              Available Questions
              <Badge variant="outline">{availableQuestions.length}</Badge>
            </h4>
            {availableQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {searchTerm
                  ? "No matching questions found"
                  : "All questions are linked to chapters"}
              </p>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border max-h-[350px] overflow-y-auto">
                {availableQuestions.map((q) => (
                  <AvailableQuestionRow
                    key={q.id}
                    question={q}
                    onLink={() => handleLinkQuestion(q.id)}
                    isPending={linkQuestion.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedQuestionRow({
  question,
  onUnlink,
  onPageChange,
  isPending,
}: {
  question: ChapterQuestion & { arrl_chapter_id: string | null };
  onUnlink: () => void;
  onPageChange: (page: string | null) => void;
  isPending: boolean;
}) {
  const [pageValue, setPageValue] = useState(question.arrl_page_reference || "");
  const [isEditing, setIsEditing] = useState(false);

  const handlePageBlur = () => {
    setIsEditing(false);
    const trimmed = pageValue.trim();
    if (trimmed !== (question.arrl_page_reference || "")) {
      onPageChange(trimmed || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setPageValue(question.arrl_page_reference || "");
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 bg-primary/5",
        isPending && "opacity-50"
      )}
    >
      <Checkbox checked={true} className="mt-0.5 pointer-events-none" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
            {question.display_name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {question.question}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Page:</span>
          <Input
            value={pageValue}
            onChange={(e) => {
              setPageValue(e.target.value);
              setIsEditing(true);
            }}
            onBlur={handlePageBlur}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 45"
            className={cn(
              "w-20 h-7 text-xs",
              isEditing && "ring-2 ring-primary"
            )}
            disabled={isPending}
          />
        </div>
        <button
          onClick={onUnlink}
          disabled={isPending}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Unlink question"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AvailableQuestionRow({
  question,
  onLink,
  isPending,
}: {
  question: ChapterQuestion & { arrl_chapter_id: string | null };
  onLink: () => void;
  isPending: boolean;
}) {
  const isLinkedElsewhere = question.arrl_chapter_id !== null;

  return (
    <button
      onClick={onLink}
      disabled={isPending}
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left transition-colors",
        "hover:bg-secondary/50",
        isPending && "opacity-50"
      )}
    >
      <Checkbox checked={false} className="mt-0.5 pointer-events-none" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
            {question.display_name}
          </span>
          {isLinkedElsewhere && (
            <Badge variant="outline" className="text-xs">
              In another chapter
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {question.question}
        </p>
      </div>
    </button>
  );
}

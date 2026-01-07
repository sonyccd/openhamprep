import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Loader2, X, HelpCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Question {
  id: string;
  display_name: string;
  question: string;
}

interface TopicQuestionManagerProps {
  topicId: string;
}

export function TopicQuestionManager({ topicId }: TopicQuestionManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState<string>("all");

  // Fetch all questions using pagination to get the complete set
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["all-questions-for-linking"],
    queryFn: async () => {
      const pageSize = 1000;
      let allData: Question[] = [];
      let page = 0;
      let hasMore = true;

      // Paginate through all questions
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from("questions")
          .select("id, display_name, question")
          .order("display_name", { ascending: true })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...(data as Question[])];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      return allData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch linked question IDs for this topic
  const { data: linkedQuestionIds = [], isLoading: linksLoading } = useQuery({
    queryKey: ["topic-linked-questions", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_questions")
        .select("question_id")
        .eq("topic_id", topicId);

      if (error) throw error;
      return data.map((d) => d.question_id);
    },
  });

  // Link a question to this topic
  const linkQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from("topic_questions").insert({
        topic_id: topicId,
        question_id: questionId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-linked-questions", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topic-questions", topicId] });
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success("Question linked");
    },
    onError: (error) => {
      toast.error("Failed to link question: " + error.message);
    },
  });

  // Unlink a question from this topic
  const unlinkQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from("topic_questions")
        .delete()
        .eq("topic_id", topicId)
        .eq("question_id", questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-linked-questions", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topic-questions", topicId] });
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success("Question unlinked");
    },
    onError: (error) => {
      toast.error("Failed to unlink question: " + error.message);
    },
  });

  const handleToggleQuestion = (questionId: string, isLinked: boolean) => {
    if (isLinked) {
      unlinkQuestion.mutate(questionId);
    } else {
      linkQuestion.mutate(questionId);
    }
  };

  // Filter questions by search term and test type
  const filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch =
      q.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTestType =
      testTypeFilter === "all" ||
      (testTypeFilter === "technician" && q.display_name.startsWith("T")) ||
      (testTypeFilter === "general" && q.display_name.startsWith("G")) ||
      (testTypeFilter === "extra" && q.display_name.startsWith("E"));

    return matchesSearch && matchesTestType;
  });

  // Separate linked and unlinked for easier display
  const linkedQuestions = filteredQuestions.filter((q) => linkedQuestionIds.includes(q.id));
  const unlinkedQuestions = filteredQuestions.filter((q) => !linkedQuestionIds.includes(q.id));

  const isLoading = questionsLoading || linksLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Linked Questions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select which exam questions this topic covers. Users will see these questions listed on the topic page.
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search questions by ID or text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            <SelectItem value="technician">Technician</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="extra">Extra</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="default" className="bg-primary/20 text-primary">
          {linkedQuestionIds.length} linked
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
              <div className="border border-border rounded-lg divide-y divide-border max-h-[300px] overflow-y-auto">
                {linkedQuestions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    isLinked={true}
                    onToggle={() => handleToggleQuestion(q.id, true)}
                    isPending={unlinkQuestion.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Questions Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              Available Questions
              <Badge variant="outline">{unlinkedQuestions.length}</Badge>
            </h4>
            {unlinkedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {searchTerm ? "No matching questions found" : "All questions are linked"}
              </p>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border max-h-[400px] overflow-y-auto">
                {unlinkedQuestions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    isLinked={false}
                    onToggle={() => handleToggleQuestion(q.id, false)}
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

function QuestionRow({
  question,
  isLinked,
  onToggle,
  isPending,
}: {
  question: Question;
  isLinked: boolean;
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={isPending}
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left transition-colors",
        "hover:bg-secondary/50",
        isLinked && "bg-primary/5"
      )}
    >
      <Checkbox checked={isLinked} className="mt-0.5 pointer-events-none" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
            {question.display_name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{question.question}</p>
      </div>
      {isLinked && (
        <X className="w-4 h-4 text-muted-foreground hover:text-destructive shrink-0 mt-1" />
      )}
    </button>
  );
}

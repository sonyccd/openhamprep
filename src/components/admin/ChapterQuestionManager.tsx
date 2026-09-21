import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "sonner";
import { useQuestionsForLicense, useChapterQuestionMutations } from "@/hooks/useArrlChapters";
import type { LicenseType } from "@/types/chapters";
import { BulkLinkPanel } from "./chapters/BulkLinkPanel";
import { LinkedChapterQuestionRow } from "./chapters/LinkedChapterQuestionRow";
import { parseQuestionIds } from "./chapters/parseQuestionIds";
import { LinkedCountBar } from "./questionLinking/LinkedCountBar";
import { QuestionLinkingHeader } from "./questionLinking/QuestionLinkingHeader";
import { QuestionPickRow } from "./questionLinking/QuestionPickRow";
import { QuestionSearchField } from "./questionLinking/QuestionSearchField";
import { QuestionSection } from "./questionLinking/QuestionSection";

interface ChapterQuestionManagerProps {
  chapterId: string;
  licenseType: LicenseType;
}

export function ChapterQuestionManager({ chapterId, licenseType }: ChapterQuestionManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkInput, setBulkInput] = useState("");

  const { data: allQuestions = [], isLoading } = useQuestionsForLicense(licenseType);
  const { linkQuestion, unlinkQuestion, updatePageReference, bulkLinkQuestions } = useChapterQuestionMutations();

  const needle = searchTerm.toLowerCase();
  const filteredQuestions = allQuestions.filter(
    (q) => q.display_name.toLowerCase().includes(needle) || q.question.toLowerCase().includes(needle)
  );
  const linkedQuestions = filteredQuestions.filter((q) => q.arrl_chapter_id === chapterId);
  const availableQuestions = filteredQuestions.filter((q) => q.arrl_chapter_id !== chapterId);

  const handleBulkLink = async () => {
    const displayNames = parseQuestionIds(bulkInput);
    if (displayNames.length === 0) {
      toast.error("Please enter at least one question ID");
      return;
    }
    try {
      await bulkLinkQuestions.mutateAsync({ chapterId, displayNames, allQuestions });
      setBulkInput("");
    } catch {
      // Reported by the mutation's onError.
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <QuestionLinkingHeader
        title="Chapter Questions"
        description="Link exam questions to this chapter. You can optionally add page references for each question."
      />

      <BulkLinkPanel value={bulkInput} onChange={setBulkInput} onSubmit={handleBulkLink} isPending={bulkLinkQuestions.isPending} />

      <QuestionSearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search questions by ID or text..." />

      <LinkedCountBar linked={linkedQuestions.length} matching={filteredQuestions.length} />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }} role="status" aria-label="Loading questions">
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {linkedQuestions.length > 0 && (
            <QuestionSection title="Linked Questions" count={linkedQuestions.length} countVariant="filled">
              {linkedQuestions.map((q) => (
                <LinkedChapterQuestionRow
                  key={q.id}
                  question={q}
                  onUnlink={() => unlinkQuestion.mutate(q.id)}
                  onPageChange={(page) => updatePageReference.mutate({ questionId: q.id, pageReference: page })}
                  isPending={unlinkQuestion.isPending || updatePageReference.isPending}
                />
              ))}
            </QuestionSection>
          )}

          <QuestionSection
            title="Available Questions"
            count={availableQuestions.length}
            countVariant="outlined"
            empty={searchTerm ? "No matching questions found" : "All questions are linked to chapters"}
          >
            {availableQuestions.map((q) => (
              <QuestionPickRow
                key={q.id}
                question={q}
                checked={false}
                onClick={() => linkQuestion.mutate({ questionId: q.id, chapterId })}
                disabled={linkQuestion.isPending}
                badge={q.arrl_chapter_id !== null && <Chip size="small" variant="outlined" label="In another chapter" sx={{ fontSize: "0.75rem" }} />}
              />
            ))}
          </QuestionSection>
        </Box>
      )}
    </Box>
  );
}

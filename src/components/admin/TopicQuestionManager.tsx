import { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { X } from "lucide-react";
import {
  useAllQuestionsForLinking,
  useTopicLinkedQuestionIds,
  useTopicQuestionLinkMutations,
} from "@/hooks/useTopicQuestionLinks";
import { LinkedCountBar } from "./questionLinking/LinkedCountBar";
import { QuestionLinkingHeader } from "./questionLinking/QuestionLinkingHeader";
import { QuestionPickRow } from "./questionLinking/QuestionPickRow";
import { QuestionSearchField } from "./questionLinking/QuestionSearchField";
import { QuestionSection } from "./questionLinking/QuestionSection";
import { matchesSearch, matchesTestType, TEST_TYPE_FILTERS } from "./topics/filterLinkableQuestions";
import type { TestTypeFilter } from "./topics/filterLinkableQuestions";

interface TopicQuestionManagerProps {
  topicId: string;
}

export function TopicQuestionManager({ topicId }: TopicQuestionManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>("all");

  const { data: allQuestions = [], isLoading: questionsLoading } = useAllQuestionsForLinking();
  const { data: linkedQuestionIds = [], isLoading: linksLoading } = useTopicLinkedQuestionIds(topicId);
  const { linkQuestion, unlinkQuestion } = useTopicQuestionLinkMutations(topicId);

  const filteredQuestions = allQuestions.filter((q) => matchesSearch(q, searchTerm) && matchesTestType(q, testTypeFilter));
  const linkedSet = new Set(linkedQuestionIds);
  const linkedQuestions = filteredQuestions.filter((q) => linkedSet.has(q.id));
  const unlinkedQuestions = filteredQuestions.filter((q) => !linkedSet.has(q.id));

  const isLoading = questionsLoading || linksLoading;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <QuestionLinkingHeader
        title="Linked Questions"
        description="Select which exam questions this topic covers. Users will see these questions listed on the topic page."
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <QuestionSearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search or paste IDs (comma-separated)..." />
        <FormControl size="small" sx={{ width: 150, flexShrink: 0 }}>
          <InputLabel id="topic-question-filter-label">Filter</InputLabel>
          <Select
            labelId="topic-question-filter-label"
            label="Filter"
            value={testTypeFilter}
            onChange={(e) => setTestTypeFilter(e.target.value as TestTypeFilter)}
          >
            {TEST_TYPE_FILTERS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <LinkedCountBar linked={linkedQuestionIds.length} matching={filteredQuestions.length} />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }} role="status" aria-label="Loading questions">
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {linkedQuestions.length > 0 && (
            <QuestionSection title="Linked Questions" count={linkedQuestions.length} countVariant="filled" maxHeight={300}>
              {linkedQuestions.map((q) => (
                <QuestionPickRow
                  key={q.id}
                  question={q}
                  checked
                  onClick={() => unlinkQuestion.mutate(q.id)}
                  disabled={unlinkQuestion.isPending}
                  trailing={
                    <Box
                      component={X}
                      aria-hidden="true"
                      sx={{
                        width: 16,
                        height: 16,
                        color: "text.secondary",
                        flexShrink: 0,
                        mt: 0.5,
                        // The row is the control, so hovering it is what warns of the unlink.
                        ".MuiListItemButton-root:hover &": { color: "error.main" },
                      }}
                    />
                  }
                />
              ))}
            </QuestionSection>
          )}

          <QuestionSection
            title="Available Questions"
            count={unlinkedQuestions.length}
            countVariant="outlined"
            maxHeight={400}
            empty={searchTerm ? "No matching questions found" : "All questions are linked"}
          >
            {unlinkedQuestions.map((q) => (
              <QuestionPickRow
                key={q.id}
                question={q}
                checked={false}
                onClick={() => linkQuestion.mutate(q.id)}
                disabled={linkQuestion.isPending}
              />
            ))}
          </QuestionSection>
        </Box>
      )}
    </Box>
  );
}

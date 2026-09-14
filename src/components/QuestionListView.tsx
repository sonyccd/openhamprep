import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { Play, Search } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { QuestionGroupList } from "@/components/question/QuestionGroupList";
import { QuestionListHeader } from "@/components/question/QuestionListHeader";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

interface QuestionListViewProps {
  title: string;
  subtitle: string;
  badge: string;
  questions: Question[];
  onBack: () => void;
  onStartPractice: (startIndex?: number) => void;
  description?: string;
}

export function QuestionListView({
  title,
  subtitle,
  badge,
  questions,
  onBack,
  onStartPractice,
  description,
}: QuestionListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.displayName.toLowerCase().includes(query) ||
        q.question.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  // Group questions by question group (e.g., T1A, T1B)
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    filteredQuestions.forEach((q) => {
      const group = q.questionGroup || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(q);
    });
    // Sort groups and questions within groups
    const sortedGroups = Object.keys(groups).sort();
    sortedGroups.forEach((group) => {
      groups[group].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    return { groups, sortedKeys: sortedGroups };
  }, [filteredQuestions]);

  return (
    <PageContainer width="standard" mobileNavPadding>
      <QuestionListHeader
        title={title}
        subtitle={subtitle}
        badge={badge}
        description={description}
        onBack={onBack}
      />

      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          mb: 4,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={() => onStartPractice()}
          startIcon={<Box component={Play} sx={{ width: 16, height: 16 }} />}
          sx={{ height: 48, px: 3, fontWeight: 500, flexShrink: 0 }}
        >
          Practice All Questions
        </Button>

        <Box sx={{ position: "relative", flex: 1 }}>
          {/*
            InputBase, not TextField: this is an undecorated search field, and
            TextField would add a notched outline and a floating label the
            design does not have. The label stays visually hidden, as it was.
          */}
          <Box component="label" htmlFor="question-search" sx={visuallyHidden}>
            Search questions
          </Box>
          <Box
            component={Search}
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              color: "text.secondary",
              pointerEvents: "none",
            }}
          />
          <InputBase
            id="question-search"
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: "100%",
              height: 48,
              pl: "40px",
              pr: 2,
              borderRadius: "8px", // rounded-lg
              bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
              border: "1px solid",
              borderColor: "divider",
              color: "text.primary",
              transition: "all 200ms",
              "&:focus-within": {
                borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
                boxShadow: (t) => `0 0 0 2px ${tokenAlpha(t.vars.palette.primary.main, 30)}`,
              },
            }}
          />
        </Box>
      </MotionBox>

      {/* Screen reader announcement for search results */}
      <Box aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
        {searchQuery &&
          `${filteredQuestions.length} question${filteredQuestions.length !== 1 ? "s" : ""} found`}
      </Box>

      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {groupedQuestions.sortedKeys.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ color: "text.secondary" }}>
              {searchQuery ? "No questions match your search." : "No questions available."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            <QuestionGroupList
              groups={groupedQuestions.groups}
              sortedKeys={groupedQuestions.sortedKeys}
              allQuestions={questions}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onStartPractice={onStartPractice}
            />
          </Stack>
        )}
      </MotionBox>

      {/* Bottom spacer for mobile nav */}
      <Box sx={{ height: 32 }} />
    </PageContainer>
  );
}

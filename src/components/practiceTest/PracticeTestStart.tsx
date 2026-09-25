import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { History, Play } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { tokenAlpha } from "@/theme/muiTheme";
import type { TestHistoryResult } from "@/hooks/useRecentTestHistory";
import { TestHistoryList } from "./TestHistoryList";

interface PracticeTestStartProps {
  questionCount: number;
  passingScore: number;
  onStart: () => void;
  history: {
    tests: TestHistoryResult[] | undefined;
    isLoading: boolean;
    error: unknown;
  };
  onReviewTest?: (testId: string) => void;
}

const Figure = ({ value, label }: { value: string | number; label: string }) => (
  <Box sx={{ textAlign: "center" }}>
    <Typography component="p" sx={{ fontSize: "1.5rem", fontFamily: "monospace", fontWeight: 700 }}>
      {value}
    </Typography>
    <Typography component="p" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
      {label}
    </Typography>
  </Box>
);

/** The two-card start screen: what the test is, and how the last few went. */
export function PracticeTestStart({
  questionCount,
  passingScore,
  onStart,
  history,
  onReviewTest,
}: PracticeTestStartProps) {
  return (
    <PageContainer width="standard" mobileNavPadding>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <Paper
          component={MotionBox}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          variant="outlined"
          sx={{ p: 4, borderRadius: "12px", textAlign: "center" }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <Icon icon={Play} size={32} sx={{ color: "primary.main" }} />
          </Box>

          <Typography variant="h5" component="h1" sx={{ fontFamily: "monospace", fontWeight: 700, mb: 2 }}>
            Ready to Begin?
          </Typography>

          <Typography sx={{ color: "text.secondary", mb: 3, maxWidth: 448, mx: "auto" }}>
            This practice test simulates the real Amateur Radio exam with {questionCount} questions
            distributed across topics just like the actual test.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
            <Figure value={questionCount} label="Questions" />
            <Figure value="74%" label="To Pass" />
            <Figure value={passingScore} label="Correct Needed" />
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={onStart}
            startIcon={<Icon icon={Play} size={20} />}
          >
            Start Test
          </Button>
        </Paper>

        <Paper
          component={MotionBox}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          variant="outlined"
          sx={{ p: 3, borderRadius: "12px" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Icon icon={History} size={20} sx={{ color: "text.secondary" }} />
            <Typography component="h2" sx={{ fontWeight: 600 }}>
              Recent Tests
            </Typography>
          </Box>
          <TestHistoryList
            tests={history.tests}
            isLoading={history.isLoading}
            error={history.error}
            onReviewTest={onReviewTest}
          />
        </Paper>
      </Box>
    </PageContainer>
  );
}

import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { AlertTriangle, ChevronRight, History, Trophy, XCircle } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { formatTestDate, type TestHistoryResult } from "@/hooks/useRecentTestHistory";

interface TestHistoryListProps {
  tests: TestHistoryResult[] | undefined;
  isLoading: boolean;
  error: unknown;
  onReviewTest?: (testId: string) => void;
}

const EmptyState = ({ icon, title, hint }: { icon: typeof History; title: string; hint?: string }) => (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <Box
      component={icon}
      aria-hidden="true"
      sx={{ width: 40, height: 40, mx: "auto", mb: 1.5, color: "text.secondary", opacity: 0.5, display: "block" }}
    />
    <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>{title}</Typography>
    {hint && (
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", opacity: 0.7, mt: 0.5 }}>
        {hint}
      </Typography>
    )}
  </Box>
);

/** The "Recent Tests" list on the practice-test start screen. */
export function TestHistoryList({ tests, isLoading, error, onReviewTest }: TestHistoryListProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} aria-label="Loading test history" />
      </Box>
    );
  }
  if (error) return <EmptyState icon={AlertTriangle} title="Could not load test history" />;
  if (!tests || tests.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No tests taken yet"
        hint="Complete a test to see your history"
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {tests.map((test, index) => {
        const tone = test.passed ? "success" : "error";
        return (
          <MotionBox
            key={test.id}
            component="button"
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onReviewTest?.(test.id)}
            disabled={!onReviewTest}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "transparent",
              color: "text.primary",
              textAlign: "left",
              font: "inherit",
              transition: "border-color 150ms",
              ...(onReviewTest && {
                cursor: "pointer",
                "&:hover": { borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50) },
                "&:hover .TestHistoryList-arrow": { color: "primary.main" },
              }),
            }}
          >
            {/* Every layout element is a span: this is inside a <button>. */}
            <Box
              component="span"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                bgcolor: (t) => tokenAlpha(t.vars.palette[tone].main, 10),
              }}
            >
              <Box
                component={test.passed ? Trophy : XCircle}
                aria-hidden="true"
                sx={{ width: 16, height: 16, color: `${tone}.main` }}
              />
            </Box>

            <Box component="span" sx={{ flex: 1, minWidth: 0, display: "block" }}>
              <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ fontWeight: 700, color: `${tone}.main` }}>
                  {test.percentage}%
                </Box>
                <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  ({test.score}/{test.total_questions})
                </Box>
                {test.passed && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: "4px",
                      color: "success.main",
                      bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
                    }}
                  >
                    PASS
                  </Box>
                )}
              </Box>
              <Box
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatTestDate(test.completed_at)}
              </Box>
            </Box>

            {onReviewTest && (
              <Icon
  icon={ChevronRight}
                className="TestHistoryList-arrow"
                sx={{ width: 16, height: 16, color: "text.secondary", flexShrink: 0, transition: "color 150ms" }}
/>
            )}
          </MotionBox>
        );
      })}
    </Box>
  );
}

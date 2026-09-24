import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { VerifyResult } from "@/hooks/useDiscourseSyncStatus";
import { tokenAlpha } from "@/theme/muiTheme";
import { QuestionIdTag } from "@/components/admin/shared/QuestionIdTag";
import { DiscrepancyRow, DiscrepancySection, TopicLink } from "./DiscrepancySection";
import { countDiscrepancies } from "./syncMetrics";

interface VerificationResultsProps {
  result: VerifyResult;
}

/** What the last verify or repair found, problem by problem. */
export function VerificationResults({ result }: VerificationResultsProps) {
  const { orphanedInDiscourse, brokenForumUrl, missingStatus } = result.discrepancies;
  const hasDiscrepancies = countDiscrepancies(result) > 0;

  const summary = [
    { label: "DB Questions", value: result.summary.totalQuestionsInDb },
    { label: "Discourse Topics", value: result.summary.totalTopicsInDiscourse },
    { label: "With Forum URL", value: result.summary.questionsWithForumUrl },
    { label: "Synced Correctly", value: result.summary.syncedCorrectly, token: "success" },
  ];

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        title={
          <Typography component="h3" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1rem", fontWeight: 600 }}>
            <Box
              component={hasDiscrepancies ? AlertTriangle : CheckCircle}
              aria-hidden="true"
              sx={{ width: 20, height: 20, color: hasDiscrepancies ? "warning.main" : "success.main" }}
            />
            Verification Results
          </Typography>
        }
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            p: 2,
            borderRadius: "8px",
            bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
          }}
        >
          {summary.map((s) => (
            <Box key={s.label}>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{s.label}</Typography>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, ...(s.token && { color: `${s.token}.main` }) }}>
                {s.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {result.repaired !== undefined && (
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: (t) => tokenAlpha(t.vars.palette.success.main, 30),
              bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
            }}
          >
            <Typography sx={{ color: "success.main", fontWeight: 500 }}>Repaired {result.repaired} items</Typography>
          </Box>
        )}

        <DiscrepancySection
          icon={AlertTriangle}
          tint="warning"
          title="Topics in Discourse without forum_url"
          items={orphanedInDiscourse}
          itemKey={(item) => item.questionDisplayName}
          renderItem={(item) => (
            <DiscrepancyRow tint="warning" split>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QuestionIdTag size="small" name={item.questionDisplayName} />
                {item.action && (
                  <Chip
                    size="small"
                    label={item.action}
                    sx={
                      item.action === "repaired"
                        ? { bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 20), color: "success.main" }
                        : { bgcolor: "muted", color: "text.secondary" }
                    }
                  />
                )}
              </Box>
              <TopicLink href={item.topicUrl} questionName={item.questionDisplayName} />
            </DiscrepancyRow>
          )}
        />

        <DiscrepancySection
          icon={XCircle}
          tint="error"
          title="Broken Forum URLs"
          items={brokenForumUrl}
          itemKey={(item) => item.questionId}
          renderItem={(item) => (
            <DiscrepancyRow tint="error">
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <QuestionIdTag size="small" name={item.questionDisplayName} />
                <Typography component="span" sx={{ fontSize: "0.75rem", color: "error.main" }}>
                  {item.error}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }} noWrap>
                {item.forumUrl}
              </Typography>
            </DiscrepancyRow>
          )}
        />

        <DiscrepancySection
          icon={AlertTriangle}
          tint="warning"
          title="Missing Sync Status"
          items={missingStatus}
          itemKey={(item) => item.questionId}
          renderItem={(item) => (
            <DiscrepancyRow tint="muted" split>
              <QuestionIdTag size="small" name={item.questionDisplayName} />
              <TopicLink href={item.forumUrl} questionName={item.questionDisplayName} />
            </DiscrepancyRow>
          )}
        />

        {!hasDiscrepancies && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Icon icon={CheckCircle} size={48} sx={{ color: "success.main", mx: "auto", mb: 2 }} />
            <Typography sx={{ color: "text.secondary" }}>All synced questions are in good shape!</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

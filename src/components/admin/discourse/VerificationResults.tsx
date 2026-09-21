import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { AlertTriangle, CheckCircle, ExternalLink, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VerifyResult } from "@/hooks/useDiscourseSyncStatus";
import { tokenAlpha } from "@/theme/muiTheme";
import { countDiscrepancies } from "./syncMetrics";

type Tint = "warning" | "error" | "muted";

/** A question's display id, set in monospace on a primary tint. */
function QuestionTag({ name }: { name: string }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color: "primary.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
        px: 1,
        py: 0.25,
        borderRadius: "4px",
      }}
    >
      {name}
    </Box>
  );
}

/** Named after its question, so a list of them reads as more than "View Topic" ×n. */
function TopicLink({ href, questionName }: { href: string; questionName: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View topic for ${questionName}`}
      sx={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 0.5 }}
    >
      View Topic <Box component={ExternalLink} aria-hidden="true" sx={{ width: 12, height: 12 }} />
    </Link>
  );
}

const rowSx = (tint: Tint) => ({
  p: 1.5,
  borderRadius: "8px",
  border: "1px solid",
  ...(tint === "muted"
    ? { borderColor: "divider", bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) }
    : {
        borderColor: (t) => tokenAlpha(t.vars.palette[tint].main, 30),
        bgcolor: (t) => tokenAlpha(t.vars.palette[tint].main, 5),
      }),
});

interface DiscrepancySectionProps {
  icon: LucideIcon;
  tint: "warning" | "error";
  title: string;
  count: number;
  children: React.ReactNode;
}

/** A titled, scrolling list of one kind of problem. Rendered only when there are any. */
function DiscrepancySection({ icon: Icon, tint, title, count, children }: DiscrepancySectionProps) {
  if (count === 0) return null;
  return (
    <Box>
      <Typography component="h4" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 500, mb: 1.5 }}>
        <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16, color: `${tint}.main` }} />
        {title} ({count})
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 256, overflowY: "auto" }}>{children}</Box>
    </Box>
  );
}

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

        <DiscrepancySection icon={AlertTriangle} tint="warning" title="Topics in Discourse without forum_url" count={orphanedInDiscourse.length}>
          {orphanedInDiscourse.map((item) => (
            <Box key={item.questionDisplayName} sx={{ ...rowSx("warning"), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QuestionTag name={item.questionDisplayName} />
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
            </Box>
          ))}
        </DiscrepancySection>

        <DiscrepancySection icon={XCircle} tint="error" title="Broken Forum URLs" count={brokenForumUrl.length}>
          {brokenForumUrl.map((item) => (
            <Box key={item.questionId} sx={rowSx("error")}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <QuestionTag name={item.questionDisplayName} />
                <Typography component="span" sx={{ fontSize: "0.75rem", color: "error.main" }}>
                  {item.error}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }} noWrap>
                {item.forumUrl}
              </Typography>
            </Box>
          ))}
        </DiscrepancySection>

        <DiscrepancySection icon={AlertTriangle} tint="warning" title="Missing Sync Status" count={missingStatus.length}>
          {missingStatus.map((item) => (
            <Box key={item.questionId} sx={{ ...rowSx("muted"), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <QuestionTag name={item.questionDisplayName} />
              <TopicLink href={item.forumUrl} questionName={item.questionDisplayName} />
            </Box>
          ))}
        </DiscrepancySection>

        {!hasDiscrepancies && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Box component={CheckCircle} aria-hidden="true" sx={{ width: 48, height: 48, color: "success.main", mx: "auto", mb: 2 }} />
            <Typography sx={{ color: "text.secondary" }}>All synced questions are in good shape!</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

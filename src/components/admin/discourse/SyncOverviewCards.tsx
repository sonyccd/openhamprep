import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import type { useDiscourseSyncStatus } from "@/hooks/useDiscourseSyncStatus";
import { MetricCard } from "./MetricCard";
import { syncedPercent } from "./syncMetrics";

type SyncTotals = ReturnType<typeof useDiscourseSyncStatus>["totals"];

const bigNumberSx = { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25 } as const;
const captionSx = { fontSize: "0.75rem", color: "text.secondary" } as const;

interface SyncOverviewCardsProps {
  totals: SyncTotals;
}

/** The four headline figures across every licence type. */
export function SyncOverviewCards({ totals }: SyncOverviewCardsProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
      <MetricCard title="Total Questions">
        <Typography sx={bigNumberSx}>{totals?.totalQuestions || 0}</Typography>
        <Typography sx={captionSx}>Across all license types</Typography>
      </MetricCard>

      <MetricCard title="With Forum Topics">
        <Typography sx={{ ...bigNumberSx, color: "primary.main" }}>{totals?.withForumUrl || 0}</Typography>
        <Typography sx={captionSx}>{totals?.withoutForumUrl || 0} without topics</Typography>
      </MetricCard>

      <MetricCard title="Synced Successfully">
        <Typography sx={{ ...bigNumberSx, color: "success.main" }}>{totals?.synced || 0}</Typography>
        <LinearProgress
          variant="determinate"
          value={syncedPercent(totals?.synced ?? 0, totals?.totalQuestions ?? 0)}
          aria-label="Synced share of all questions"
          sx={{ mt: 1, height: 8, borderRadius: 4 }}
        />
      </MetricCard>

      <MetricCard title="Issues">
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <Typography>
            <Box component="span" sx={{ ...bigNumberSx, color: "error.main" }}>{totals?.errors || 0}</Box>
            <Box component="span" sx={{ ...captionSx, ml: 0.5 }}>errors</Box>
          </Typography>
          <Typography>
            <Box component="span" sx={{ ...bigNumberSx, color: "warning.main" }}>{totals?.needsVerification || 0}</Box>
            <Box component="span" sx={{ ...captionSx, ml: 0.5 }}>unverified</Box>
          </Typography>
        </Box>
      </MetricCard>
    </Box>
  );
}

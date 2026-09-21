import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { AlertTriangle, CheckCircle, MessageSquare, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SyncOverviewRow } from "@/hooks/useDiscourseSyncStatus";
import { syncedPercent } from "./syncMetrics";

function Count({ icon: Icon, value, token, label }: { icon: LucideIcon; value: number; token: string; label: string }) {
  return (
    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: `${token}.main` }} aria-label={`${value} ${label}`}>
      <Box component={Icon} aria-hidden="true" sx={{ width: 12, height: 12 }} />
      {value}
    </Box>
  );
}

interface SyncByLicenseCardProps {
  overview: SyncOverviewRow[];
}

/** One row per licence type: how many questions, how many synced, and what went wrong. */
export function SyncByLicenseCard({ overview }: SyncByLicenseCardProps) {
  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        title={
          <Typography component="h3" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1rem", fontWeight: 600 }}>
            <Box component={MessageSquare} aria-hidden="true" sx={{ width: 20, height: 20 }} />
            Sync Status by License Type
          </Typography>
        }
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0 }}>
        {overview.map((row) => (
          <Box key={row.license_type} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography component="span" sx={{ fontWeight: 500 }}>
                  {row.license_type}
                </Typography>
                <Chip size="small" variant="outlined" label={`${row.total_questions} questions`} sx={{ fontSize: "0.75rem" }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, fontSize: "0.875rem" }}>
                <Count icon={CheckCircle} value={row.synced} token="success" label="synced" />
                {row.errors > 0 && <Count icon={XCircle} value={row.errors} token="error" label="errors" />}
                {row.needs_verification > 0 && (
                  <Count icon={AlertTriangle} value={row.needs_verification} token="warning" label="need verification" />
                )}
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {row.without_forum_url} no topic
                </Box>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={syncedPercent(row.synced, row.total_questions)}
              aria-label={`${row.license_type} synced share`}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

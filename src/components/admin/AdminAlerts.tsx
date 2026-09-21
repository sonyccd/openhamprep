import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { AlertTriangle, BellOff, Info } from "lucide-react";
import { toast } from "sonner";
import {
  useAlerts,
  useAlertCounts,
  useAcknowledgeAlert,
  useResolveAlert,
  useMonitorRuns,
  type AlertStatus,
} from "@/hooks/useAlerts";
import { tokenAlpha } from "@/theme/muiTheme";
import { AlertCard } from "./alerts/AlertCard";
import { AlertSummaryCards } from "./alerts/AlertSummaryCards";
import { MONITOR_LOG_LIMIT } from "./alerts/alertPresentation";

type StatusFilter = "active" | AlertStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

export function AdminAlerts() {
  const [filter, setFilter] = useState<StatusFilter>("active");
  // "all" is no filter at all to the hook.
  const statusFilter = filter === "all" ? undefined : filter;

  const { data: alerts = [], isLoading, error } = useAlerts(statusFilter);
  const { data: alertCounts } = useAlertCounts();
  const { data: monitorRuns = [] } = useMonitorRuns(5);

  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  const handleAcknowledge = (alertId: string, note?: string) => {
    acknowledgeMutation.mutate(
      { alertId, note },
      {
        onSuccess: () => toast.success("Alert acknowledged"),
        onError: (error) =>
          toast.error("Failed to acknowledge alert", {
            description: error instanceof Error ? error.message : "Unknown error",
          }),
      }
    );
  };

  const handleResolve = (alertId: string) => {
    resolveMutation.mutate(alertId, {
      onSuccess: () => toast.success("Alert resolved"),
      onError: (error) =>
        toast.error("Failed to resolve alert", {
          description: error instanceof Error ? error.message : "Unknown error",
        }),
    });
  };

  if (error) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ py: 4, textAlign: "center", color: "error.main" }}>
          <Box component={AlertTriangle} aria-hidden="true" sx={{ width: 32, height: 32, mx: "auto", mb: 1 }} />
          <Typography>Failed to load alerts: {error.message}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          System Alerts
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Monitor Edge Function health and system issues
        </Typography>
      </Box>

      <AlertSummaryCards
        // Counts come from their own hook, independent of the current filter.
        pendingCount={alertCounts?.pending ?? 0}
        acknowledgedCount={alertCounts?.acknowledged ?? 0}
        resolvedCount={alertCounts?.resolved ?? 0}
        lastRun={monitorRuns[0]}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          fontSize: "0.75rem",
          color: "text.secondary",
          bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
          borderRadius: "8px",
          p: 1.5,
        }}
      >
        <Box component={Info} aria-hidden="true" sx={{ width: 16, height: 16, flexShrink: 0, mt: 0.25 }} />
        <Typography sx={{ fontSize: "inherit" }}>
          The system monitor analyzes up to {MONITOR_LOG_LIMIT} error logs per check. During high-error
          incidents, some errors may not be captured. If you see "(limit)" above, consider checking the{" "}
          <Link href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            Supabase Dashboard Logs
          </Link>{" "}
          for complete data.
        </Typography>
      </Box>

      <Box>
        <Tabs
          value={filter}
          onChange={(_e, value: StatusFilter) => setFilter(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Alert status filter"
        >
          {FILTERS.map((f) => (
            <Tab key={f.value} value={f.value} label={f.label} id={`alerts-tab-${f.value}`} aria-controls="alerts-panel" />
          ))}
        </Tabs>

        <Box role="tabpanel" id="alerts-panel" aria-labelledby={`alerts-tab-${filter}`} sx={{ mt: 2 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }} role="status" aria-label="Loading alerts">
              <CircularProgress size={32} />
            </Box>
          ) : alerts.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                <Box component={BellOff} aria-hidden="true" sx={{ width: 48, height: 48, mx: "auto", mb: 2, opacity: 0.5 }} />
                <Typography sx={{ fontWeight: 500 }}>No alerts</Typography>
                <Typography sx={{ fontSize: "0.875rem", mt: 0.5 }}>
                  {filter === "active" || filter === "pending"
                    ? "All systems are operating normally."
                    : "No alerts match the current filter."}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  isAcknowledging={acknowledgeMutation.isPending}
                  isResolving={resolveMutation.isPending}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

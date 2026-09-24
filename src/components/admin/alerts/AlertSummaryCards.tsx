import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Activity, Bell, Check, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MonitorRun } from "@/hooks/useAlerts";
import { tokenAlpha } from "@/theme/muiTheme";
import { describeNextRun, formatTimeAbbrev, MONITOR_LOG_LIMIT, RUN_STATUS } from "./alertPresentation";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}

function MetricCard({ icon: Glyph, title, children, highlight = false }: MetricCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ ...(highlight && { borderColor: (t) => tokenAlpha(t.vars.palette.warning.main, 50) }) }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          component="h3"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 500, color: "text.secondary" }}
        >
          <Icon icon={Glyph} size={16} />
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

const countSx = { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25 } as const;
const lineSx = { fontSize: "0.875rem" } as const;
const dimSx = { color: "text.secondary" } as const;

interface AlertSummaryCardsProps {
  pendingCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  lastRun: MonitorRun | undefined;
}

/** The four figures at the top: counts by status and whether the monitor is keeping up. */
export function AlertSummaryCards({ pendingCount, acknowledgedCount, resolvedCount, lastRun }: AlertSummaryCardsProps) {
  const overLimit = lastRun?.logs_analyzed != null && lastRun.logs_analyzed >= MONITOR_LOG_LIMIT;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
      <MetricCard icon={Bell} title="Pending" highlight={pendingCount > 0}>
        <Typography data-testid="pending-count" sx={{ ...countSx, color: pendingCount > 0 ? "warning.main" : "text.primary" }}>
          {pendingCount}
        </Typography>
      </MetricCard>

      <MetricCard icon={Check} title="Acknowledged">
        <Typography sx={countSx}>{acknowledgedCount}</Typography>
      </MetricCard>

      <MetricCard icon={CheckCheck} title="Resolved (24h)">
        <Typography sx={countSx}>{resolvedCount}</Typography>
      </MetricCard>

      <MetricCard icon={Activity} title="Monitor Status">
        {lastRun ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography sx={lineSx}>
              <Box component="span" sx={dimSx}>Last:</Box>{" "}
              <Box component="span" sx={{ fontWeight: 500, color: `${RUN_STATUS[lastRun.status].token}.main` }}>
                {RUN_STATUS[lastRun.status].label}
              </Box>
              <Box component="span" sx={dimSx}> {formatTimeAbbrev(new Date(lastRun.started_at))}</Box>
            </Typography>
            <Typography sx={lineSx}>
              <Box component="span" sx={dimSx}>Next:</Box>{" "}
              {describeNextRun(lastRun)}
            </Typography>
            {lastRun.logs_analyzed !== null && (
              <Typography sx={lineSx}>
                <Box component="span" sx={dimSx}>Logs:</Box>{" "}
                <Box component="span" sx={{ ...(overLimit && { color: "warning.main" }) }}>
                  {lastRun.logs_analyzed}
                  {overLimit && " (limit)"}
                </Box>
              </Typography>
            )}
          </Box>
        ) : (
          <Typography sx={{ ...lineSx, ...dimSx }}>No runs yet</Typography>
        )}
      </MetricCard>
    </Box>
  );
}

import { Bell, Check, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import type { AlertStatus, MonitorRun } from "@/hooks/useAlerts";

/** How each alert status is drawn: its icon and the palette token that tints its card. */
export const STATUS_CONFIG: Record<AlertStatus, { icon: LucideIcon; label: string; token: "warning" | "info" | "muted" }> = {
  pending: { icon: Bell, label: "Pending", token: "warning" },
  acknowledged: { icon: Check, label: "Acknowledged", token: "info" },
  resolved: { icon: CheckCheck, label: "Resolved", token: "muted" },
};

/** The monitor runs on a five-minute schedule. */
export const MONITOR_INTERVAL_MS = 5 * 60 * 1000;

/** Past this many logs in one check the monitor stops reading, so later errors go unseen. */
export const MONITOR_LOG_LIMIT = 500;

/** "29m ago", "2h ago": formatDistanceToNowStrict with the units shortened. */
export function formatTimeAbbrev(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: true })
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d");
}

export const RUN_STATUS: Record<MonitorRun["status"], { label: string; token: "success" | "error" | "warning" }> = {
  completed: { label: "OK", token: "success" },
  failed: { label: "Fail", token: "error" },
  running: { label: "Run", token: "warning" },
};

/** When the next run is due, or "soon" if it already is. */
export function describeNextRun(lastRun: MonitorRun, now = Date.now()): string {
  const nextRunTime = new Date(lastRun.started_at).getTime() + MONITOR_INTERVAL_MS;
  return nextRunTime < now ? "soon" : formatTimeAbbrev(new Date(nextRunTime));
}

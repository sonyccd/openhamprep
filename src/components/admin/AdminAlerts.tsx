import { useState } from "react";
import { toast } from "sonner";
import {
  useAlerts,
  useAlertCounts,
  useAcknowledgeAlert,
  useResolveAlert,
  useTriggerMonitor,
  useMonitorRuns,
  type Alert,
  type AlertStatus,
  type Severity,
} from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";

// ============================================================
// HELPERS
// ============================================================

/**
 * Format time distance in abbreviated form (e.g., "29m ago", "2h ago")
 */
function formatTimeAbbrev(date: Date): string {
  const distance = formatDistanceToNowStrict(date, { addSuffix: true });
  return distance
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd');
}

function getSeverityIcon(severity: Severity) {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4" />;
    case 'info':
      return <Info className="w-4 h-4" />;
  }
}

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'warning':
      return 'bg-amber-500 text-white';
    case 'info':
      return 'bg-blue-500 text-white';
  }
}

function getStatusIcon(status: AlertStatus) {
  switch (status) {
    case 'pending':
      return <Bell className="w-4 h-4" />;
    case 'acknowledged':
      return <Check className="w-4 h-4" />;
    case 'resolved':
      return <CheckCheck className="w-4 h-4" />;
  }
}

function getStatusColor(status: AlertStatus): string {
  switch (status) {
    case 'pending':
      return 'border-amber-500/50 bg-amber-500/10';
    case 'acknowledged':
      return 'border-blue-500/50 bg-blue-500/10';
    case 'resolved':
      return 'border-muted bg-muted/30';
  }
}

// ============================================================
// ALERT CARD COMPONENT
// ============================================================

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string, note?: string) => void;
  onResolve: (alertId: string) => void;
  isAcknowledging: boolean;
  isResolving: boolean;
}

function AlertCard({ alert, onAcknowledge, onResolve, isAcknowledging, isResolving }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAckDialog, setShowAckDialog] = useState(false);
  const [ackNote, setAckNote] = useState('');

  const handleAcknowledge = () => {
    onAcknowledge(alert.id, ackNote || undefined);
    setShowAckDialog(false);
    setAckNote('');
  };

  return (
    <>
      <div className={`rounded-lg border p-4 ${getStatusColor(alert.status)}`}>
        <div className="flex items-start gap-3">
          {/* Severity indicator */}
          <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
            {getSeverityIcon(alert.severity)}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground">{alert.title}</h3>
              <Badge variant="outline" className="text-xs">
                {getStatusIcon(alert.status)}
                <span className="ml-1 capitalize">{alert.status}</span>
              </Badge>
              {alert.auto_resolved && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-resolved
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              </span>
              {alert.rule && (
                <span>Rule: {alert.rule.name}</span>
              )}
            </div>

            {/* Expandable context */}
            {alert.context && Object.keys(alert.context).length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide details' : 'Show details'}
              </button>
            )}

            {expanded && alert.context && (
              <div className="mt-3 p-3 rounded bg-background/50 border border-border">
                {alert.context.function_names && alert.context.function_names.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-foreground">Affected functions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.context.function_names.map(fn => (
                        <Badge key={fn} variant="secondary" className="text-xs font-mono">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {alert.context.error_count !== undefined && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Error count: <span className="font-medium text-foreground">{alert.context.error_count}</span>
                  </div>
                )}

                {alert.context.consecutive_failures !== undefined && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Consecutive failures: <span className="font-medium text-foreground">{alert.context.consecutive_failures}</span>
                  </div>
                )}

                {alert.context.matched_pattern && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Matched pattern: <code className="bg-muted px-1 rounded">{alert.context.matched_pattern}</code>
                  </div>
                )}

                {alert.context.sample_errors && alert.context.sample_errors.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-foreground">Sample errors:</span>
                    <div className="mt-1 space-y-1">
                      {alert.context.sample_errors.map((err, i) => (
                        <div key={i} className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {alert.acknowledgment_note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs font-medium text-foreground">Acknowledgment note:</span>
                    <p className="text-xs text-muted-foreground mt-1">{alert.acknowledgment_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {alert.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAckDialog(true)}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Acknowledge
                  </>
                )}
              </Button>
            )}
            {alert.status !== 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolve(alert.id)}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Resolve
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Acknowledge Dialog */}
      <Dialog open={showAckDialog} onOpenChange={setShowAckDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Acknowledging this alert indicates you've seen it and are aware of the issue.
              Optionally add a note about your action or plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Optional note (e.g., 'Investigating', 'Known issue', 'Escalated to team')"
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAckDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
              {isAcknowledging ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AdminAlerts() {
  const [statusFilter, setStatusFilter] = useState<'active' | AlertStatus | undefined>('active');

  const { data: alerts = [], isLoading, error } = useAlerts(statusFilter);
  const { data: alertCounts } = useAlertCounts();
  const { data: monitorRuns = [] } = useMonitorRuns(5);

  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  const triggerMutation = useTriggerMonitor();

  const handleAcknowledge = (alertId: string, note?: string) => {
    acknowledgeMutation.mutate({ alertId, note }, {
      onSuccess: () => {
        toast.success("Alert acknowledged");
      },
      onError: (error) => {
        toast.error("Failed to acknowledge alert", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });
  };

  const handleResolve = (alertId: string) => {
    resolveMutation.mutate(alertId, {
      onSuccess: () => {
        toast.success("Alert resolved");
      },
      onError: (error) => {
        toast.error("Failed to resolve alert", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });
  };

  const handleTriggerMonitor = () => {
    toast.loading("Running system monitor...", { id: "monitor-trigger" });
    triggerMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Monitor completed successfully", {
          id: "monitor-trigger",
          description: "Check the results below for any new alerts.",
        });
      },
      onError: (error) => {
        toast.error("Monitor failed to run", {
          id: "monitor-trigger",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });
  };

  // Get counts from dedicated hook (independent of current filter)
  const pendingCount = alertCounts?.pending ?? 0;
  const acknowledgedCount = alertCounts?.acknowledged ?? 0;
  const resolvedCount = alertCounts?.resolved ?? 0;

  const lastRun = monitorRuns[0];

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load alerts: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Monitor Edge Function health and system issues
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleTriggerMonitor}
          disabled={triggerMutation.isPending}
        >
          {triggerMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Run Monitor Now
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className={pendingCount > 0 ? 'border-amber-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
              {pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4" />
              Acknowledged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{acknowledgedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCheck className="w-4 h-4" />
              Resolved (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{resolvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitor Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {lastRun ? (
              <>
                <div className="text-sm">
                  <span className="text-muted-foreground">Last: </span>
                  <span className={`font-medium ${lastRun.status === 'completed' ? 'text-success' : lastRun.status === 'failed' ? 'text-destructive' : 'text-amber-500'}`}>
                    {lastRun.status === 'completed' ? 'OK' : lastRun.status === 'failed' ? 'Fail' : 'Run'}
                  </span>
                  <span className="text-muted-foreground"> {formatTimeAbbrev(new Date(lastRun.started_at))}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Next: </span>
                  <span className="text-foreground">
                    {(() => {
                      const nextRunTime = new Date(lastRun.started_at).getTime() + 5 * 60 * 1000;
                      if (nextRunTime < Date.now()) {
                        return "soon";
                      }
                      return formatTimeAbbrev(new Date(nextRunTime));
                    })()}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No runs yet</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <Tabs value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v as 'active' | AlertStatus)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter || 'all'} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No alerts</p>
                  <p className="text-sm mt-1">
                    {statusFilter === 'active' || statusFilter === 'pending'
                      ? "All systems are operating normally."
                      : "No alerts match the current filter."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  isAcknowledging={acknowledgeMutation.isPending}
                  isResolving={resolveMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

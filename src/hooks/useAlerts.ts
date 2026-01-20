import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// CONSTANTS
// ============================================================

/** Time window for resolved alerts count (24 hours in ms) */
const RESOLVED_LOOKBACK_MS = 24 * 60 * 60 * 1000;

/** Delay before refetching after triggering monitor (5 seconds) */
const TRIGGER_REFETCH_DELAY_MS = 5_000;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type Severity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';
export type RuleType = 'error_rate' | 'error_pattern' | 'function_health';

export interface AlertContext {
  function_names?: string[];
  error_count?: number;
  sample_errors?: string[];
  time_window_start?: string;
  time_window_end?: string;
  matched_pattern?: string;
  consecutive_failures?: number;
}

export interface Alert {
  id: string;
  rule_id: string | null;
  title: string;
  message: string;
  severity: Severity;
  context: AlertContext;
  status: AlertStatus;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  acknowledgment_note: string | null;
  resolved_at: string | null;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  rule?: AlertRule;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  target_functions: string[] | null;
  config: Record<string, unknown>;
  severity: Severity;
  cooldown_minutes: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitorRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  rules_evaluated: number | null;
  alerts_created: number | null;
  alerts_auto_resolved: number | null;
  logs_analyzed: number | null;
  duration_ms: number | null;
  status: 'running' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}

// ============================================================
// ALERTS HOOKS
// ============================================================

/**
 * Fetch all alerts, optionally filtered by status.
 */
export function useAlerts(statusFilter?: AlertStatus | 'active') {
  return useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select(`
          *,
          rule:alert_rules(*)
        `)
        .order('created_at', { ascending: false });

      // Filter by status
      if (statusFilter === 'active') {
        // Active = pending or acknowledged (not resolved)
        query = query.in('status', ['pending', 'acknowledged']);
      } else if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Alert[];
    },
    staleTime: 1000 * 30, // 30 seconds - alerts should be relatively fresh
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Get count of unacknowledged alerts (pending status).
 */
export function useUnacknowledgedAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'unacknowledged-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Get counts for all alert statuses (for dashboard metrics).
 * This fetches counts independently of the current filter.
 */
export function useAlertCounts() {
  return useQuery({
    queryKey: ['alerts', 'counts'],
    queryFn: async () => {
      // Fetch counts for each status in parallel
      const [pendingResult, acknowledgedResult, resolvedResult] = await Promise.all([
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'acknowledged'),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved')
          .gte('created_at', new Date(Date.now() - RESOLVED_LOOKBACK_MS).toISOString()),
      ]);

      if (pendingResult.error) throw pendingResult.error;
      if (acknowledgedResult.error) throw acknowledgedResult.error;
      if (resolvedResult.error) throw resolvedResult.error;

      return {
        pending: pendingResult.count || 0,
        acknowledged: acknowledgedResult.count || 0,
        resolved: resolvedResult.count || 0,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Acknowledge an alert.
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, note }: { alertId: string; note?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          acknowledgment_note: note || null,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Resolve an alert.
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          auto_resolved: false,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Delete an alert (admin only).
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ============================================================
// ALERT RULES HOOKS
// ============================================================

/**
 * Fetch all alert rules.
 */
export function useAlertRules() {
  return useQuery({
    queryKey: ['alert-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as AlertRule[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - rules don't change often
  });
}

/**
 * Toggle a rule's enabled status.
 */
export function useToggleAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, isEnabled }: { ruleId: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('alert_rules')
        .update({ is_enabled: isEnabled })
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

/**
 * Create a new alert rule.
 */
export function useCreateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data as AlertRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

/**
 * Update an existing alert rule.
 */
export function useUpdateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlertRule> & { id: string }) => {
      const { error } = await supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

/**
 * Delete an alert rule.
 */
export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

// ============================================================
// MONITORING HOOKS
// ============================================================

/**
 * Fetch recent monitor runs.
 */
export function useMonitorRuns(limit = 20) {
  return useQuery({
    queryKey: ['monitor-runs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_monitor_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MonitorRun[];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Manually trigger the system monitor.
 */
export function useTriggerMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Call the trigger_system_monitor function
      const { data, error } = await supabase.rpc('trigger_system_monitor');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries after a delay to allow the edge function to complete
      // Edge function has 30s timeout, so 5s delay gives time for fast runs
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['monitor-runs'] });
      }, TRIGGER_REFETCH_DELAY_MS);
    },
  });
}

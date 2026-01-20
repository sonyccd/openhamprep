import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, isServiceRoleToken } from "../_shared/constants.ts";
import {
  evaluateAllRules,
  findAlertsToAutoResolve,
  type AlertRule,
  type Alert,
  type NewAlert,
  type LogEntry,
} from "./logic.ts";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface MonitorResponse {
  success: boolean;
  rules_evaluated: number;
  alerts_created: number;
  alerts_auto_resolved: number;
  logs_analyzed: number;
  duration_ms: number;
  errors?: string[];
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  const errors: string[] = [];

  // Create admin client outside try-catch so we can record failures
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Track run ID for failure recording
  let runId: string | undefined;

  try {
    // This function should only be called by:
    // 1. pg_cron (via pg_net with service role)
    // 2. Admin manual trigger (with service role or admin user)
    const authHeader = req.headers.get("Authorization");

    // If auth header present, verify it's service role or admin
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (!isServiceRoleToken(token)) {
        // Check if user is admin
        const supabaseUser = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
          );
        }

        // Check admin role
        const { data: roleData, error: roleError } = await supabaseUser
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (roleError || !roleData) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[${requestId}] Starting system monitor check`);

    // Record that a monitor run has started
    const { data: runRecord, error: runError } = await supabaseAdmin
      .from("system_monitor_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError) {
      console.error(`[${requestId}] Failed to create monitor run record:`, runError);
      // Continue anyway - monitoring is more important than tracking
    }

    runId = runRecord?.id;

    // Helper to update run status
    const updateRunStatus = async (
      status: "completed" | "failed",
      stats: Partial<MonitorResponse>,
      errorMessage?: string
    ) => {
      if (!runId) return;
      try {
        await supabaseAdmin
          .from("system_monitor_runs")
          .update({
            status,
            completed_at: new Date().toISOString(),
            rules_evaluated: stats.rules_evaluated ?? 0,
            alerts_created: stats.alerts_created ?? 0,
            alerts_auto_resolved: stats.alerts_auto_resolved ?? 0,
            logs_analyzed: stats.logs_analyzed ?? 0,
            duration_ms: stats.duration_ms ?? (Date.now() - startTime),
            error_message: errorMessage,
          })
          .eq("id", runId);
      } catch (err) {
        console.error(`[${requestId}] Failed to update run status:`, err);
      }
    };

    // 1. Load enabled alert rules
    const rules = await loadAlertRules(supabaseAdmin, requestId);
    console.log(`[${requestId}] Loaded ${rules.length} enabled alert rules`);

    if (rules.length === 0) {
      console.log(`[${requestId}] No enabled rules, skipping`);
      const emptyResponse: MonitorResponse = {
        success: true,
        rules_evaluated: 0,
        alerts_created: 0,
        alerts_auto_resolved: 0,
        logs_analyzed: 0,
        duration_ms: Date.now() - startTime,
      };
      await updateRunStatus("completed", emptyResponse);
      return createResponse(emptyResponse);
    }

    // 2. Fetch Edge Function logs
    const logs = await fetchEdgeFunctionLogs(requestId);
    console.log(`[${requestId}] Fetched ${logs.length} log entries`);

    // 3. Load existing pending alerts (for cooldown checks)
    const existingAlerts = await loadExistingAlerts(supabaseAdmin, requestId);
    console.log(`[${requestId}] Loaded ${existingAlerts.length} existing alerts`);

    // 4. Evaluate all rules
    const now = new Date();
    const newAlerts = evaluateAllRules(rules, logs, existingAlerts, now);
    console.log(`[${requestId}] Rules triggered ${newAlerts.length} new alerts`);

    // 5. Create new alerts (batch insert for atomicity)
    let alertsCreated = 0;
    if (newAlerts.length > 0) {
      try {
        alertsCreated = await createAlertsBatch(supabaseAdmin, newAlerts);
        console.log(`[${requestId}] Created ${alertsCreated} alerts in batch`);
      } catch (err) {
        const errMsg = `Failed to create alerts batch: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errMsg);
        console.error(`[${requestId}] ${errMsg}`);
      }
    }

    // 6. Auto-resolve alerts where condition has cleared (batch update for atomicity)
    const pendingAlerts = existingAlerts.filter(a => a.status === "pending");
    const alertsToResolve = findAlertsToAutoResolve(pendingAlerts, rules, logs, now);
    console.log(`[${requestId}] Auto-resolving ${alertsToResolve.length} alerts`);

    let alertsResolved = 0;
    if (alertsToResolve.length > 0) {
      try {
        alertsResolved = await autoResolveAlertsBatch(supabaseAdmin, alertsToResolve);
        console.log(`[${requestId}] Auto-resolved ${alertsResolved} alerts in batch`);
      } catch (err) {
        const errMsg = `Failed to auto-resolve alerts batch: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errMsg);
        console.error(`[${requestId}] ${errMsg}`);
      }
    }

    const response: MonitorResponse = {
      success: true,
      rules_evaluated: rules.length,
      alerts_created: alertsCreated,
      alerts_auto_resolved: alertsResolved,
      logs_analyzed: logs.length,
      duration_ms: Date.now() - startTime,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    // Record successful completion
    await updateRunStatus(
      "completed",
      response,
      errors.length > 0 ? errors.join("; ") : undefined
    );

    console.log(`[${requestId}] Completed in ${response.duration_ms}ms`);
    return createResponse(response);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${requestId}] Error:`, error);

    // Record failed run if we have a run ID
    if (runId) {
      try {
        await supabaseAdmin
          .from("system_monitor_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error_message: errMsg,
          })
          .eq("id", runId);
      } catch (updateErr) {
        console.error(`[${requestId}] Failed to record run failure:`, updateErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg,
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createResponse(data: MonitorResponse): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
  );
}

async function loadAlertRules(supabase: SupabaseClient, requestId: string): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("is_enabled", true);

  if (error) {
    console.error(`[${requestId}] Failed to load alert rules:`, error);
    throw new Error(`Failed to load alert rules: ${error.message}`);
  }

  return data || [];
}

async function loadExistingAlerts(supabase: SupabaseClient, requestId: string): Promise<Alert[]> {
  // Load alerts from the last 24 hours for cooldown checking
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[${requestId}] Failed to load existing alerts:`, error);
    throw new Error(`Failed to load existing alerts: ${error.message}`);
  }

  return data || [];
}

/**
 * Batch insert all new alerts in a single database call.
 * This ensures atomicity - either all alerts are created or none are.
 * If the Edge Function times out after this call is sent, the DB will still complete it.
 */
async function createAlertsBatch(supabase: SupabaseClient, alerts: NewAlert[]): Promise<number> {
  if (alerts.length === 0) return 0;

  const alertRows = alerts.map(alert => ({
    rule_id: alert.rule_id,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    context: alert.context,
    status: "pending",
  }));

  const { data, error } = await supabase
    .from("alerts")
    .insert(alertRows)
    .select("id");

  if (error) {
    throw new Error(`Batch insert failed: ${error.message}`);
  }

  return data?.length ?? 0;
}

/**
 * Batch update all alerts to resolved status in a single database call.
 * Uses the IN operator to update multiple rows atomically.
 */
async function autoResolveAlertsBatch(supabase: SupabaseClient, alertIds: string[]): Promise<number> {
  if (alertIds.length === 0) return 0;

  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      auto_resolved: true,
    })
    .in("id", alertIds)
    .select("id");

  if (error) {
    throw new Error(`Batch update failed: ${error.message}`);
  }

  return data?.length ?? 0;
}

// ============================================================
// LOG FETCHING
// ============================================================

/**
 * Fetch Edge Function logs by querying Supabase's edge_logs via the Analytics API.
 * Uses the same query format as the Supabase Dashboard Logs Explorer.
 */
async function fetchEdgeFunctionLogs(requestId: string): Promise<LogEntry[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(`[${requestId}] Missing env vars for log fetching`);
    return [];
  }

  // Extract project ref from URL (format: https://<project-ref>.supabase.co)
  const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!projectRefMatch) {
    console.warn(`[${requestId}] Could not extract project ref from URL: ${supabaseUrl}`);
    console.warn(`[${requestId}] Local development detected - no logs to query`);
    return [];
  }

  const projectRef = projectRefMatch[1];

  // Query edge_logs for errors in the last 30 minutes
  // This uses the same SQL-like syntax as the Supabase Dashboard Logs Explorer
  //
  // LIMITATION: This query returns at most 500 entries. During high-error-rate
  // incidents, some errors may be missed. Consider reducing the time window or
  // implementing pagination for high-volume scenarios.
  const query = `
    select
      cast(timestamp as datetime) as timestamp,
      event_message,
      metadata
    from edge_logs
      cross join unnest(metadata) as m
      cross join unnest(m.response) as r
    where
      timestamp > now() - interval '30 minutes'
      and (
        r.status_code >= 500
        or event_message ilike '%error%'
        or event_message ilike '%failed%'
        or event_message ilike '%exception%'
      )
    order by timestamp desc
    limit 500
  `;

  // The Analytics API endpoint
  const analyticsUrl = `https://${projectRef}.supabase.co/analytics/v1/query`;

  try {
    // Add 10-second timeout to prevent hanging if Analytics API is slow
    const response = await fetch(analyticsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Analytics query failed: ${response.status} - ${errorText}`);

      // If analytics API isn't available, return empty (not an error)
      if (response.status === 404 || response.status === 401) {
        console.warn(`[${requestId}] Analytics API not available - alerting will be limited`);
        return [];
      }
      return [];
    }

    const data = await response.json();

    // Transform the query results into LogEntry format
    const logs: LogEntry[] = [];

    if (Array.isArray(data.result)) {
      for (const row of data.result) {
        // Extract function name from metadata if available
        let functionName = "unknown";
        if (row.metadata) {
          try {
            const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
            functionName = meta.function_id || meta.path?.replace("/", "") || "unknown";
          } catch {
            // Ignore parse errors
          }
        }

        logs.push({
          timestamp: row.timestamp || new Date().toISOString(),
          level: "error",
          message: row.event_message || "",
          function_name: functionName,
        });
      }
    }

    console.log(`[${requestId}] Fetched ${logs.length} error logs from edge_logs`);
    return logs;

  } catch (error) {
    console.error(`[${requestId}] Error fetching logs:`, error);
    return [];
  }
}

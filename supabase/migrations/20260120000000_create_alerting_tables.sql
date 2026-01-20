-- System Monitoring & Alerting Tables
-- This migration creates infrastructure for monitoring Edge Function health and alerting admins

-- ============================================================
-- 1. ALERT_RULES TABLE
-- Configurable rules for triggering alerts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Rule type determines evaluation logic
  -- 'error_rate': Alert when errors exceed threshold in time window
  -- 'error_pattern': Alert when specific error patterns are detected
  -- 'function_health': Alert when a function fails consecutively
  rule_type TEXT NOT NULL CHECK (rule_type IN ('error_rate', 'error_pattern', 'function_health')),

  -- Which functions to monitor (NULL = all functions)
  target_functions TEXT[],

  -- Rule-specific configuration (varies by rule_type)
  -- error_rate: { "threshold": 5, "window_minutes": 15 }
  -- error_pattern: { "pattern": "timeout", "case_sensitive": false }
  -- function_health: { "consecutive_failures": 3 }
  config JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Alert severity
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Prevent re-alerting for the same condition within this period
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,

  -- Enable/disable rule without deleting
  is_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ALERTS TABLE
-- Individual alert instances created when rules trigger
-- ============================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the rule that triggered this alert
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,

  -- Alert details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Additional context about the alert (error samples, function names, timestamps, etc.)
  context JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Alert lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),

  -- Acknowledgment tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledgment_note TEXT,

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  auto_resolved BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES FOR EFFICIENT QUERIES
-- ============================================================

-- Alert rules: Filter by enabled status and type
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON public.alert_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON public.alert_rules(rule_type);

-- Alerts: Filter by status for dashboard display
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_rule ON public.alerts(rule_id);

-- Composite index for checking cooldowns (rule + time)
CREATE INDEX IF NOT EXISTS idx_alerts_rule_created ON public.alerts(rule_id, created_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- Admin-only access for both tables
-- ============================================================

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Alert Rules: Admin read/write
CREATE POLICY "Admins can view all alert rules"
  ON public.alert_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert alert rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update alert rules"
  ON public.alert_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete alert rules"
  ON public.alert_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Alerts: Admin read/write
CREATE POLICY "Admins can view all alerts"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update alerts"
  ON public.alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON public.alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role bypass for Edge Function access
-- The system-monitor Edge Function uses service role to read rules and create alerts
CREATE POLICY "Service role can view all alert rules"
  ON public.alert_rules FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all alerts"
  ON public.alerts FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update alerts"
  ON public.alerts FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to alert_rules
DROP TRIGGER IF EXISTS trg_alert_rules_updated_at ON public.alert_rules;
CREATE TRIGGER trg_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to alerts
DROP TRIGGER IF EXISTS trg_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. SEED DEFAULT ALERT RULES
-- ============================================================

INSERT INTO public.alert_rules (name, description, rule_type, config, severity, cooldown_minutes, is_enabled) VALUES
  (
    'High Error Rate',
    'Alert when more than 5 errors occur within a 15-minute window across any Edge Function',
    'error_rate',
    '{"threshold": 5, "window_minutes": 15}'::JSONB,
    'critical',
    30,
    true
  ),
  (
    'Timeout Pattern Detection',
    'Alert when timeout-related errors are detected in Edge Function logs',
    'error_pattern',
    '{"pattern": "timeout|timed out|deadline exceeded", "case_sensitive": false}'::JSONB,
    'warning',
    60,
    true
  ),
  (
    'Consecutive Function Failures',
    'Alert when a single Edge Function fails 3 or more times in a row',
    'function_health',
    '{"consecutive_failures": 3}'::JSONB,
    'critical',
    60,
    true
  ),
  (
    'Database Connection Errors',
    'Alert when database connection errors are detected',
    'error_pattern',
    '{"pattern": "connection refused|ECONNREFUSED|too many connections|connection pool", "case_sensitive": false}'::JSONB,
    'critical',
    30,
    true
  ),
  (
    'Authentication Failures Spike',
    'Alert when authentication-related errors spike (>10 in 10 minutes)',
    'error_rate',
    '{"threshold": 10, "window_minutes": 10, "error_pattern": "auth|unauthorized|401"}'::JSONB,
    'warning',
    60,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.alert_rules IS 'Configurable rules that determine when system alerts should be triggered. Monitored by the system-monitor Edge Function.';
COMMENT ON TABLE public.alerts IS 'Alert instances created when alert rules are triggered. Displayed in admin console for acknowledgment and tracking.';

COMMENT ON COLUMN public.alert_rules.rule_type IS 'Type of rule: error_rate (count threshold), error_pattern (regex match), function_health (consecutive failures)';
COMMENT ON COLUMN public.alert_rules.target_functions IS 'Specific Edge Functions to monitor. NULL means monitor all functions.';
COMMENT ON COLUMN public.alert_rules.config IS 'Rule-specific configuration as JSONB. Structure varies by rule_type.';
COMMENT ON COLUMN public.alert_rules.cooldown_minutes IS 'Minimum time between repeated alerts for the same rule.';

COMMENT ON COLUMN public.alerts.context IS 'Additional context: error samples, function names, timestamps, stack traces, etc.';
COMMENT ON COLUMN public.alerts.auto_resolved IS 'True if the alert was automatically resolved when condition cleared.';

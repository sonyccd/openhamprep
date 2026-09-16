import { AlertCircle, AlertTriangle, Gauge, HeartPulse, Info, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AlertRule, RuleType, Severity } from '@/hooks/useAlerts';

interface RuleTypeConfig {
  icon: LucideIcon;
  label: string;
  /** Shown beside the label in the type picker. */
  hint: string;
}

export const RULE_TYPE_CONFIG: Record<RuleType, RuleTypeConfig> = {
  error_rate: { icon: Gauge, label: 'Error Rate', hint: 'Count errors in time window' },
  error_pattern: { icon: Search, label: 'Error Pattern', hint: 'Match specific error text' },
  function_health: { icon: HeartPulse, label: 'Function Health', hint: 'Consecutive failures' },
};

interface SeverityConfig {
  icon: LucideIcon;
  label: string;
  /**
   * An MUI palette token. The old markup hardcoded bg-amber-500 / bg-blue-500
   * and text-white for warning and info, which CLAUDE.md rules out and which
   * do not follow the theme — they stayed the same colour in both modes.
   */
  token: 'error' | 'warning' | 'info';
}

export const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
  critical: { icon: AlertTriangle, label: 'Critical', token: 'error' },
  warning: { icon: AlertCircle, label: 'Warning', token: 'warning' },
  info: { icon: Info, label: 'Info', token: 'info' },
};

export interface RuleFormData {
  name: string;
  description: string;
  rule_type: RuleType;
  severity: Severity;
  cooldown_minutes: number;
  /** Comma-separated while being edited; split on save. */
  target_functions: string;
  threshold: number;
  window_minutes: number;
  pattern: string;
  case_sensitive: boolean;
  consecutive_failures: number;
  error_pattern: string;
}

export const DEFAULT_FORM_DATA: RuleFormData = {
  name: '',
  description: '',
  rule_type: 'error_rate',
  severity: 'warning',
  cooldown_minutes: 60,
  target_functions: '',
  threshold: 5,
  window_minutes: 15,
  pattern: '',
  case_sensitive: false,
  consecutive_failures: 3,
  error_pattern: '',
};

/**
 * Seeds the form from an existing rule, or returns the blank defaults.
 *
 * The config column is untyped JSON, so every field falls back to its default
 * rather than trusting what is stored.
 */
export function ruleToFormData(rule?: AlertRule): RuleFormData {
  if (!rule) return DEFAULT_FORM_DATA;

  const config = rule.config as Record<string, unknown>;
  return {
    name: rule.name,
    description: rule.description || '',
    rule_type: rule.rule_type,
    severity: rule.severity,
    cooldown_minutes: rule.cooldown_minutes,
    target_functions: rule.target_functions?.join(', ') || '',
    threshold: (config.threshold as number) || DEFAULT_FORM_DATA.threshold,
    window_minutes: (config.window_minutes as number) || DEFAULT_FORM_DATA.window_minutes,
    pattern: (config.pattern as string) || '',
    case_sensitive: (config.case_sensitive as boolean) || false,
    consecutive_failures:
      (config.consecutive_failures as number) || DEFAULT_FORM_DATA.consecutive_failures,
    error_pattern: (config.error_pattern as string) || '',
  };
}

/** Only the fields the chosen rule type actually uses reach the config column. */
export function buildRuleConfig(formData: RuleFormData): Record<string, unknown> {
  switch (formData.rule_type) {
    case 'error_rate':
      return {
        threshold: formData.threshold,
        window_minutes: formData.window_minutes,
        ...(formData.error_pattern ? { error_pattern: formData.error_pattern } : {}),
      };
    case 'error_pattern':
      return { pattern: formData.pattern, case_sensitive: formData.case_sensitive };
    case 'function_health':
      return { consecutive_failures: formData.consecutive_failures };
  }
}

export function parseTargetFunctions(value: string): string[] | null {
  const names = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return names.length > 0 ? names : null;
}

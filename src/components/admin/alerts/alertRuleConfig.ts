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
 * config is an untyped JSON column, so these check the type rather than
 * casting and hoping.
 *
 * They fall back only when the value is missing or the wrong type — not when
 * it is falsy. `x || default` would swap a stored 0 for the default, which is
 * both wrong (the editor should show what is stored, so an out-of-range value
 * can be seen and corrected) and inconsistent with cooldown_minutes, which is
 * a real column and is passed straight through.
 */
const numberOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const stringOr = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

/** Seeds the form from an existing rule, or returns the blank defaults. */
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
    threshold: numberOr(config.threshold, DEFAULT_FORM_DATA.threshold),
    window_minutes: numberOr(config.window_minutes, DEFAULT_FORM_DATA.window_minutes),
    pattern: stringOr(config.pattern, ''),
    case_sensitive: config.case_sensitive === true,
    consecutive_failures: numberOr(
      config.consecutive_failures,
      DEFAULT_FORM_DATA.consecutive_failures
    ),
    error_pattern: stringOr(config.error_pattern, ''),
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

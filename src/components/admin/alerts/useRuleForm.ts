import { useEffect, useState } from 'react';
import type { AlertRule } from '@/hooks/useAlerts';
import { isValidRegexPattern } from './regexSafety';
import { ruleToFormData, type RuleFormData } from './alertRuleConfig';

export interface ValidationErrors {
  name?: string;
  pattern?: string;
  threshold?: string;
  window_minutes?: string;
  cooldown_minutes?: string;
  consecutive_failures?: string;
}

interface UseRuleFormOptions {
  /** The rule being edited, or undefined when creating. */
  rule?: AlertRule;
  open: boolean;
  onSave: (formData: RuleFormData) => void;
}

/**
 * The rule editor's form state, seeded from whichever rule is being edited.
 *
 * The seeding used to be a useState lazy initialiser, which runs exactly once —
 * at the editor's first mount. The editor is mounted unconditionally by
 * AdminAlertRules with only `open` toggling, so that initialiser ran while
 * `rule` was still undefined and never ran again. Every edit therefore opened
 * on blank defaults, and saving wrote those defaults over the real rule.
 *
 * Re-seeding on `open` fixes both that and the draft left behind by a
 * cancelled create.
 */
export function useRuleForm({ rule, open, onSave }: UseRuleFormOptions) {
  const [formData, setFormData] = useState<RuleFormData>(() => ruleToFormData(rule));
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (open) {
      setFormData(ruleToFormData(rule));
      setErrors({});
    }
    // rule is read only when open flips; re-seeding mid-edit would discard
    // what the user has typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule?.id]);

  const updateField = <K extends keyof RuleFormData>(field: K, value: RuleFormData[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const validate = (): ValidationErrors => {
    const next: ValidationErrors = {};

    if (!formData.name.trim()) next.name = 'Rule name is required';
    if (formData.cooldown_minutes < 1) next.cooldown_minutes = 'Cooldown must be at least 1 minute';

    switch (formData.rule_type) {
      case 'error_rate': {
        if (formData.threshold < 1) next.threshold = 'Threshold must be at least 1';
        if (formData.window_minutes < 1) next.window_minutes = 'Window must be at least 1 minute';
        // The filter is optional, but a bad one still has to be caught.
        if (formData.error_pattern) {
          const check = isValidRegexPattern(formData.error_pattern);
          if (!check.valid) next.pattern = check.error;
        }
        break;
      }
      case 'error_pattern': {
        const check = isValidRegexPattern(formData.pattern);
        if (!check.valid) next.pattern = check.error;
        break;
      }
      case 'function_health': {
        if (formData.consecutive_failures < 1) {
          next.consecutive_failures = 'Must be at least 1 consecutive failure';
        }
        break;
      }
    }

    return next;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length === 0) onSave(formData);
  };

  return { formData, errors, updateField, submit };
}

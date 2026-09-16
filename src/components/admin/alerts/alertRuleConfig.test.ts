import { describe, it, expect } from 'vitest';
import type { AlertRule } from '@/hooks/useAlerts';
import {
  DEFAULT_FORM_DATA,
  buildRuleConfig,
  parseTargetFunctions,
  ruleToFormData,
} from './alertRuleConfig';

const rule = (over: Partial<AlertRule> = {}): AlertRule =>
  ({
    id: 'r1',
    name: 'High Error Rate',
    description: 'Watches the error count',
    rule_type: 'error_rate',
    target_functions: ['one', 'two'],
    config: { threshold: 9, window_minutes: 45 },
    severity: 'critical',
    cooldown_minutes: 30,
    is_enabled: true,
    created_at: '',
    updated_at: '',
    ...over,
  }) as AlertRule;

describe('ruleToFormData', () => {
  it('returns the blank defaults with no rule', () => {
    expect(ruleToFormData()).toEqual(DEFAULT_FORM_DATA);
  });

  it('reads the rule, including values nested in config', () => {
    const form = ruleToFormData(rule());

    expect(form).toMatchObject({
      name: 'High Error Rate',
      cooldown_minutes: 30,
      severity: 'critical',
      threshold: 9,
      window_minutes: 45,
      target_functions: 'one, two',
    });
  });

  /** config is an untyped JSON column, so a missing key falls back. */
  it('falls back to defaults for anything config does not carry', () => {
    const form = ruleToFormData(rule({ config: {} }));

    expect(form.threshold).toBe(DEFAULT_FORM_DATA.threshold);
    expect(form.window_minutes).toBe(DEFAULT_FORM_DATA.window_minutes);
    expect(form.consecutive_failures).toBe(DEFAULT_FORM_DATA.consecutive_failures);
  });

  it('renders a null description and null target list as empty strings', () => {
    const form = ruleToFormData(rule({ description: null, target_functions: null }));

    expect(form.description).toBe('');
    expect(form.target_functions).toBe('');
  });

  /**
   * Out-of-range stored values are passed through rather than silently
   * corrected, so the editor shows what is actually stored and it can be seen
   * and fixed.
   */
  it('passes a stored cooldown through even when out of range', () => {
    expect(ruleToFormData(rule({ cooldown_minutes: 0 })).cooldown_minutes).toBe(0);
  });

  /**
   * The config fields have to agree with cooldown above. A `|| default`
   * fallback swapped a stored 0 for the default, so an out-of-range config
   * value was invisible in the editor and got written back as the default on
   * the next save.
   */
  it('passes a stored 0 in config through, rather than reading it as missing', () => {
    const form = ruleToFormData(
      rule({ config: { threshold: 0, window_minutes: 0 } })
    );

    expect(form.threshold).toBe(0);
    expect(form.window_minutes).toBe(0);
  });

  /** config is untyped JSON, so a wrong-typed value must not reach the field. */
  it.each([
    ['a string', '7'],
    ['null', null],
    ['an object', {}],
    ['NaN', NaN],
  ])('falls back when threshold is %s', (_label, threshold) => {
    expect(ruleToFormData(rule({ config: { threshold } })).threshold).toBe(
      DEFAULT_FORM_DATA.threshold
    );
  });

  it('falls back when a text field holds something that is not a string', () => {
    const form = ruleToFormData(rule({ config: { pattern: 42, error_pattern: {} } }));

    expect(form.pattern).toBe('');
    expect(form.error_pattern).toBe('');
  });

  it('treats only a real true as case sensitive', () => {
    expect(ruleToFormData(rule({ config: { case_sensitive: true } })).case_sensitive).toBe(true);
    expect(ruleToFormData(rule({ config: { case_sensitive: 'yes' } })).case_sensitive).toBe(false);
    expect(ruleToFormData(rule({ config: {} })).case_sensitive).toBe(false);
  });
});

describe('buildRuleConfig', () => {
  it('writes only the keys the chosen type uses', () => {
    const form = { ...DEFAULT_FORM_DATA, rule_type: 'function_health' as const };

    expect(buildRuleConfig(form)).toEqual({ consecutive_failures: 3 });
  });

  it('omits an empty optional filter rather than storing a blank', () => {
    const form = { ...DEFAULT_FORM_DATA, rule_type: 'error_rate' as const, error_pattern: '' };

    expect(buildRuleConfig(form)).toEqual({ threshold: 5, window_minutes: 15 });
  });

  it('includes the filter once it has content', () => {
    const form = {
      ...DEFAULT_FORM_DATA,
      rule_type: 'error_rate' as const,
      error_pattern: 'database',
    };

    expect(buildRuleConfig(form)).toEqual({
      threshold: 5,
      window_minutes: 15,
      error_pattern: 'database',
    });
  });

  /** Switching type must not carry the previous type's keys across. */
  it('drops fields belonging to a type that is no longer chosen', () => {
    const form = {
      ...DEFAULT_FORM_DATA,
      rule_type: 'error_pattern' as const,
      pattern: 'timeout',
      threshold: 99,
      consecutive_failures: 7,
    };

    expect(buildRuleConfig(form)).toEqual({ pattern: 'timeout', case_sensitive: false });
  });
});

describe('parseTargetFunctions', () => {
  it('splits and trims a comma-separated list', () => {
    expect(parseTargetFunctions('one, two ,three')).toEqual(['one', 'two', 'three']);
  });

  /** Empty means "monitor all", which the column stores as null. */
  it('returns null for an empty value', () => {
    expect(parseTargetFunctions('')).toBeNull();
  });

  it('returns null for a value that is only separators and spaces', () => {
    expect(parseTargetFunctions(' , , ')).toBeNull();
  });
});

import { useState } from "react";
import {
  useAlertRules,
  useToggleAlertRule,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  type AlertRule,
  type RuleType,
  type Severity,
} from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Gauge,
  Search,
  HeartPulse,
  Clock,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

function getRuleTypeIcon(ruleType: RuleType) {
  switch (ruleType) {
    case 'error_rate':
      return <Gauge className="w-4 h-4" />;
    case 'error_pattern':
      return <Search className="w-4 h-4" />;
    case 'function_health':
      return <HeartPulse className="w-4 h-4" />;
  }
}

function getRuleTypeLabel(ruleType: RuleType): string {
  switch (ruleType) {
    case 'error_rate':
      return 'Error Rate';
    case 'error_pattern':
      return 'Error Pattern';
    case 'function_health':
      return 'Function Health';
  }
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

interface RuleFormData {
  name: string;
  description: string;
  rule_type: RuleType;
  severity: Severity;
  cooldown_minutes: number;
  target_functions: string;
  // Config fields
  threshold?: number;
  window_minutes?: number;
  pattern?: string;
  case_sensitive?: boolean;
  consecutive_failures?: number;
  error_pattern?: string;
}

const DEFAULT_FORM_DATA: RuleFormData = {
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

// ============================================================
// RULE EDITOR DIALOG
// ============================================================

interface RuleEditorProps {
  rule?: AlertRule;
  open: boolean;
  onClose: () => void;
  onSave: (data: RuleFormData) => void;
  isSaving: boolean;
}

// Validate regex pattern for ReDoS risks (basic check for dangerous patterns)
function isValidRegexPattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern) return { valid: false, error: 'Pattern is required' };

  // Check for potentially dangerous patterns that could cause ReDoS
  const dangerousPatterns = [
    /(\+\+|\*\*|\?\?)/, // Nested quantifiers
    /\([^)]*\)\+\+/, // Quantified group with nested quantifier
    /\(\?:[^)]*\)\{\d+,\}/, // Non-capturing group with large repetition
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: 'Pattern contains potentially dangerous quantifiers' };
    }
  }

  // Try to compile the regex
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid regex pattern' };
  }
}

interface ValidationErrors {
  name?: string;
  pattern?: string;
  threshold?: string;
  window_minutes?: string;
  cooldown_minutes?: string;
  consecutive_failures?: string;
}

function RuleEditor({ rule, open, onClose, onSave, isSaving }: RuleEditorProps) {
  const [formData, setFormData] = useState<RuleFormData>(() => {
    if (rule) {
      const config = rule.config as Record<string, unknown>;
      return {
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        severity: rule.severity,
        cooldown_minutes: rule.cooldown_minutes,
        target_functions: rule.target_functions?.join(', ') || '',
        threshold: (config.threshold as number) || 5,
        window_minutes: (config.window_minutes as number) || 15,
        pattern: (config.pattern as string) || '',
        case_sensitive: (config.case_sensitive as boolean) || false,
        consecutive_failures: (config.consecutive_failures as number) || 3,
        error_pattern: (config.error_pattern as string) || '',
      };
    }
    return DEFAULT_FORM_DATA;
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    // Cooldown must be at least 1 minute
    if (formData.cooldown_minutes < 1) {
      newErrors.cooldown_minutes = 'Cooldown must be at least 1 minute';
    }

    // Rule-type specific validation
    switch (formData.rule_type) {
      case 'error_rate':
        if (formData.threshold < 1) {
          newErrors.threshold = 'Threshold must be at least 1';
        }
        if (formData.window_minutes < 1) {
          newErrors.window_minutes = 'Window must be at least 1 minute';
        }
        // Optional error_pattern validation
        if (formData.error_pattern) {
          const patternCheck = isValidRegexPattern(formData.error_pattern);
          if (!patternCheck.valid) {
            newErrors.pattern = patternCheck.error;
          }
        }
        break;
      case 'error_pattern':
        const patternCheck = isValidRegexPattern(formData.pattern);
        if (!patternCheck.valid) {
          newErrors.pattern = patternCheck.error;
        }
        break;
      case 'function_health':
        if (formData.consecutive_failures < 1) {
          newErrors.consecutive_failures = 'Must be at least 1 consecutive failure';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const updateField = <K extends keyof RuleFormData>(field: K, value: RuleFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{rule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
            <DialogDescription>
              Configure when and how alerts should be triggered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="High Error Rate"
                required
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Alert when errors exceed threshold..."
                rows={2}
              />
            </div>

            {/* Rule Type */}
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(value) => updateField('rule_type', value as RuleType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error_rate">
                    <span className="flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Error Rate - Count errors in time window
                    </span>
                  </SelectItem>
                  <SelectItem value="error_pattern">
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Error Pattern - Match specific error text
                    </span>
                  </SelectItem>
                  <SelectItem value="function_health">
                    <span className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4" />
                      Function Health - Consecutive failures
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rule-specific config */}
            {formData.rule_type === 'error_rate' && (
              <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Error Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min={1}
                      value={formData.threshold}
                      onChange={(e) => updateField('threshold', parseInt(e.target.value) || 1)}
                      className={errors.threshold ? 'border-destructive' : ''}
                    />
                    {errors.threshold && <p className="text-xs text-destructive">{errors.threshold}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="window_minutes">Time Window (minutes)</Label>
                    <Input
                      id="window_minutes"
                      type="number"
                      min={1}
                      value={formData.window_minutes}
                      onChange={(e) => updateField('window_minutes', parseInt(e.target.value) || 1)}
                      className={errors.window_minutes ? 'border-destructive' : ''}
                    />
                    {errors.window_minutes && <p className="text-xs text-destructive">{errors.window_minutes}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error_pattern">Error Pattern Filter (optional)</Label>
                  <Input
                    id="error_pattern"
                    value={formData.error_pattern}
                    onChange={(e) => updateField('error_pattern', e.target.value)}
                    placeholder="database|connection (regex)"
                    className={errors.pattern && formData.error_pattern ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only count errors matching this pattern (regex supported)
                  </p>
                  {errors.pattern && formData.error_pattern && <p className="text-xs text-destructive">{errors.pattern}</p>}
                </div>
              </div>
            )}

            {formData.rule_type === 'error_pattern' && (
              <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern to Match</Label>
                  <Input
                    id="pattern"
                    value={formData.pattern}
                    onChange={(e) => updateField('pattern', e.target.value)}
                    placeholder="timeout|timed out|deadline exceeded"
                    required
                    className={errors.pattern ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Regex pattern to search for in error messages
                  </p>
                  {errors.pattern && <p className="text-xs text-destructive">{errors.pattern}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="case_sensitive"
                    checked={formData.case_sensitive}
                    onCheckedChange={(checked) => updateField('case_sensitive', checked)}
                  />
                  <Label htmlFor="case_sensitive">Case sensitive</Label>
                </div>
              </div>
            )}

            {formData.rule_type === 'function_health' && (
              <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="consecutive_failures">Consecutive Failures</Label>
                  <Input
                    id="consecutive_failures"
                    type="number"
                    min={1}
                    value={formData.consecutive_failures}
                    onChange={(e) => updateField('consecutive_failures', parseInt(e.target.value) || 1)}
                    className={errors.consecutive_failures ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when a function fails this many times in a row
                  </p>
                  {errors.consecutive_failures && <p className="text-xs text-destructive">{errors.consecutive_failures}</p>}
                </div>
              </div>
            )}

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => updateField('severity', value as Severity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Info
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Warning
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Critical
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cooldown */}
            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown (minutes)</Label>
              <Input
                id="cooldown"
                type="number"
                min={1}
                value={formData.cooldown_minutes}
                onChange={(e) => updateField('cooldown_minutes', parseInt(e.target.value) || 1)}
                className={errors.cooldown_minutes ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between repeated alerts for the same condition
              </p>
              {errors.cooldown_minutes && <p className="text-xs text-destructive">{errors.cooldown_minutes}</p>}
            </div>

            {/* Target Functions */}
            <div className="space-y-2">
              <Label htmlFor="target_functions">Target Functions (optional)</Label>
              <Input
                id="target_functions"
                value={formData.target_functions}
                onChange={(e) => updateField('target_functions', e.target.value)}
                placeholder="calculate-readiness, sync-discourse"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of Edge Functions to monitor. Leave empty to monitor all.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !formData.name}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {rule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// RULE CARD COMPONENT
// ============================================================

interface RuleCardProps {
  rule: AlertRule;
  onToggle: (ruleId: string, isEnabled: boolean) => void;
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
  isToggling: boolean;
}

function RuleCard({ rule, onToggle, onEdit, onDelete, isToggling }: RuleCardProps) {
  const config = rule.config as Record<string, unknown>;

  return (
    <div className={`rounded-lg border p-4 ${rule.is_enabled ? 'bg-card' : 'bg-muted/30 opacity-75'}`}>
      <div className="flex items-start gap-3">
        {/* Rule type icon */}
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {getRuleTypeIcon(rule.rule_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground">{rule.name}</h3>
            <Badge variant="outline" className="text-xs">
              {getRuleTypeLabel(rule.rule_type)}
            </Badge>
            <Badge className={`text-xs ${getSeverityColor(rule.severity)}`}>
              {getSeverityIcon(rule.severity)}
              <span className="ml-1 capitalize">{rule.severity}</span>
            </Badge>
          </div>

          {rule.description && (
            <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
          )}

          {/* Config summary */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {rule.rule_type === 'error_rate' && (
              <>
                <span>Threshold: {config.threshold} errors</span>
                <span>Window: {config.window_minutes} min</span>
              </>
            )}
            {rule.rule_type === 'error_pattern' && (
              <span>
                Pattern: <code className="bg-muted px-1 rounded">{config.pattern as string}</code>
              </span>
            )}
            {rule.rule_type === 'function_health' && (
              <span>Failures: {config.consecutive_failures} consecutive</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Cooldown: {rule.cooldown_minutes} min
            </span>
          </div>

          {rule.target_functions && rule.target_functions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {rule.target_functions.map(fn => (
                <Badge key={fn} variant="secondary" className="text-xs font-mono">
                  {fn}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.is_enabled}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
            disabled={isToggling}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(rule)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(rule)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AdminAlertRules() {
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<AlertRule | null>(null);

  const { data: rules = [], isLoading, error } = useAlertRules();

  const toggleMutation = useToggleAlertRule();
  const createMutation = useCreateAlertRule();
  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();

  const handleToggle = (ruleId: string, isEnabled: boolean) => {
    toggleMutation.mutate({ ruleId, isEnabled });
  };

  const handleSave = (formData: RuleFormData) => {
    // Build config based on rule type
    let config: Record<string, unknown> = {};

    switch (formData.rule_type) {
      case 'error_rate':
        config = {
          threshold: formData.threshold,
          window_minutes: formData.window_minutes,
        };
        if (formData.error_pattern) {
          config.error_pattern = formData.error_pattern;
        }
        break;
      case 'error_pattern':
        config = {
          pattern: formData.pattern,
          case_sensitive: formData.case_sensitive,
        };
        break;
      case 'function_health':
        config = {
          consecutive_failures: formData.consecutive_failures,
        };
        break;
    }

    // Parse target functions
    const target_functions = formData.target_functions
      ? formData.target_functions.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const ruleData = {
      name: formData.name,
      description: formData.description || null,
      rule_type: formData.rule_type,
      severity: formData.severity,
      cooldown_minutes: formData.cooldown_minutes,
      target_functions,
      config,
      is_enabled: true,
    };

    if (editingRule) {
      updateMutation.mutate(
        { id: editingRule.id, ...ruleData },
        {
          onSuccess: () => setEditingRule(undefined),
        }
      );
    } else {
      createMutation.mutate(ruleData, {
        onSuccess: () => setIsCreateOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deletingRule) {
      deleteMutation.mutate(deletingRule.id, {
        onSuccess: () => setDeletingRule(null),
      });
    }
  };

  const enabledCount = rules.filter(r => r.is_enabled).length;

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load alert rules: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Alert Rules</h2>
          <p className="text-sm text-muted-foreground">
            {enabledCount} of {rules.length} rules enabled
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Gauge className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No alert rules</p>
              <p className="text-sm mt-1">
                Create your first rule to start monitoring system health.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={setEditingRule}
              onDelete={setDeletingRule}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <RuleEditor
        rule={editingRule}
        open={isCreateOpen || !!editingRule}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingRule(undefined);
        }}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRule} onOpenChange={() => setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRule?.name}"? This action cannot be undone.
              Existing alerts from this rule will remain but won't have a linked rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

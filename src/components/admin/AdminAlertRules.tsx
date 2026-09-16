import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Gauge, Plus } from "lucide-react";
import {
  useAlertRules,
  useToggleAlertRule,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  type AlertRule,
} from "@/hooks/useAlerts";
import { ConfirmDeleteDialog } from "./shared/ConfirmDeleteDialog";
import { RuleCard } from "./alerts/RuleCard";
import { RuleEditorDialog } from "./alerts/RuleEditorDialog";
import {
  buildRuleConfig,
  parseTargetFunctions,
  type RuleFormData,
} from "./alerts/alertRuleConfig";

export function AdminAlertRules() {
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<AlertRule | null>(null);

  const { data: rules = [], isLoading, error } = useAlertRules();

  const toggleMutation = useToggleAlertRule();
  const createMutation = useCreateAlertRule();
  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();

  const closeEditor = () => {
    setIsCreateOpen(false);
    setEditingRule(undefined);
  };

  const handleSave = (formData: RuleFormData) => {
    const ruleData = {
      name: formData.name,
      description: formData.description || null,
      rule_type: formData.rule_type,
      severity: formData.severity,
      cooldown_minutes: formData.cooldown_minutes,
      target_functions: parseTargetFunctions(formData.target_functions),
      config: buildRuleConfig(formData),
      // Whether a rule is on is not part of this form — it is the switch on
      // the card. Sending a hardcoded true, which is what this did, meant
      // editing a disabled rule to fix a typo silently switched it back on,
      // since useUpdateAlertRule applies whatever fields it is handed. A new
      // rule still starts enabled.
      is_enabled: editingRule?.is_enabled ?? true,
    };

    if (editingRule) {
      updateMutation.mutate(
        { id: editingRule.id, ...ruleData },
        { onSuccess: () => setEditingRule(undefined) }
      );
    } else {
      createMutation.mutate(ruleData, { onSuccess: () => setIsCreateOpen(false) });
    }
  };

  const enabledCount = rules.filter((r) => r.is_enabled).length;

  if (error) {
    return (
      <Card>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ textAlign: "center", color: "error.main" }}>
            <Box
              component={AlertTriangle}
              aria-hidden="true"
              sx={{ width: 32, height: 32, mx: "auto", mb: 1, display: "block" }}
            />
            <Typography>Failed to load alert rules: {error.message}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const createButton = (sx?: object) => (
    <Button
      variant="contained"
      onClick={() => setIsCreateOpen(true)}
      startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
      sx={sx}
    >
      Create Rule
    </Button>
  );

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Alert Rules
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            {enabledCount} of {rules.length} rules enabled
          </Typography>
        </Box>
        {createButton()}
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress aria-label="Loading alert rules" />
        </Box>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
              <Box
                component={Gauge}
                aria-hidden="true"
                sx={{ width: 48, height: 48, mx: "auto", mb: 2, opacity: 0.5, display: "block" }}
              />
              <Typography sx={{ fontWeight: 500 }}>No alert rules</Typography>
              <Typography sx={{ fontSize: "0.875rem", mt: 0.5 }}>
                Create your first rule to start monitoring system health.
              </Typography>
              {createButton({ mt: 2 })}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={(ruleId, isEnabled) => toggleMutation.mutate({ ruleId, isEnabled })}
              onEdit={setEditingRule}
              onDelete={setDeletingRule}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </Stack>
      )}

      <RuleEditorDialog
        rule={editingRule}
        open={isCreateOpen || !!editingRule}
        onClose={closeEditor}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDeleteDialog
        open={!!deletingRule}
        title="Delete Alert Rule"
        description={
          `Are you sure you want to delete "${deletingRule?.name}"? This action cannot be undone. ` +
          `Existing alerts from this rule will remain but won't have a linked rule.`
        }
        isPending={deleteMutation.isPending}
        onCancel={() => setDeletingRule(null)}
        onConfirm={() =>
          deletingRule &&
          deleteMutation.mutate(deletingRule.id, { onSuccess: () => setDeletingRule(null) })
        }
      />
    </Stack>
  );
}

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { AlertRule } from "@/hooks/useAlerts";
import { RULE_TYPE_CONFIG, SEVERITY_CONFIG } from "./alertRuleConfig";

interface RuleCardProps {
  rule: AlertRule;
  onToggle: (ruleId: string, isEnabled: boolean) => void;
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
  isToggling: boolean;
}

/** One rule: what it watches, how loudly it complains, and its controls. */
export function RuleCard({ rule, onToggle, onEdit, onDelete, isToggling }: RuleCardProps) {
  const config = rule.config as Record<string, unknown>;
  const ruleType = RULE_TYPE_CONFIG[rule.rule_type];
  const severity = SEVERITY_CONFIG[rule.severity];

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: "1px solid",
        borderColor: "divider",
        p: 2,
        ...(rule.is_enabled
          ? { bgcolor: "background.paper" }
          : { bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30), opacity: 0.75 }),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: "50%",
            color: "primary.main",
            bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
            display: "flex",
          }}
        >
          <Box component={ruleType.icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography component="h3" sx={{ fontWeight: 500 }}>
              {rule.name}
            </Typography>
            <Chip size="small" variant="outlined" label={ruleType.label} />
            <Chip
              size="small"
              icon={<Box component={severity.icon} sx={{ width: 12, height: 12 }} />}
              label={severity.label}
              sx={{
                bgcolor: `${severity.token}.main`,
                color: `${severity.token}.contrastText`,
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          </Box>

          {rule.description && (
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>
              {rule.description}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
              fontSize: "0.75rem",
              color: "text.secondary",
              flexWrap: "wrap",
            }}
          >
            {rule.rule_type === "error_rate" && (
              <>
                <span>Threshold: {String(config.threshold)} errors</span>
                <span>Window: {String(config.window_minutes)} min</span>
              </>
            )}
            {rule.rule_type === "error_pattern" && (
              <span>
                Pattern:{" "}
                <Box
                  component="code"
                  sx={{
                    px: 0.5,
                    borderRadius: "4px",
                    bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 100),
                  }}
                >
                  {String(config.pattern)}
                </Box>
              </span>
            )}
            {rule.rule_type === "function_health" && (
              <span>Failures: {String(config.consecutive_failures)} consecutive</span>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component={Clock} aria-hidden="true" sx={{ width: 12, height: 12 }} />
              Cooldown: {rule.cooldown_minutes} min
            </Box>
          </Box>

          {rule.target_functions && rule.target_functions.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {rule.target_functions.map((fn) => (
                <Chip
                  color="secondary"
                  key={fn}
                  size="small"
                  label={fn}
                  sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            checked={rule.is_enabled}
            onChange={(event) => onToggle(rule.id, event.target.checked)}
            disabled={isToggling}
            slotProps={{ input: { "aria-label": `Enable ${rule.name}` } }}
          />
          <IconButton aria-label={`Edit ${rule.name}`} onClick={() => onEdit(rule)}>
            <Box component={Pencil} sx={{ width: 16, height: 16 }} />
          </IconButton>
          <IconButton
            aria-label={`Delete ${rule.name}`}
            onClick={() => onDelete(rule)}
            sx={{ color: "error.main" }}
          >
            <Box component={Trash2} sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

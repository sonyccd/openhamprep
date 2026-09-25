import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { Check, CheckCheck, ChevronDown, ChevronUp, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Alert } from "@/hooks/useAlerts";
import { AcknowledgeDialog } from "./AcknowledgeDialog";
import { AlertContextDetails } from "./AlertContextDetails";
import { STATUS_CONFIG } from "./alertPresentation";
import { SEVERITY_CONFIG } from "./alertRuleConfig";

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string, note?: string) => void;
  onResolve: (alertId: string) => void;
  isAcknowledging: boolean;
  isResolving: boolean;
}

const smallIcon = { width: 12, height: 12 } as const;

/** One alert: what fired, how bad, what has been done about it, and the next action. */
export function AlertCard({ alert, onAcknowledge, onResolve, isAcknowledging, isResolving }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAckDialog, setShowAckDialog] = useState(false);

  const severity = SEVERITY_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];
  const hasContext = Object.keys(alert.context).length > 0;

  // Narrowed once here so the sx below can index the palette by it.
  const tint = status.token;

  const handleAcknowledge = (note?: string) => {
    onAcknowledge(alert.id, note);
    setShowAckDialog(false);
  };

  return (
    <>
      <Box
        sx={{
          borderRadius: "8px",
          border: "1px solid",
          p: 2,
          ...(tint === "muted"
            ? { borderColor: "muted", bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30) }
            : {
                borderColor: (t) => tokenAlpha(t.vars.palette[tint].main, 50),
                bgcolor: (t) => tokenAlpha(t.vars.palette[tint].main, 10),
              }),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              display: "flex",
              bgcolor: `${severity.token}.main`,
              color: `${severity.token}.contrastText`,
            }}
          >
            <Icon icon={severity.icon} size={16} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography component="h3" sx={{ fontWeight: 500 }}>
                {alert.title}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                icon={<Icon icon={status.icon} sx={smallIcon} />}
                label={status.label}
                sx={{ fontSize: "0.75rem" }}
              />
              {alert.auto_resolved && (
                <Chip
                  size="small"
                  color="secondary"
                  icon={<Icon icon={Zap} sx={smallIcon} />}
                  label="Auto-resolved"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Box>

            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>{alert.message}</Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, fontSize: "0.75rem", color: "text.secondary" }}>
              <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Icon icon={Clock} sx={smallIcon} />
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              </Box>
              {alert.rule && <span>Rule: {alert.rule.name}</span>}
            </Box>

            {hasContext && (
              <Button
                variant="text"
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                startIcon={<Icon icon={expanded ? ChevronUp : ChevronDown} sx={smallIcon} />}
                sx={{ mt: 1, fontSize: "0.75rem", minWidth: 0, px: 0.5, "&:hover": { textDecoration: "underline" } }}
              >
                {expanded ? "Hide details" : "Show details"}
              </Button>
            )}

            {hasContext && (
              <Collapse in={expanded} unmountOnExit>
                <AlertContextDetails context={alert.context} acknowledgmentNote={alert.acknowledgment_note} />
              </Collapse>
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {alert.status === "pending" && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowAckDialog(true)}
                disabled={isAcknowledging}
                startIcon={
                  isAcknowledging ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon icon={Check} size={16} />
                  )
                }
              >
                Acknowledge
              </Button>
            )}
            {alert.status !== "resolved" && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onResolve(alert.id)}
                disabled={isResolving}
                startIcon={
                  isResolving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon icon={CheckCheck} size={16} />
                  )
                }
              >
                Resolve
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <AcknowledgeDialog
        open={showAckDialog}
        onClose={() => setShowAckDialog(false)}
        onAcknowledge={handleAcknowledge}
        isAcknowledging={isAcknowledging}
      />
    </>
  );
}

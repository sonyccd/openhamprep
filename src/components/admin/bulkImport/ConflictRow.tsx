import { Icon } from "@/components/ohp/Icon";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import { ArrowRight, ChevronDown, ChevronUp, Database, GitMerge, Upload } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { ResolutionAction } from "./importTypes";

type PanelTone = "info" | "warning" | "success" | "neutral";

interface ConflictRowProps {
  label: string;
  resolution: ResolutionAction;
  onResolutionChange: (resolution: ResolutionAction) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  existing: ReactNode;
  /** Already picked by the caller: the incoming item, or the merged result. */
  outcome: ReactNode;
}

/** Tinted panel border/background, or the neutral resting state. */
const panelSx = (tone: PanelTone) => ({
  p: 1,
  borderRadius: "8px",
  border: "1px solid",
  ...(tone === "neutral"
    ? {
        borderColor: "divider",
        bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
      }
    : {
        borderColor: `${tone}.main`,
        bgcolor: (t) => tokenAlpha(t.vars.palette[tone].main, 10),
      }),
});

const RESOLUTIONS: ResolutionAction[] = ["keep", "replace", "merge"];

/**
 * One conflicting item: its name, the three-way resolution choice, and — when
 * expanded — what is in the database beside what the import would leave.
 *
 * The expand control is a button rather than the old clickable <div>, which no
 * keyboard could reach, and it carries aria-expanded so its state is audible.
 * The radio group sits outside that button because nesting controls inside a
 * button is invalid and swallows their clicks; the old markup handled that
 * with a stopPropagation on the group.
 */
export function ConflictRow({
  label,
  resolution,
  onResolutionChange,
  isExpanded,
  onToggleExpand,
  existing,
  outcome,
}: ConflictRowProps) {
  const Chevron = isExpanded ? ChevronUp : ChevronDown;
  const outcomeTone: PanelTone =
    resolution === "replace" ? "warning" : resolution === "merge" ? "success" : "neutral";

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <ButtonBase
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          sx={{ display: "flex", alignItems: "center", gap: 1, borderRadius: "4px", px: 0.5 }}
        >
          <Icon icon={Chevron} size={16} sx={{ color: "text.secondary" }} />
          {/* span, not the default <p>: this sits inside a <button>. */}
          <Typography component="span" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
        </ButtonBase>

        <RadioGroup
          row
          aria-label={`Resolution for ${label}`}
          value={resolution}
          onChange={(event) => onResolutionChange(event.target.value as ResolutionAction)}
          sx={{ gap: 2, flexWrap: "nowrap" }}
        >
          {RESOLUTIONS.map((value) => (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio size="small" />}
              label={value[0].toUpperCase() + value.slice(1)}
              slotProps={{ typography: { sx: { fontSize: "0.75rem" } } }}
              sx={{ m: 0, gap: 0.5 }}
            />
          ))}
        </RadioGroup>
      </Box>

      {isExpanded && (
        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          <Box sx={panelSx(resolution === "keep" ? "info" : "neutral")}>
            <PanelHeading icon={Database}>Current in Database</PanelHeading>
            {existing}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon icon={ArrowRight} size={20} sx={{ color: "text.secondary" }} />
          </Box>

          <Box sx={panelSx(outcomeTone)}>
            <PanelHeading icon={resolution === "merge" ? GitMerge : Upload}>
              {resolution === "merge" ? "Merged Result" : "Incoming Upload"}
            </PanelHeading>
            {outcome}
          </Box>
        </Box>
      )}
    </Card>
  );
}

function PanelHeading({ icon, children }: { icon: typeof Database; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mb: 1,
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "text.secondary",
      }}
    >
      <Box component={icon} aria-hidden="true" sx={{ width: 12, height: 12 }} />
      {children}
    </Box>
  );
}

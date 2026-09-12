import { Type, Bold, ZoomIn } from "lucide-react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useAccessibility, FontFamily } from "@/hooks/useAccessibility";
import { tokenAlpha } from "@/theme/muiTheme";

const FONTS: { value: FontFamily; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "dyslexic", label: "OpenDyslexic" },
  { value: "arimo", label: "Arimo" },
];

const sectionHeading = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  fontWeight: 500,
  color: "text.secondary",
} as const;

/**
 * One labelled toggle with an icon and an explanation.
 *
 * FormControlLabel associates the switch with its text, which is what the
 * <Label htmlFor> pairing did before — one of the few controls in this part of
 * the app that was already labelled correctly, so the association is preserved
 * rather than introduced.
 */
interface ToggleRowProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "primary.main",
            bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
          }}
        >
          <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <FormControlLabel
            control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
            label={label}
            labelPlacement="start"
            sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: "0.875rem", fontWeight: 500 } }}
          />
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function AccessibilitySettings() {
  const {
    fontFamily,
    setFontFamily,
    boldText,
    setBoldText,
    largeFont,
    setLargeFont,
  } = useAccessibility();

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Typography id="font-choice-label" variant="body2" sx={sectionHeading}>
          <Box component={Type} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          Font
        </Typography>
        <ToggleButtonGroup
          exclusive
          aria-labelledby="font-choice-label"
          value={fontFamily}
          onChange={(_event, value) => value && setFontFamily(value as FontFamily)}
          sx={{ justifyContent: "flex-start", flexWrap: "wrap" }}
        >
          {FONTS.map(({ value, label }) => (
            <ToggleButton
              key={value}
              value={value}
              aria-label={`${label} font`}
              sx={{ fontSize: "0.75rem" }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          OpenDyslexic is designed to help readers with dyslexia
        </Typography>
      </Stack>

      <ToggleRow
        icon={Bold}
        label="Bold All Text"
        description="Make all text bold for better readability"
        checked={boldText}
        onChange={setBoldText}
      />

      <ToggleRow
        icon={ZoomIn}
        label="Extra Large Text"
        description="Increase text size throughout the app"
        checked={largeFont}
        onChange={setLargeFont}
      />
    </Stack>
  );
}

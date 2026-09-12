import { Type, Bold, ZoomIn } from "lucide-react";
import Box from "@mui/material/Box";
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
 * The switch is a *sibling* of the icon-and-text block, not nested inside it,
 * so the row's justify-content: space-between has two children to separate and
 * the switch sits at the trailing edge. Nesting it inside made space-between
 * inert and pulled the switch in next to the label text.
 *
 * That means the association is htmlFor/id rather than FormControlLabel
 * wrapping the control — which is what the original did too, and one of the
 * few places in this area that was already labelled correctly.
 */
interface ToggleRowProps {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ id, icon: Icon, label, description, checked, onChange }: ToggleRowProps) {
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
          <Typography
            component="label"
            htmlFor={id}
            variant="body2"
            sx={{ display: "block", fontWeight: 500, cursor: "pointer" }}
          >
            {label}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
            {description}
          </Typography>
        </Box>
      </Box>
      <Switch
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{ flexShrink: 0 }}
      />
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
        id="bold-text"
        icon={Bold}
        label="Bold All Text"
        description="Make all text bold for better readability"
        checked={boldText}
        onChange={setBoldText}
      />

      <ToggleRow
        id="large-font"
        icon={ZoomIn}
        label="Extra Large Text"
        description="Increase text size throughout the app"
        checked={largeFont}
        onChange={setLargeFont}
      />
    </Stack>
  );
}

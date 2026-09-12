import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeSelector() {
  // `theme` rather than `resolvedTheme`, deliberately: this control shows which
  // setting is chosen, and "system" is one of the three choices. ThemeToggle
  // wants the opposite — it needs the resolved value, because it describes the
  // theme it will switch to.
  const { theme, setTheme } = useTheme();

  return (
    <ToggleButtonGroup
      exclusive
      value={theme ?? "system"}
      onChange={(_event, value) => value && setTheme(value)}
      sx={{ justifyContent: "flex-start" }}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleButton key={value} value={value} aria-label={`${label} theme`} sx={{ gap: 1 }}>
          <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          <Box component="span" sx={{ fontSize: "0.75rem" }}>
            {label}
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

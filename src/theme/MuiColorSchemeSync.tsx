import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useColorScheme } from "@mui/material/styles";

// next-themes owns the light/dark class, and colorSchemeNode={null} stops MUI
// writing it (see App.tsx). That leaves MUI's own mode state tracking the OS
// preference independently, so useColorScheme() would report the OS setting
// while the page actually renders the user's explicit choice — the CSS is
// right, the hook lies. Pushing the resolved theme back into MUI keeps the
// idiomatic hook usable by later migration phases. setMode touches neither the
// DOM nor storage here, because colorSchemeNode and storageManager are null.
export const MuiColorSchemeSync = () => {
  const { resolvedTheme } = useTheme();
  const { setMode } = useColorScheme();

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setMode(resolvedTheme);
    }
  }, [resolvedTheme, setMode]);

  return null;
};

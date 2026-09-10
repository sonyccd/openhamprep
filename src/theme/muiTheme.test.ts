import { describe, it, expect } from "vitest";
import { muiTheme } from "./muiTheme";

describe("muiTheme", () => {
  it("scopes dark mode to the class next-themes writes", () => {
    // The default selector is a data attribute next-themes never sets, which
    // would silently pin MUI to light mode while the app goes dark.
    expect(muiTheme.getColorSchemeSelector("dark")).toContain(".dark");
  });

  it("defines both color schemes with palettes drawn from index.css", () => {
    expect(muiTheme.colorSchemes.light.palette.primary.main).toBe("hsl(38 92% 45%)");
    expect(muiTheme.colorSchemes.dark.palette.primary.main).toBe("hsl(45 90% 55%)");
    expect(muiTheme.colorSchemes.light.palette.background.default).toBe("hsl(45 25% 97%)");
    expect(muiTheme.colorSchemes.dark.palette.background.default).toBe("hsl(222 47% 8%)");
  });

  it("matches the Tailwind font stack and --radius", () => {
    expect(muiTheme.typography.fontFamily).toBe("'DM Sans', 'Space Grotesk', sans-serif");
    expect(muiTheme.shape.borderRadius).toBe(12);
  });
});

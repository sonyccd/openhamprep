import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider as MuiThemeProvider, useColorScheme } from "@mui/material/styles";
import { ThemeProvider } from "next-themes";
import { muiTheme } from "./muiTheme";
import { MuiColorSchemeSync } from "./MuiColorSchemeSync";

// next-themes owns the light/dark class on <html>, and Tailwind's `dark:`
// variants key off it app-wide. MUI's cssVars provider will also write that
// class unless colorSchemeNode is null, so a divergence between the user's
// explicit choice and their OS preference could flip the whole app.
const setOsPrefersDark = (prefersDark: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-color-scheme: dark") ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe("light/dark class ownership", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    document.documentElement.className = "";
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.className = "";
    localStorage.removeItem("theme");
  });

  it("leaves an explicit user choice alone when the OS disagrees", () => {
    // The user picked light via ThemeToggle; the OS is in dark mode.
    setOsPrefersDark(true);
    document.documentElement.classList.add("light");

    render(
      <MuiThemeProvider theme={muiTheme} defaultMode="system" storageManager={null} colorSchemeNode={null} noSsr>
        <div />
      </MuiThemeProvider>,
    );

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does not add a class of its own when next-themes has not set one yet", () => {
    setOsPrefersDark(true);

    render(
      <MuiThemeProvider theme={muiTheme} defaultMode="system" storageManager={null} colorSchemeNode={null} noSsr>
        <div />
      </MuiThemeProvider>,
    );

    expect(document.documentElement.className).toBe("");
  });

  it("keeps useColorScheme in step with the class actually rendered", async () => {
    // Without MuiColorSchemeSync, MUI tracks the OS preference on its own and
    // reports colorScheme 'dark' here while the page renders light.
    setOsPrefersDark(true);
    localStorage.setItem("theme", "light");

    const Probe = () => {
      const { colorScheme } = useColorScheme();
      return <span data-testid="probe">{colorScheme ?? "unset"}</span>;
    };

    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MuiThemeProvider theme={muiTheme} defaultMode="system" storageManager={null} colorSchemeNode={null} noSsr>
          <MuiColorSchemeSync />
          <Probe />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("probe")).toHaveTextContent("light");
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});

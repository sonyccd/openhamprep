import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { muiTheme } from "./muiTheme";
import tailwindConfig from "../../tailwind.config";
import { screens as tailwindScreens } from "tailwindcss/defaultTheme";

// muiTheme.ts duplicates the HSL tokens from index.css because MUI needs
// concrete values at theme-build time. Asserting literals here would just
// duplicate them a third time and agree with the theme while both drifted from
// the stylesheet, so read the real tokens instead.
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const tokenBlock = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in index.css`);
  return css.slice(start, css.indexOf("}", start));
};

const token = (selector: string, name: string) => {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(tokenBlock(selector));
  if (!match) throw new Error(`No --${name} in ${selector}`);
  return match[1].trim();
};

const hsl = (selector: string, name: string) => `hsl(${token(selector, name)})`;

// [MUI palette path, index.css token]
const mappings = [
  ["primary.main", "primary"],
  ["primary.contrastText", "primary-foreground"],
  ["secondary.main", "secondary"],
  ["secondary.contrastText", "secondary-foreground"],
  ["error.main", "destructive"],
  ["error.contrastText", "destructive-foreground"],
  ["warning.main", "warning"],
  ["warning.contrastText", "warning-foreground"],
  ["info.main", "info"],
  ["info.contrastText", "info-foreground"],
  ["success.main", "success"],
  ["success.contrastText", "success-foreground"],
  ["background.default", "background"],
  ["background.paper", "card"],
  ["text.primary", "foreground"],
  ["text.secondary", "muted-foreground"],
  ["divider", "border"],
  // Tokens Material has no slot for, added to the palette rather than
  // approximated at each call site (#284). Covered here for the same reason as
  // the rest: so the theme cannot drift from index.css unnoticed.
  ["muted", "muted"],
  ["accent", "accent"],
] as const;

const read = (obj: unknown, path: string) =>
  path.split(".").reduce<unknown>((acc, key) => acc?.[key], obj);

describe("muiTheme", () => {
  it("scopes dark mode to the class next-themes writes", () => {
    // The default selector is a data attribute next-themes never sets, which
    // would silently pin MUI to light mode while the app goes dark.
    expect(muiTheme.getColorSchemeSelector("dark")).toContain(".dark");
  });

  describe.each([
    ["light", ":root"],
    ["dark", ".dark"],
  ])("%s palette tracks index.css", (scheme, selector) => {
    it.each(mappings)("%s comes from --%s", (palettePath, cssToken) => {
      const actual = read(muiTheme.colorSchemes[scheme].palette, palettePath);
      expect(actual).toBe(hsl(selector, cssToken));
    });
  });

  it("matches the Tailwind sans stack", () => {
    // Read from tailwind.config.ts for the same reason the colors are read from
    // index.css: a literal here would only agree with muiTheme.ts's literal
    // while both drifted from the Tailwind config.
    const sans = tailwindConfig.theme.extend.fontFamily.sans as string[];
    const expected = sans.map((f) => (f.includes(" ") ? `'${f}'` : f)).join(", ");

    expect(muiTheme.typography.fontFamily).toBe(expected);
  });

  it("matches Tailwind's breakpoints", () => {
    // Read from Tailwind rather than restated here, for the same reason the
    // colours are read from index.css: a literal would only agree with
    // muiTheme.ts's literal while both drifted from Tailwind.
    //
    // Material's own values are 40-176px away from these, so a ported component
    // and an unported one would change layout at different widths.
    const expected = Object.fromEntries(
      Object.entries(tailwindScreens).map(([key, px]) => [key, parseInt(px as string, 10)]),
    );

    for (const key of ["sm", "md", "lg", "xl"] as const) {
      expect(muiTheme.breakpoints.values[key]).toBe(expected[key]);
    }
    expect(muiTheme.breakpoints.values.xs).toBe(0);
  });

  it("matches --radius", () => {
    const radiusRem = parseFloat(token(":root", "radius"));
    expect(muiTheme.shape.borderRadius).toBe(radiusRem * 16);
  });

  it("emits CSS variables for the custom palette keys in both schemes", () => {
    // muted and accent are keys Material does not know about (#284), so it is
    // worth proving they survive the cssVariables pipeline rather than assuming
    // it. A key that resolves to var(--mui-palette-muted) while nothing ever
    // declares that variable renders as no colour at all — the failure would be
    // an invisible background, not an error.
    const sheets = JSON.stringify(muiTheme.generateStyleSheets?.() ?? []);

    for (const key of ["muted", "accent"]) {
      const declarations = sheets.match(new RegExp(`"--mui-palette-${key}":"[^"]+"`, "g")) ?? [];
      // One per colour scheme.
      expect(declarations).toHaveLength(2);
    }
  });

  it("declares no component styleOverrides", () => {
    // Gate 2. Brand fidelity is expressed through palette, typography and
    // shape above, plus props at the call site — never by restyling Material's
    // internals. The B1 review accepted two visible divergences rather than
    // open this surface; see the note at the bottom of muiTheme.ts.
    //
    // The failure mode this guards is gradual: one override to fix a header
    // colour, then one per component, until the theme is a second design system
    // maintained on a new vendor. Nothing about adding the first one looks
    // wrong at the time, which is why it is asserted rather than left to review.
    const overriding = Object.entries(muiTheme.components ?? {})
      .filter(([, config]) => config && "styleOverrides" in config)
      .map(([name]) => name);

    expect(overriding).toEqual([]);
  });
});

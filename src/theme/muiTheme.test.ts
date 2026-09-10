import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { muiTheme } from "./muiTheme";
import tailwindConfig from "../../tailwind.config";

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

  it("matches --radius", () => {
    const radiusRem = parseFloat(token(":root", "radius"));
    expect(muiTheme.shape.borderRadius).toBe(radiusRem * 16);
  });
});

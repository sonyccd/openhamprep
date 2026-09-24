import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // lucide-react emits an <svg> with no aria-hidden, role or focusable, so
      // <Box component={SomeIcon} /> exposes an unnamed graphic unless every
      // author remembers to hide it — which, across the migration, they did
      // not (#312: 163 sites). ohp/Icon hides by default and names on request.
      //
      // Scoped to a capitalised component whose name is not one of the three
      // legitimate non-icon polymorphic targets. Deliberately no exemption for
      // the local `Glyph` bindings this migration introduced: exempting a bare
      // name would reopen the same blind spot for the next component that
      // destructures `icon: Glyph` into a Box.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name='Box'] > JSXAttribute[name.name='component'][value.expression.name=/^(?!Link$|RouterLink$|MotionBox$)[A-Z]/]",
          message:
            "Render lucide icons with <Icon icon={X} size={n} /> from @/components/ohp/Icon — it sets aria-hidden, which a bare Box does not (#312).",
        },
      ],
      // Was "off", which let the MUI migration's sub-component extractions
      // leave 26 orphaned imports behind a green `npm run lint` (#295).
      // tsconfig's noUnusedLocals is off too, so nothing else catches them.
      //
      // "warn" rather than "error": unused *arguments* are idiomatic here
      // (noUnusedParameters is deliberately off per CLAUDE.md), and a leading
      // underscore is the escape hatch for a genuinely unused binding.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { args: "none", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
);

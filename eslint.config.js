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
      // putting an icon straight into a Box exposes an unnamed graphic unless
      // every author remembers to hide it — which, across the migration, they
      // did not (#312: 163 sites). ohp/Icon hides by default, names on request.
      //
      // Matches the whole expression container, not an identifier: the first
      // version of this rule keyed off `value.expression.name`, which only
      // exists on a bare identifier, so component={icon},
      // component={severity.icon} and component={cond ? A : B} all slipped
      // past it — and so did the audit that shared the same assumption.
      // Anything that is not one of the three polymorphic targets is flagged.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name='Box'] > JSXAttribute[name.name='component'] > JSXExpressionContainer > :not(Identifier[name='Link']):not(Identifier[name='RouterLink']):not(Identifier[name='MotionBox'])",
          message:
            "Render icons with <Icon icon={X} size={n} /> from @/components/ohp/Icon — it sets aria-hidden, which a bare Box does not (#312). For a non-icon polymorphic Box, use Link, RouterLink or MotionBox.",
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
  {
    // Icon is the one place a Box may take a component expression: it is what
    // the rule above points everyone at.
    files: ["src/components/ohp/Icon.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
);

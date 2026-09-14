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

import js from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.js",
            "manifest.json",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/shared/i18n/**/en.ts"],
    rules: {
      "obsidianmd/ui/sentence-case-locale-module": "error",
    },
  },
  {
    files: ["**/*.test.ts", "**/__tests__/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  globalIgnores([
    "node_modules",
    "dist",
    "coverage",
    "src/generated",
    "esbuild.config.mjs",
    "version-bump.mjs",
    "versions.json",
    "main.js",
  ]),
);

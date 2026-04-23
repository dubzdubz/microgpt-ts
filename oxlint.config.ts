import { defineConfig } from "oxfmt";

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  categories: {
    correctness: "error",
    "style": "error",
    suspicious: "error",
  },
  plugins: ["eslint", "typescript", "unicorn", "oxc"],
  env: {
    node: true,
  },
  rules: {
    "eslint/no-bitwise": "off",
    "eslint/no-console": "off",
    "eslint/no-magic-numbers": "off",
    "eslint/no-nested-ternary": "off",
    "typescript/no-explicit-any": "off",
  },
  overrides: [
    {
      files: ["web/**/*.{js,jsx,ts,tsx}"],
      plugins: ["eslint", "typescript",  "unicorn", "oxc", "react", "jsx-a11y", "nextjs"],
      env: {
        browser: true,
        node: true,
      },
      settings: {
        next: {
          rootDir: "web",
        },
      },
      rules: {
        "react/no-array-index-key": "error",
      },
    },
  ],
});

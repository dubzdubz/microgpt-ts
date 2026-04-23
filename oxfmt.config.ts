import { defineConfig } from "oxfmt";

export default defineConfig({
  $schema: "./node_modules/oxfmt/configuration_schema.json",
  tabWidth: 2,
  useTabs: false,
  sortPackageJson: true,
  ignorePatterns: [".agents/**"],
});

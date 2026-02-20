// server/eslint.config.mjs
import js from "@eslint/js";

export default [
  // Ignore generated / third-party folders
  {
    ignores: ["node_modules/**", "uploads/**"],
  },

  // Our project files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        // Node.js globals
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
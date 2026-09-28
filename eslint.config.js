import js from "@eslint/js";

export default [
  {
    ignores: [
      "**/*.ts",
      "dist/**",
      "plugins/**",
      "artifacts/**",
      "infra/main.json",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        structuredClone: "readonly",
      },
    },
  },
];

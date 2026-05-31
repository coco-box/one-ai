import { config as shared } from "@coco-box/ai-eslint-config/vue";

/** @type {import("eslint").Linter.Config} */
export default [
  ...shared,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 允许使用 any
    },
  },
];
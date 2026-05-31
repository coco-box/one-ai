import { config } from '@coco-box/ai-eslint-config/vue';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-len': 'off',
      'vue/return-in-computed-property': 'off',
      'no-cond-assign': 'off',
      'no-restricted-syntax': 'off',
      'no-use-before-define': 'off',
      'no-empty': 'off',
      'lines-between-class-members': 'off',
      'no-useless-constructor': 'off',
      'no-empty-function': 'off',
    },
  },
];

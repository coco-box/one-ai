const sharedConfig = require('@coco-box/ai-tailwindcss-config/tailwind.config');
const path = require('path');

module.exports = {
  presets: [sharedConfig],
  content: [
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, './src/**/*.{vue,js,ts,jsx,tsx}'),
    path.resolve(__dirname, '../../../packages/ui/src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

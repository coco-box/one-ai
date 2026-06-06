import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: '@coco-box/md-diff/styles.css',
        replacement: path.resolve(__dirname, '../../../packages/md-diff/src/styles.css'),
      },
      {
        find: '@coco-box/md-diff',
        replacement: path.resolve(__dirname, '../../../packages/md-diff/src/index.ts'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@coco-box/md-diff'],
  },
});

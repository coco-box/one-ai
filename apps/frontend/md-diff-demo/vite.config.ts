import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@coco-box/md-diff': path.resolve(__dirname, '../../../packages/md-diff/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@coco-box/md-diff'],
  },
});

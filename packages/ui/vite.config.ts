import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import dts from 'vite-plugin-dts';
import path from 'path';
import libCss from 'vite-plugin-libcss';

export default defineConfig({
  plugins: [
    createVuePlugin(),
    dts({
      insertTypesEntry: true,
    }),
    libCss(),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Aichat',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.umd.js'),
    },
    rollupOptions: {
      external: ['vue', '@vue/composition-api'],
      output: {
        globals: {
          vue: 'Vue',
          '@vue/composition-api': 'VueCompositionAPI',
        },
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
});
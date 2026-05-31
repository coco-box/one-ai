import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
      rollupTypes: true,
      skipDiagnostics: true,
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'node_modules', 'dist']
    }),
  ],

  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },

    rollupOptions: {
      external: [
        '@coco-box/ai',
        '@ag-ui/client',
        '@ag-ui/core',
      ],
      output: {
        globals: {},
      },
    },

    sourcemap: true,
    minify: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});



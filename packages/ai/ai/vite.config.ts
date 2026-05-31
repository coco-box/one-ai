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
        types: resolve(__dirname, 'src/types/index.ts'),
        ui: resolve(__dirname, 'src/ui/index.ts'),
        'ui-message-stream': resolve(__dirname, 'src/ui-message-stream/index.ts'),
        util: resolve(__dirname, 'src/util/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },

    rollupOptions: {
      external: [
        '@ai-sdk/provider',
        '@ai-sdk/provider-utils',
        'ai',
        'zod',
      ],
      output: {
        globals: {
          zod: 'zod',
        },
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



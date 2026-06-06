import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createVuePlugin({
      jsx: false,
      vueTemplateOptions: {
        compilerOptions: {
          // Vue 2.6 兼容性配置
          whitespace: 'preserve'
        }
      }
    })
  ],
  resolve: {
    alias: [
      { find: /^@coco-box\/ai-ui$/, replacement: path.resolve(__dirname, '../../../packages/ui/src') },
      { find: /^@coco-box\/ai$/, replacement: path.resolve(__dirname, '../../../packages/ai/ai/src') },
      { find: /^@coco-box\/ai-ag-ui-adapter$/, replacement: path.resolve(__dirname, '../../../packages/ai/adapters/ag-ui/src') },
      { find: /^@coco-box\/ai-vue-2$/, replacement: path.resolve(__dirname, '../../../packages/ai/vue-2/src') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
    port: 8080,
    open: true,
    host: '0.0.0.0',
    proxy: {
      '/api/ai_agent': {
        target: 'http://localhost:3007', // 线上: http://10.27.9.10:32268/ | 本地 mock http://localhost:3007
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/': '/',
        }
      },
      '/api': {
        target: 'http://10.27.10.13:8000',
        changeOrigin: true,
        pathRewrite: {
          '^/': '/'
        }
      },
    }
  },
  build: {
    target: 'es2015',
    // 确保兼容性
    cssTarget: 'chrome61'
  },
  define: {
    // Vue 2 需要的全局变量
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    // 为了兼容一些可能使用 process.env 的库
    'process.env': {}
  },
  optimizeDeps: {
    exclude: [
      '@coco-box/ai-ui',
      '@coco-box/ai',
      '@coco-box/ai-ag-ui-adapter',
      '@coco-box/ai-vue-2',
    ],
    include: [
      'vue',
      '@vue/composition-api',
      'vue-router'
    ],
  }
})

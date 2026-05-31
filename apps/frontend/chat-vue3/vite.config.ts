import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
      imports: ["vue"],
      dirs: ["./src"],
    }),
  ],
  resolve: {
    alias: [
      { find: /^mermaid$/, replacement: path.resolve(__dirname, "./node_modules/mermaid/dist/mermaid.core.mjs") },
      { find: /^@coco-box\/ai$/, replacement: path.resolve(__dirname, "../../../packages/ai/ai/src") },
      { find: /^@coco-box\/ai-ag-ui-adapter$/, replacement: path.resolve(__dirname, "../../../packages/ai/adapters/ag-ui/src") },
      { find: /^@coco-box\/ai-vue$/, replacement: path.resolve(__dirname, "../../../packages/ai/vue/src") },
      { find: "@view", replacement: path.resolve(__dirname, "./src/view") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  optimizeDeps: {
    exclude: [
      "@coco-box/ai",
      "@coco-box/ai-ag-ui-adapter",
      "@coco-box/ai-vue",
    ],
  },
  server: {
    host: "0.0.0.0", // 监听所有地址
    proxy: {
      '/api': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import'], // 👈 忽略 @import 弃用警告
      },
    },
  },
});

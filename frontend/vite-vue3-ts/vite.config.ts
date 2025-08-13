import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 配置路径别名
    }
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router"], // 自动导入 Vue 和路由 API
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // 性能优化配置
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router']
        }
      }
    }
  },
  // 开发服务器优化
  server: {
    hmr: true,
    open: false
  },
  // 预构建优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus']
  }
});

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 强制全项目只使用一份 three 实例，避免 PanoViewV2 源码引用时解析到其自身 node_modules
    // 导致的 "Multiple instances of Three.js" 警告与 instanceof 跨实例失效问题
    dedupe: ['three'],
    alias: {
      '@': resolve(__dirname, 'src'),
      '@panoview': resolve(__dirname, '../PanoViewV2/src/panoview'),
      three: resolve(__dirname, 'node_modules/three'),
    },
  },
  server: {
    port: 5001,
    proxy: {
      '/api': {
        target: 'http://localhost:15088',
        changeOrigin: true,
        timeout: 300000,
      },
      '/uploads': {
        target: 'http://localhost:15088',
        changeOrigin: true,
        timeout: 300000,
      },
    },
  },
})

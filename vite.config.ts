import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 强制全项目只使用一份 three 实例，避免 PanoViewV2 源码引用时解析到其自身 node_modules
    // 导致的 "Multiple instances of Three.js" 警告与 instanceof 跨实例失效问题
    dedupe: ['three'],
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '@panoview', replacement: resolve(__dirname, '../PanoViewV2/src/panoview') },
      // 仅精确匹配裸 `three` 入口，强制定位到实例。
      // 不可用目录级字符串替换 `three/*`，否则会绕过 package.json 的 exports 映射
      // （three/webgpu -> build/three.webgpu.js、three/addons -> examples/jsm），
      // 导致 "Failed to resolve import three/webgpu" 与 stats.module.js ENOENT。
      { find: /^three$/, replacement: resolve(__dirname, 'node_modules/three') },
    ],
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

# 更新日志

## [2026-06-25] - 引擎适配层优化与配置改进

### 改进
- **PanoEngineAdapter 重构**
  - 大幅简化代码（-191 行），移除冗余的场景管理逻辑
  - 改为委托模式，直接调用 PanoEngine 的公共 API
  - 优化热点管理和坐标转换方法

- **Vite 配置优化**
  - 添加 `dedupe: ['three']` 确保 Three.js 单实例
  - 添加 `three` 路径别名，强制使用本地 node_modules 中的 Three.js
  - 解决 "Multiple instances of Three.js" 警告

- **TypeScript 配置**
  - 添加 `@panoview` 路径别名，指向 `../PanoViewV2/src/panoview/index`
  - 优化模块解析配置

### 依赖更新
- 更新 package.json 依赖配置
- 更新 package-lock.json

### 技术细节
- 修改文件：5 个
- 代码变更：+59 行，-191 行
- 主要优化：PanoEngineAdapter.ts 代码精简和重构

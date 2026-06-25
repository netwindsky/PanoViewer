<template>
  <div ref="canvasContainer" class="pano-canvas">
    <div v-if="!currentScene" class="canvas-placeholder">
      <div class="placeholder-content">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--text-muted)" stroke-width="2" />
          <path d="M24 14v10l7 7" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p v-if="loading">加载中...</p>
        <p v-else-if="error">{{ error }}</p>
        <p v-else>请选择场景</p>
      </div>
    </div>

    <div v-if="sceneLoading" class="scene-loader">
      <div class="loader-spinner" />
      <p>加载全景场景...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useViewerStore } from '@/stores/viewer'
import { PanoEngineAdapter } from '@/utils/PanoEngineAdapter'

const sceneStore = useSceneStore()
const viewerStore = useViewerStore()

const canvasContainer = ref<HTMLElement | null>(null)
const sceneLoading = ref(false)
let panoEngine: PanoEngineAdapter | null = null
let isFirstScene = true

const currentScene = computed(() => sceneStore.currentScene)
const loading = computed(() => sceneStore.loading)
const error = computed(() => sceneStore.error)

function initEngine() {
  if (!canvasContainer.value) return
  if (panoEngine) {
    panoEngine.dispose()
    panoEngine = null
  }
  panoEngine = new PanoEngineAdapter(canvasContainer.value)
  isFirstScene = true
}

function loadSceneConfig(scene: { imageConfig?: string; id?: string }) {
  if (!panoEngine) return
  if (!scene.imageConfig) {
    console.warn('场景缺少 imageConfig 配置')
    return
  }
  try {
    const config = JSON.parse(scene.imageConfig)
    if (isFirstScene) {
      panoEngine.loadSceneConfig(config)
      isFirstScene = false
    } else {
      panoEngine.loadSceneConfig(config)
    }
  } catch (e) {
    console.error('解析场景 imageConfig 失败:', e)
  }
}

watch(currentScene, async (scene) => {
  if (!scene) return
  sceneLoading.value = true

  if (!panoEngine) {
    await nextTick()
    initEngine()
  }

  if (panoEngine) {
    loadSceneConfig(scene)
  }

  sceneLoading.value = false
})

watch(
  () => viewerStore.isAutoRotate,
  (rotating) => {
    if (!panoEngine) return
    // PanoEngine 的自动旋转通过控制器实现
    // 暂不实现，后续可通过 PanoControls 扩展
  },
)

onBeforeUnmount(() => {
  if (panoEngine) {
    panoEngine.dispose()
    panoEngine = null
  }
})
</script>

<style scoped>
.pano-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

.canvas-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.scene-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  gap: 12px;
  z-index: 10;
}

.loader-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

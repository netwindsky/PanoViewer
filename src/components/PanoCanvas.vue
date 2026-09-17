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
import { getPublicLighting, toSunConfig } from '@/api/lighting'
import { getPostProcessingConfig } from '@/api/postprocessing'
import type { LightingConfig, PostProcessingConfig } from '@/types'

const sceneStore = useSceneStore()
const viewerStore = useViewerStore()

const canvasContainer = ref<HTMLElement | null>(null)
const sceneLoading = ref(false)
let panoEngine: PanoEngineAdapter | null = null
let isFirstScene = true
/** 光照请求的场景守卫：丢弃场景切换后返回的过期响应 */
let lightingSceneId: string | null = null
/** 后期处理请求的场景守卫 */
let postProcessingSceneId: string | null = null

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
  viewerStore.setEngineAdapter(panoEngine)
  isFirstScene = true
}

function loadSceneConfig(scene: { imageConfig?: string; id?: string; hotspots?: any[] }) {
  if (!panoEngine) return
  if (!scene.imageConfig) {
    console.warn('场景缺少 imageConfig 配置')
    return
  }
  try {
    const config = JSON.parse(scene.imageConfig)
    panoEngine.loadSceneConfig(config)

    // 同步热点到引擎 3D 场景（替代 DOM 标注，跟随相机旋转）
    if (scene.hotspots && scene.hotspots.length > 0) {
      panoEngine.syncHotspots(scene.hotspots)
    }
  } catch (e) {
    console.error('解析场景 imageConfig 失败:', e)
  }
}

/**
 * 拉取场景光照配置（太阳光 + 环境贴图）并应用到引擎。
 * 只读：查看器不回写配置，编辑持久化在 PanoEditor 完成。
 * 场景守卫：响应返回时场景已切换则丢弃，防止旧场景光照污染新场景。
 */
async function loadSceneLighting(sceneId: string) {
  if (!panoEngine) return
  lightingSceneId = sceneId
  try {
    const config: LightingConfig = await getPublicLighting(sceneId)
    if (lightingSceneId !== sceneId) return
    if (!config.envMapEnabled) {
      panoEngine.disableEnvironment()
    } else {
      try {
        await panoEngine.setEnvironmentMap(config.envMapUrl)
      } catch (e) {
        console.warn('应用环境贴图失败:', e)
      }
    }
    if (lightingSceneId !== sceneId) return
    panoEngine.setSunLight(toSunConfig(config))
  } catch (e) {
    console.warn('加载场景光照配置失败:', e)
  }
}

/**
 * 拉取场景后期处理配置并应用到引擎。
 * 只读：查看器不回写配置，编辑持久化在 PanoEditor 完成。
 * 场景守卫：响应返回时场景已切换则丢弃。
 */
async function loadScenePostProcessing(sceneId: string) {
  if (!panoEngine) return
  postProcessingSceneId = sceneId
  try {
    const config: PostProcessingConfig | null = await getPostProcessingConfig(sceneId)
    if (postProcessingSceneId !== sceneId) return
    if (!config) return
    panoEngine.applyPostConfig({
      enabled: config.enabled ?? false,
      presetStyle: config.presetStyle ?? 'original',
      exposure: config.exposure ?? 1.0,
      contrast: config.contrast ?? 1.0,
      saturation: config.saturation ?? 1.0,
      colorTemperature: config.colorTemperature ?? 0,
      vignette: config.vignette ?? 0,
      lutFileUrl: config.lutFileUrl ?? null,
      lutIntensity: config.lutIntensity ?? 1,
    })
  } catch (e) {
    console.warn('加载场景后期处理配置失败:', e)
  }
}

// 热点加载完成后同步到引擎
watch(
  () => sceneStore.currentHotspots,
  (hotspots) => {
    if (panoEngine && hotspots.length > 0) {
      panoEngine.syncHotspots(hotspots)
    }
  },
  { deep: true },
)

watch(currentScene, async (scene) => {
  if (!scene) return
  sceneLoading.value = true

  if (!panoEngine) {
    await nextTick()
    initEngine()
  }

  if (panoEngine) {
    loadSceneConfig(scene)
    void loadSceneLighting(scene.id)
    void loadScenePostProcessing(scene.id)
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
  // 失效场景守卫，丢弃在途的光照响应
  lightingSceneId = null
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

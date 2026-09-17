import { ref, watch, onMounted, type Ref } from 'vue'
import type { LutOption, StyleOption } from '@/types'
import { getPostProcessingConfig, getLutOptions, getStyleOptions } from '@/api/postprocessing'
import { useViewerStore } from '@/stores/viewer'

export function usePostProcessing(sceneId: Ref<string | null>) {
  const viewerStore = useViewerStore()
  const lutOptions = ref<LutOption[]>([])
  const styleOptions = ref<StyleOption[]>([])
  const loading = ref(false)

  /** 将 store 中的后期配置同步到引擎 */
  function syncToEngine() {
    const adapter = viewerStore.engineAdapter
    if (!adapter) return
    const cfg = viewerStore.postProcessing
    adapter.applyPostConfig({
      enabled: true,
      presetStyle: cfg.style || 'original',
      exposure: cfg.exposure,
      contrast: cfg.contrast,
      saturation: cfg.saturation,
      colorTemperature: 0,
      vignette: cfg.vignette ?? 0,
      vignetteIntensity: (cfg as any).vignetteIntensity ?? 1,
      lutFileUrl: cfg.lut || null,
      lutIntensity: (cfg as any).lutIntensity ?? 1,
    })
  }

  async function loadConfig() {
    if (!sceneId.value) return
    loading.value = true
    try {
      const [config, luts, styles] = await Promise.all([
        getPostProcessingConfig(sceneId.value),
        getLutOptions(),
        getStyleOptions(),
      ])
      viewerStore.updatePostProcessing(config)
      lutOptions.value = luts
      styleOptions.value = styles
    } catch (e) {
      console.error('加载后期处理配置失败:', e)
    } finally {
      loading.value = false
    }
  }

  function applyStyle(styleId: string) {
    viewerStore.updatePostProcessing({ style: styleId })
    syncToEngine()
  }

  function applyLut(lutId: string) {
    viewerStore.updatePostProcessing({ lut: lutId })
    syncToEngine()
  }

  function updateExposure(value: number) {
    viewerStore.updatePostProcessing({ exposure: value })
    syncToEngine()
  }

  function updateContrast(value: number) {
    viewerStore.updatePostProcessing({ contrast: value })
    syncToEngine()
  }

  function updateBrightness(value: number) {
    viewerStore.updatePostProcessing({ brightness: value })
    syncToEngine()
  }

  function updateSaturation(value: number) {
    viewerStore.updatePostProcessing({ saturation: value })
    syncToEngine()
  }

  watch(sceneId, () => {
    loadConfig()
  })

  onMounted(() => {
    loadConfig()
  })

  return {
    config: viewerStore.postProcessing,
    lutOptions,
    styleOptions,
    loading,
    applyStyle,
    applyLut,
    updateExposure,
    updateContrast,
    updateBrightness,
    updateSaturation,
  }
}

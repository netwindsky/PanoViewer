import { ref, watch, onMounted, type Ref } from 'vue'
import type { LutOption, StyleOption } from '@/types'
import { getPostProcessingConfig, getLutOptions, getStyleOptions } from '@/api/postprocessing'
import { useViewerStore } from '@/stores/viewer'

export function usePostProcessing(sceneId: Ref<string | null>) {
  const viewerStore = useViewerStore()
  const lutOptions = ref<LutOption[]>([])
  const styleOptions = ref<StyleOption[]>([])
  const loading = ref(false)

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
  }

  function applyLut(lutId: string) {
    viewerStore.updatePostProcessing({ lut: lutId })
  }

  function updateExposure(value: number) {
    viewerStore.updatePostProcessing({ exposure: value })
  }

  function updateContrast(value: number) {
    viewerStore.updatePostProcessing({ contrast: value })
  }

  function updateBrightness(value: number) {
    viewerStore.updatePostProcessing({ brightness: value })
  }

  function updateSaturation(value: number) {
    viewerStore.updatePostProcessing({ saturation: value })
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

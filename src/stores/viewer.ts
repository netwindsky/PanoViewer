import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { ViewerMode, PostProcessingConfig } from '@/types'
import type { PanoEngineAdapter } from '@/utils/PanoEngineAdapter'

export const useViewerStore = defineStore('viewer', () => {
  const mode = ref<ViewerMode>('panorama')
  const isFullscreen = ref(false)
  const isAutoRotate = ref(false)
  const isAutoTour = ref(false)
  const sidebarCollapsed = ref(false)
  const infoPanelCollapsed = ref(false)
  const postProcessing = ref<PostProcessingConfig>({
    style: '',
    lut: '',
    exposure: 1.0,
    contrast: 1.0,
    brightness: 1.0,
    saturation: 1.0,
  })

  /** 引擎适配器引用，由 PanoCanvas.vue 设置，供 usePostProcessing 调用 */
  const engineAdapter = shallowRef<PanoEngineAdapter | null>(null)

  function setEngineAdapter(adapter: PanoEngineAdapter) {
    engineAdapter.value = adapter
  }

  function setMode(newMode: ViewerMode) {
    mode.value = newMode
  }

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
  }

  function toggleAutoRotate() {
    isAutoRotate.value = !isAutoRotate.value
  }

  function toggleAutoTour() {
    isAutoTour.value = !isAutoTour.value
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleInfoPanel() {
    infoPanelCollapsed.value = !infoPanelCollapsed.value
  }

  function updatePostProcessing(patch: Partial<PostProcessingConfig>) {
    postProcessing.value = { ...postProcessing.value, ...patch }
  }

  return {
    mode,
    isFullscreen,
    isAutoRotate,
    isAutoTour,
    sidebarCollapsed,
    infoPanelCollapsed,
    postProcessing,
    engineAdapter,
    setMode,
    toggleFullscreen,
    toggleAutoRotate,
    toggleAutoTour,
    toggleSidebar,
    toggleInfoPanel,
    updatePostProcessing,
    setEngineAdapter,
  }
})

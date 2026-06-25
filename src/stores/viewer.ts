import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ViewerMode, PostProcessingConfig } from '@/types'

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
    setMode,
    toggleFullscreen,
    toggleAutoRotate,
    toggleAutoTour,
    toggleSidebar,
    toggleInfoPanel,
    updatePostProcessing,
  }
})

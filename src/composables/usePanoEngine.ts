import { ref, onBeforeUnmount, type Ref } from 'vue'
import { PanoEngineAdapter } from '@/utils/PanoEngineAdapter'
import type { Scene } from '@/types'

export interface PanoEngineState {
  isLoaded: boolean
  currentSceneId: string
}

export function usePanoEngine(containerRef: Ref<HTMLElement | null>) {
  const state = ref<PanoEngineState>({
    isLoaded: false,
    currentSceneId: '',
  })

  let panoEngine: PanoEngineAdapter | null = null

  function getEngine(): PanoEngineAdapter | null {
    return panoEngine
  }

  function initEngine(): PanoEngineAdapter | null {
    if (!containerRef.value) return null
    if (panoEngine) {
      panoEngine.dispose()
    }
    panoEngine = new PanoEngineAdapter(containerRef.value)
    return panoEngine
  }

  function loadScene(scene: Scene) {
    if (!panoEngine) {
      initEngine()
    }
    if (!panoEngine) return

    if (!scene.imageConfig) {
      console.warn('场景缺少 imageConfig 配置')
      return
    }

    try {
      const config = JSON.parse(scene.imageConfig)
      panoEngine.loadSceneConfig(config)
      state.value = {
        isLoaded: true,
        currentSceneId: scene.id,
      }
    } catch (e) {
      console.error('解析场景 imageConfig 失败:', e)
    }
  }

  function loadSceneConfig(config: any) {
    if (!panoEngine) {
      initEngine()
    }
    if (!panoEngine) return

    panoEngine.loadSceneConfig(config)
    const sceneList = panoEngine.getSceneList()
    state.value = {
      isLoaded: sceneList.length > 0,
      currentSceneId: panoEngine.getCurrentSceneId(),
    }
  }

  function changeScene(sceneId: string) {
    if (!panoEngine) return
    panoEngine.changeScene(sceneId)
    state.value.currentSceneId = sceneId
  }

  function lookAt(_pitch: number, _yaw: number, _hfov?: number) {
    // PanoEngine 的视角控制通过 PanoControls 实现
    // 后续可通过 PanoControls 扩展
  }

  function startAutoRotate(_speed: number = 0.2) {
    // PanoEngine 的自动旋转通过控制器实现
    // 后续可通过 PanoControls 扩展
  }

  function stopAutoRotate() {
    // PanoEngine 的自动旋转通过控制器实现
    // 后续可通过 PanoControls 扩展
  }

  function startAutoTour(scenes: Scene[], onSceneSwitch: (scene: Scene) => void, interval: number = 8000) {
    stopAutoTour()
    let index = 0
    autoTourTimer = setInterval(() => {
      index = (index + 1) % scenes.length
      const nextScene = scenes[index]
      if (nextScene) {
        onSceneSwitch(nextScene)
      }
    }, interval)
  }

  let autoTourTimer: ReturnType<typeof setInterval> | null = null

  function stopAutoTour() {
    if (autoTourTimer) {
      clearInterval(autoTourTimer)
      autoTourTimer = null
    }
  }

  function dispose() {
    stopAutoRotate()
    stopAutoTour()
    if (panoEngine) {
      panoEngine.dispose()
      panoEngine = null
    }
  }

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    state,
    getEngine,
    initEngine,
    loadScene,
    loadSceneConfig,
    changeScene,
    lookAt,
    startAutoRotate,
    stopAutoRotate,
    startAutoTour,
    stopAutoTour,
    dispose,
  }
}

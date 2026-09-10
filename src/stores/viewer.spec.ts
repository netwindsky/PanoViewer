import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useViewerStore } from '@/stores/viewer'

/** 构造一个 mock engine，记录调用 */
function createMockEngine() {
  return {
    setFlightMode: vi.fn(),
    setAutoRotate: vi.fn(),
    startAutoTour: vi.fn(),
    stopAutoTour: vi.fn(),
    applyStyle: vi.fn(),
    applyLut: vi.fn(),
    setExposure: vi.fn(),
    setContrast: vi.fn(),
    setBrightness: vi.fn(),
    setSaturation: vi.fn(),
    changeScene: vi.fn(),
    prevScene: vi.fn(),
    nextScene: vi.fn(),
    onSceneChanged: undefined as ((id: string) => void) | undefined,
    dispose: vi.fn(),
  }
}

describe('viewerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态：mode=panorama，自动旋转/漫游/全屏关闭', () => {
    const store = useViewerStore()
    expect(store.mode).toBe('panorama')
    expect(store.isAutoRotate).toBe(false)
    expect(store.isAutoTour).toBe(false)
    expect(store.isFullscreen).toBe(false)
    expect(store.sidebarCollapsed).toBe(false)
    expect(store.infoPanelCollapsed).toBe(false)
  })

  it('初始 postProcessing 默认值', () => {
    const store = useViewerStore()
    expect(store.postProcessing).toEqual({
      style: '',
      lut: '',
      exposure: 1.0,
      contrast: 1.0,
      brightness: 1.0,
      saturation: 1.0,
    })
  })

  it('setMode 切换模式并调用 engine.setFlightMode', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)

    store.setMode('flight')
    expect(store.mode).toBe('flight')
    expect(engine.setFlightMode).toHaveBeenCalledWith(true)

    store.setMode('panorama')
    expect(store.mode).toBe('panorama')
    expect(engine.setFlightMode).toHaveBeenCalledWith(false)
  })

  it('切换到 flight 模式自动关闭 autoRotate 和 autoTour', () => {
    const store = useViewerStore()
    store.isAutoRotate = true
    store.isAutoTour = true
    const engine = createMockEngine()
    store.bindEngine(engine as any)

    store.setMode('flight')
    expect(store.isAutoRotate).toBe(false)
    expect(store.isAutoTour).toBe(false)
    expect(engine.setAutoRotate).toHaveBeenCalledWith(false)
    expect(engine.stopAutoTour).toHaveBeenCalled()
  })

  it('toggleAutoRotate 打开时关闭 autoTour 并切回 panorama，调用 engine', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)
    store.isAutoTour = true
    store.mode = 'flight'

    store.toggleAutoRotate()
    expect(store.isAutoRotate).toBe(true)
    expect(store.isAutoTour).toBe(false)
    expect(store.mode).toBe('panorama')
    expect(engine.setAutoRotate).toHaveBeenCalledWith(true)
    expect(engine.stopAutoTour).toHaveBeenCalled()
    expect(engine.setFlightMode).toHaveBeenCalledWith(false)

    // 再次 toggle 关闭
    store.toggleAutoRotate()
    expect(store.isAutoRotate).toBe(false)
    expect(engine.setAutoRotate).toHaveBeenCalledWith(false)
  })

  it('toggleAutoTour 打开时关闭 autoRotate 并切回 panorama，调用 engine', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)
    const scenes = [{ id: 'a' }, { id: 'b' }]
    store.setScenes(scenes as any)
    store.setCurrentSceneId('a')
    store.isAutoRotate = true
    store.mode = 'flight'

    store.toggleAutoTour()
    expect(store.isAutoTour).toBe(true)
    expect(store.isAutoRotate).toBe(false)
    expect(store.mode).toBe('panorama')
    expect(engine.setAutoRotate).toHaveBeenCalledWith(false)
    expect(engine.startAutoTour).toHaveBeenCalled()

    store.toggleAutoTour()
    expect(store.isAutoTour).toBe(false)
    expect(engine.stopAutoTour).toHaveBeenCalled()
  })

  it('toggleFullscreen 切换 isFullscreen', () => {
    const store = useViewerStore()
    expect(store.isFullscreen).toBe(false)
    store.toggleFullscreen()
    expect(store.isFullscreen).toBe(true)
    store.toggleFullscreen()
    expect(store.isFullscreen).toBe(false)
  })

  it('toggleSidebar/toggleInfoPanel 切换', () => {
    const store = useViewerStore()
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
    store.toggleInfoPanel()
    expect(store.infoPanelCollapsed).toBe(true)
  })

  it('updatePostProcessing 合并更新并调用 engine 对应方法', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)

    store.updatePostProcessing({ exposure: 1.2, contrast: 0.8 })
    expect(store.postProcessing.exposure).toBe(1.2)
    expect(store.postProcessing.contrast).toBe(0.8)
    expect(store.postProcessing.brightness).toBe(1.0) // 未变
    expect(engine.setExposure).toHaveBeenCalledWith(1.2)
    expect(engine.setContrast).toHaveBeenCalledWith(0.8)

    store.updatePostProcessing({ style: 'cinematic', lut: 'warm' })
    expect(engine.applyStyle).toHaveBeenCalledWith('cinematic')
    expect(engine.applyLut).toHaveBeenCalledWith('warm')
  })

  it('applyStyle/applyLut/updateExposure 等便利方法', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)

    store.applyStyle('bw')
    expect(store.postProcessing.style).toBe('bw')
    expect(engine.applyStyle).toHaveBeenCalledWith('bw')

    store.applyLut('cool')
    expect(store.postProcessing.lut).toBe('cool')
    expect(engine.applyLut).toHaveBeenCalledWith('cool')

    store.setBrightness(1.1)
    expect(store.postProcessing.brightness).toBe(1.1)
    expect(engine.setBrightness).toHaveBeenCalledWith(1.1)

    store.setSaturation(0.9)
    expect(store.postProcessing.saturation).toBe(0.9)
    expect(engine.setSaturation).toHaveBeenCalledWith(0.9)
  })

  it('setScenes/setCurrentSceneId/canPrev/canNext 计算首末场景禁用', () => {
    const store = useViewerStore()
    store.setScenes([{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any)

    store.setCurrentSceneId('a')
    expect(store.canPrev).toBe(false)
    expect(store.canNext).toBe(true)

    store.setCurrentSceneId('b')
    expect(store.canPrev).toBe(true)
    expect(store.canNext).toBe(true)

    store.setCurrentSceneId('c')
    expect(store.canPrev).toBe(true)
    expect(store.canNext).toBe(false)
  })

  it('goPrevScene/goNextScene：边界不调用 engine；中间切换调用 engine.prevScene/nextScene', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)
    store.setScenes([{ id: 'a' }, { id: 'b' }, { id: 'c' }])

    store.setCurrentSceneId('a')
    store.goPrevScene()
    expect(engine.prevScene).not.toHaveBeenCalled()
    expect(store.currentSceneId).toBe('a')

    store.goNextScene()
    expect(engine.nextScene).toHaveBeenCalledTimes(1)
    // 场景实际切换由引擎通过 onSceneChanged 回调同步，这里只验证调用

    store.setCurrentSceneId('c')
    store.goNextScene()
    expect(engine.nextScene).toHaveBeenCalledTimes(1) // 未新增调用
  })

  it('unbindEngine 后更新状态不再抛错', () => {
    const store = useViewerStore()
    const engine = createMockEngine()
    store.bindEngine(engine as any)
    vi.clearAllMocks() // 清空 bindEngine 时同步状态产生的调用
    store.setMode('flight')
    expect(engine.setFlightMode).toHaveBeenCalledTimes(1)

    store.unbindEngine()
    // 解绑后再操作不应抛错，也不再调用 engine
    store.setMode('panorama')
    store.toggleAutoRotate()
    store.updatePostProcessing({ exposure: 2 })
    expect(engine.setFlightMode).toHaveBeenCalledTimes(1) // 没再增加
  })
})

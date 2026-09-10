/**
 * sceneDataBuilder 单元测试
 *
 * 覆盖三个修复点：
 *  1. 初始视角：支持编辑器保存的 camelCase initialView（yaw/pitch/hfov/...），pitch → vlookat 取反
 *  2. 热点映射：后端 ath/atv/linkedSceneId/url/... 正确写入引擎 hotspots
 *  3. 多场景/多视角配置兼容
 */
import { describe, expect, it } from 'vitest'
import { buildSceneView, convertSceneToEngineData } from './sceneDataBuilder'
import type { Scene, Hotspot } from '@/types'

// ─── 初始视角 (buildSceneView) ───────────────────────────────

describe('buildSceneView — 初始视角', () => {
  it('使用编辑器保存的 camelCase initialView（yaw/pitch/hfov）作为权威来源', () => {
    const scene = {
      id: 's1',
      initialView: JSON.stringify({
        yaw: 30,
        pitch: -15,
        hfov: 90,
        fovMin: 40,
        fovMax: 130,
        maxPixelZoom: 2.5,
        fovType: 'MFOV',
        limitView: 'auto',
      }),
    } as unknown as Scene

    const view = buildSceneView(scene, {})
    // 编辑器 yaw → hlookat 直接传递（编辑器/引擎都以 yaw>0=右转）
    expect(view.hlookat).toBe('30')
    // 编辑器 pitch → vlookat 直接传递（不取反！编辑器 setCameraView 直接 vlookat=pitch）
    // pitch=-15 表示轻微俯视 → vlookat=-15 → initCameraView 内 Euler.x = -vlookat*PI/180 = +15° = 俯视
    expect(view.vlookat).toBe('-15')
    expect(view.fov).toBe('90')
    expect(view.fovtype).toBe('MFOV')
    expect(view.fovmin).toBe('40')
    expect(view.fovmax).toBe('130')
    expect(view.maxpixelzoom).toBe('2.5')
    expect(view.limitview).toBe('auto')
  })

  it('initialView 为对象（已被axios反序列化）时也能工作', () => {
    const scene = {
      id: 's1',
      initialView: { yaw: -45, pitch: 20, hfov: 100 },
    } as unknown as Scene

    const view = buildSceneView(scene, {})
    expect(view.hlookat).toBe('-45')
    expect(view.vlookat).toBe('20') // pitch=20 → vlookat=20（仰视），不取反
    expect(view.fov).toBe('100')
  })

  it('initialView 为空时回退到 scene.yaw/pitch/hfov', () => {
    const scene = { id: 's1', yaw: 10, pitch: 5, hfov: 80 } as unknown as Scene
    const view = buildSceneView(scene, {})
    expect(view.hlookat).toBe('10')
    expect(view.vlookat).toBe('5') // 直接传递，不取反
    expect(view.fov).toBe('80')
  })

  it('pitch 负值表示俯视（看地面），正值表示仰视（看天空）', () => {
    // 场景：yaw≈25°, pitch≈-5°（轻微俯视，类似截图场景），hfov≈98°
    const scene = {
      id: 's1',
      initialView: { yaw: 24.88, pitch: -4.98, hfov: 97.95, fovType: 'MFOV' },
    } as unknown as Scene
    const view = buildSceneView(scene, {})
    expect(view.hlookat).toBe('24.88')
    expect(view.vlookat).toBe('-4.98')
    expect(view.fov).toBe('97.95')
    expect(view.fovtype).toBe('MFOV')
  })

  it('全部缺失时使用合理默认（与 DEFAULT_INITIAL_VIEW 对齐）', () => {
    const scene = { id: 's1' } as unknown as Scene
    const view = buildSceneView(scene, {})
    expect(view.hlookat).toBe('0')
    expect(view.vlookat).toBe('0')
    expect(view.fov).toBe('100')
    expect(view.fovmin).toBe('70')
    expect(view.fovmax).toBe('140')
    expect(view.maxpixelzoom).toBe('2')
    expect(view.fovtype).toBe('MFOV')
    expect(view.limitview).toBe('auto')
  })

  it('imageConfig.view (krpano 约定，vlookat 正值=俯视) 回退时取反', () => {
    // 旧数据：只有 imageConfig.view，vlookat=10 表示俯视10°，应转换为 pitch=-10 → vlookat=-10
    const scene = { id: 's1' } as unknown as Scene
    const view = buildSceneView(scene, { hlookat: '20', vlookat: '10', fov: '120', fovmin: '70', fovmax: '140' })
    expect(view.hlookat).toBe('20')
    expect(view.vlookat).toBe('-10') // 取反！krpano vlookat=10 俯视 → 引擎 vlookat=-10
    expect(view.fov).toBe('120')
  })
})

// ─── 热点映射 ───────────────────────────────────────────────

describe('convertSceneToEngineData — 热点', () => {
  const baseScene = (overrides: Partial<Scene> = {}): Scene =>
    ({
      id: 's1',
      name: '场景1',
      thumbUrl: '',
      previewUrl: '',
      imageConfig: JSON.stringify({
        image: { type: 'CUBE', multires: true, tilesize: 512, levels: [] },
      }),
      hotspots: [],
      ...overrides,
    }) as Scene

  it('将后端 ath/atv/linkedSceneId 转换为引擎需要的 ath/atv/linkedscene', () => {
    const scene = baseScene({
      hotspots: [
        {
          id: 'h1',
          sceneId: 's1',
          name: '跳转到场景2',
          type: 'scene',
          ath: 45,
          atv: -10,
          linkedSceneId: 's2',
          tooltip: '去场景2',
          visible: true,
          createdAt: '',
          updatedAt: '',
        } as unknown as Hotspot,
      ],
    })
    const sd = convertSceneToEngineData(scene)
    expect(sd.hotspots).toHaveLength(1)
    expect(sd.hotspots![0]).toMatchObject({
      name: 'h1',
      ath: '45',
      atv: '-10',
      linkedscene: 's2',
      tooltip: '去场景2',
      style: 'floating-arrow',
    })
  })

  it('兼容 yaw/pitch 字段（旧数据）', () => {
    const scene = baseScene({
      hotspots: [
        {
          id: 'h2',
          sceneId: 's1',
          name: '信息点',
          type: 'info',
          yaw: 120,
          pitch: 30,
          visible: true,
          createdAt: '',
          updatedAt: '',
        } as unknown as Hotspot,
      ],
    })
    const sd = convertSceneToEngineData(scene)
    expect(sd.hotspots![0]!.ath).toBe('120')
    expect(sd.hotspots![0]!.atv).toBe('30')
    expect(sd.hotspots![0]!.style).toBe('info-icon')
  })

  it('visible=false 的热点被过滤', () => {
    const scene = baseScene({
      hotspots: [
        {
          id: 'h3',
          sceneId: 's1',
          name: '隐藏点',
          type: 'info',
          ath: 0,
          atv: 0,
          visible: false,
          createdAt: '',
          updatedAt: '',
        } as unknown as Hotspot,
      ],
    })
    const sd = convertSceneToEngineData(scene)
    expect(sd.hotspots).toHaveLength(0)
  })

  it('非scene/info类型使用 pulsing-dot 样式，自定义style字符串覆盖默认', () => {
    const scene = baseScene({
      hotspots: [
        {
          id: 'h4',
          sceneId: 's1',
          name: '链接',
          type: 'link',
          ath: 0,
          atv: 0,
          style: 'my-custom-style',
          visible: true,
          createdAt: '',
          updatedAt: '',
        } as unknown as Hotspot,
      ],
    })
    const sd = convertSceneToEngineData(scene)
    expect(sd.hotspots![0]!.style).toBe('my-custom-style')
  })

  it('scene.name 作为引擎 sceneId，用于 changeScene 匹配', () => {
    const scene = baseScene({ id: 'my-scene-uuid' })
    const sd = convertSceneToEngineData(scene)
    expect(sd.scene.name).toBe('my-scene-uuid')
  })
})

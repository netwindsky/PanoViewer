/**
 * PanoEngine 适配器
 *
 * 以"调用库"的方式封装 PanoViewV2 引擎：持有一个 PanoEngine 实例（组合，而非继承），
 * 仅通过 @panoview 顶层公共入口暴露的 API 驱动引擎，不再访问引擎私有成员。
 *
 * 职责（应用层逻辑，不属于通用引擎）：
 * - 将后端 JSON 配置转换为引擎标准的 SceneData 格式
 * - 将后端 Hotspot 数据转换为引擎标准的 Hotspot 格式并同步到 3D 场景
 */
import { PanoEngine } from '@panoview'
import type { SceneData, SunLightConfig } from '@panoview'
import type { Hotspot } from '@/types'

/** 引擎标准热点格式 */
interface PanoHotspot {
  name: string
  style: string
  ath: string
  atv: string
  linkedscene: string
  tooltip: string
  onclick: string
  on: string
  type: string
  url: string
  width?: string
  height?: string
  scale?: string
  rotate?: string
  blendmode: string
  points?: string
  bgcolor?: string
  tolerance?: number
  feather?: number
  followzoom?: string
  content: string
}

export class PanoEngineAdapter {
  private engine: PanoEngine

  constructor(container: HTMLElement) {
    // autoLoad:false —— 跳过引擎内置 XML demo，改用后端场景数据
    this.engine = new PanoEngine(container, { autoLoad: false })
  }

  /**
   * 从后端 JSON 配置加载全景场景。
   * @param config 后端生成的场景配置（JSON 对象或 SceneData 数组）
   */
  public loadSceneConfig(config: SceneData | SceneData[] | Record<string, any>): void {
    let sceneData: SceneData

    if (Array.isArray(config)) {
      sceneData = config[0]
    } else if (config.scene && config.image) {
      sceneData = config as SceneData
    } else {
      sceneData = this.convertToSceneData(config)
    }

    // 后端返回的瓦片 url 已是 /uploads/... 完整路径，关闭库默认的 '/src/assets/' 前缀
    this.engine.setBaseUrl('')
    // manageHotspots:false —— 查看器的热点与场景配置分离，由 syncHotspots 独立管理。
    // 引擎 initScene 是异步的，若让其管理热点，会在瓦片加载完成后用 imageConfig 内嵌的
    // 空热点数组覆盖（fadeOut(0) + createHotspots([])），清掉此前注入的真实热点。
    // 通过库公共 API 注入场景数据，复用引擎原生加载流程
    void this.engine.loadScenes([sceneData], { manageHotspots: false })
  }

  /**
   * 将后端 Hotspot 数据转换为引擎标准格式
   */
  private toPanoHotspot(hotspot: Hotspot): PanoHotspot {
    // 样式解析：后端 style 键优先；缺省时按类型兜底
    const resolvedStyle =
      hotspot.styleName ||
      (hotspot.type === 'image' ? 'custom-image' : hotspot.type === 'web' ? 'custom-web' : 'pulsing-dot')
    // pulsing-dot 等"0 宽容器 + 子元素"预设：.hotspot 基类是 display:flex，
    // 容器宽 0 会把内部圆点子元素挤压成"竖白条"。
    // 引擎 applyStyle 中 data.width 优先于预设宽度，故给这类 DOM 点样式
    // 的容器补一个固定 px 尺寸。仅对 DOM 点样式生效；image/quad/model 等
    // mesh 热点的 width 用于 3D 几何，保持原样不加 px。
    const STYLES_NEEDING_FIXED_SIZE = ['pulsing-dot', 'glow-orb', 'info-icon', 'navi-point']
    const needsFixedSize = STYLES_NEEDING_FIXED_SIZE.includes(resolvedStyle)
    const DEFAULT_DOT_SIZE = '18px'

    const resolvedWidth = needsFixedSize
      ? hotspot.width
        ? `${hotspot.width}px`
        : DEFAULT_DOT_SIZE
      : hotspot.width
        ? String(hotspot.width)
        : undefined
    const resolvedHeight = needsFixedSize
      ? hotspot.height
        ? `${hotspot.height}px`
        : DEFAULT_DOT_SIZE
      : hotspot.height
        ? String(hotspot.height)
        : undefined

    const linkedscene = hotspot.targetSceneId || ''
    const onclick = hotspot.onclick || (linkedscene ? `changescene('${linkedscene}')` : '')

    return {
      name: hotspot.id,
      style: resolvedStyle,
      ath: String(hotspot.yaw ?? 0),
      atv: String(hotspot.pitch ?? 0),
      linkedscene,
      tooltip: hotspot.tooltip || hotspot.name,
      onclick,
      on: onclick,
      type: hotspot.type,
      url: hotspot.url || '',
      width: resolvedWidth,
      height: resolvedHeight,
      scale: hotspot.scale ? String(hotspot.scale) : undefined,
      rotate: hotspot.rotate ? String(hotspot.rotate) : undefined,
      blendmode: '',
      points: hotspot.points,
      bgcolor: undefined,
      tolerance: undefined,
      feather: undefined,
      followzoom: hotspot.followZoom ? '1' : undefined,
      content: hotspot.content || '',
    }
  }

  /**
   * 将后端热点列表同步到引擎 3D 场景
   */
  public syncHotspots(hotspots: Hotspot[]): void {
    this.engine.hotspotsManager.clearHotspots()
    const panoHotspots = hotspots.map((h) => this.toPanoHotspot(h))
    this.engine.hotspotsManager.createHotspots(panoHotspots)
    this.engine.hotspotsManager.fadeIn(500)
  }

  /**
   * 将后端 JSON 配置转换为标准库 SceneData 格式
   */
  private convertToSceneData(config: Record<string, any>): SceneData {
    return {
      scene: {
        name: config.scene?.name || 'default',
        title: config.scene?.title || '',
        onstart: '',
        thumburl: '',
        lat: '',
        lng: '',
        heading: '',
      },
      view: {
        hlookat: String(config.view?.hlookat ?? '0'),
        vlookat: String(config.view?.vlookat ?? '0'),
        fovtype: config.view?.fovtype || 'MFOV',
        fov: String(config.view?.fov ?? '90'),
        maxpixelzoom: '2.0',
        fovmin: String(config.view?.fovmin ?? '30'),
        fovmax: String(config.view?.fovmax ?? '120'),
        limitview: 'auto',
      },
      preview: config.preview
        ? { url: config.preview.url }
        : undefined,
      image: {
        type: config.image?.type || 'CUBE',
        multires: config.image?.multires ?? true,
        tilesize: String(config.image?.tilesize ?? '512'),
        levels: (config.image?.levels || []).map((level: any) => ({
          tiledimagewidth: String(level.tiledimagewidth),
          tiledimageheight: String(level.tiledimageheight),
          cube: { url: level.cube?.url || '' },
        })),
      },
      hotspots: config.hotspots || [],
    }
  }

  // ==================== 光照管理方法（转发引擎原生 API） ====================

  /**
   * 设置 HDR 环境贴图（等距柱状 .hdr）。
   * url 为 null/空时恢复默认 RoomEnvironment；显式调用即启用环境照明。
   */
  public async setEnvironmentMap(url: string | null): Promise<void> {
    await this.engine.setEnvironmentMap(url)
  }

  /** 完全禁用场景环境照明（scene.environment = null），与 setEnvironmentMap(null) 语义不同 */
  public disableEnvironment(): void {
    this.engine.disableEnvironment()
  }

  /** 配置太阳方向光（懒创建 DirectionalLight） */
  public setSunLight(config: SunLightConfig): void {
    this.engine.setSunLight(config)
  }

  /** 最近一次 setSunLight 的配置快照；未调用过时返回 null */
  public getSunLightConfig(): SunLightConfig | null {
    return this.engine.getSunLightConfig()
  }

  // ==================== 后期处理 ====================

  /**
   * 应用完整的后期处理配置（从后端表单模型映射到引擎参数）。
   * 字段映射：exposure → brightness = exposure - 1, contrast, saturation, colorTemperature ÷ 100
   */
   public applyPostConfig(config: {
    enabled: boolean
    presetStyle?: string
    exposure?: number
    contrast?: number
    saturation?: number
    colorTemperature?: number
    vignette?: number
    vignetteIntensity?: number
    lutFileUrl?: string | null
    lutIntensity?: number
    bloomStrength?: number
    bloomThreshold?: number
    bloomRadius?: number
  }): void {
    const pp = this.engine.getPostProcessing()
    if (!pp) return

    if (config.enabled) {
      pp.enable()
    } else {
      pp.disable()
      return
    }

    const presetStyle = config.presetStyle || 'original'
    const isBuiltinPreset =
      presetStyle !== 'custom' && presetStyle !== '' && pp.applyPreset(presetStyle)

    const exposure = typeof config.exposure === 'number' ? config.exposure : 1.0
    const contrast = typeof config.contrast === 'number' ? config.contrast : 1.0
    const saturation = typeof config.saturation === 'number' ? config.saturation : 1.0
    const colorTemp = typeof config.colorTemperature === 'number' ? config.colorTemperature : 0

    const base = isBuiltinPreset ? pp.getEffectParams() : {
      brightness: 0, contrast: 1, saturation: 1, hueRotate: 0, sepia: 0,
      temperature: 0, vignette: 0, vignetteIntensity: 1, grain: 0, noiseAmount: 0,
    }
    const vignette = typeof config.vignette === 'number' ? config.vignette : base.vignette
    const vignetteIntensity = typeof config.vignetteIntensity === 'number' ? config.vignetteIntensity : base.vignetteIntensity
    pp.setEffectParams({
      ...base,
      brightness: exposure - 1,
      contrast,
      saturation,
      temperature: colorTemp / 100,
      vignette,
      vignetteIntensity,
    })

    // LUT
    if (config.lutFileUrl) {
      void this.loadLutFromUrl(config.lutFileUrl)
    } else {
      pp.removeLut()
    }
    pp.setLutIntensity(typeof config.lutIntensity === 'number' ? config.lutIntensity : 1)

    // Bloom
    const bloomStrength = typeof config.bloomStrength === 'number' ? config.bloomStrength : 0
    const bloomThreshold = typeof config.bloomThreshold === 'number' ? config.bloomThreshold : 0.8
    const bloomRadius = typeof config.bloomRadius === 'number' ? config.bloomRadius : 0.5
    pp.setBloomParams({ strength: bloomStrength, threshold: bloomThreshold, radius: bloomRadius })
  }

  /** 从 URL 加载 LUT 文件到引擎 */
  public async loadLutFromUrl(url: string): Promise<boolean> {
    const pp = this.engine.getPostProcessing()
    if (!pp) return false
    try {
      const resp = await fetch(url, { credentials: 'include' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const name = url.split('/').pop() || 'lut'
      const file = new File([blob], name, { type: blob.type || 'application/octet-stream' })
      return await pp.loadLutFile(file)
    } catch (e) {
      console.warn('LUT 加载失败:', e)
      return false
    }
  }

  /**
   * 销毁引擎，释放资源
   */
  public dispose(): void {
    this.engine.dispose()
  }
}

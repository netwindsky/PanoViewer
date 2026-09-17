/**
 * 场景数据构建器（纯函数，方便单元测试）
 *
 * 将后端返回的 Scene（camelCase 字段：yaw/pitch/hfov/... + ath/atv/linkedSceneId）
 * 转换为 PanoViewV2 引擎需要的 SceneData（krpano 风格：hlookat/vlookat/fov/... + ath/atv/linkedscene）。
 *
 * 符号约定（经与编辑器 PanoEngineAdapter.setCameraView 源码核对）：
 *  - 编辑器 domain InitialView 使用 { yaw, pitch, hfov, fovType }：
 *      yaw 正值 = 右转，pitch 正值 = 仰视，pitch 负值 = 俯视；
 *      hfov 数值配合 fovType（默认 MFOV）使用，由 initCameraView 按 fovType 换算为 VFOV。
 *  - 编辑器 setCameraView 直接映射：hlookat = yaw，vlookat = pitch（不取反！），
 *    引擎 initCameraView 内部再做 `Euler(-vlookat, -hlookat, 0, 'YXZ')` 完成 YXZ 欧拉角设置。
 *  - 若数据源是旧的 imageConfig.view（krpano 风格：vlookat>0=俯视），需取反后作为 pitch 使用；
 *    该取反已由 PanoEditor 的 sceneFromDto 完成，PanoViewer 不应再做二次取反。
 */
import type { Scene, Hotspot, InitialViewConfig } from '@/types'
import type { SceneData } from '@panoview'

/** 编辑器默认初始视角（与 PanoEditor DEFAULT_INITIAL_VIEW 保持一致） */
export const DEFAULT_INITIAL_VIEW = {
  hlookat: 0,
  vlookat: 0,
  fov: 100,
  fovMin: 70,
  fovMax: 140,
  maxPixelZoom: 2,
  fovType: 'MFOV' as const,
  limitView: 'auto' as const,
}

function toNum(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

/** 解析后端 initialView：优先级 scene.initialView > viewConfig.initialView，支持 JSON 字符串 / 已解析对象 / null */
export function parseInitialView(scene: Scene): InitialViewConfig | null {
  const iv = (scene as any).initialView
  if (iv != null) return parseInitialViewValue(iv)

  // 兜底：后端 viewConfig 列持久化了 initialView（编辑器 patchToDto 双写）
  const vc = scene.viewConfig
  if (vc == null) return null
  try {
    const parsed = typeof vc === 'string' ? JSON.parse(vc) : vc
    const inner = parsed?.initialView
    if (inner != null) return parseInitialViewValue(inner)
  } catch {
    // viewConfig 解析失败，安全降级
  }
  return null
}

function parseInitialViewValue(v: unknown): InitialViewConfig | null {
  if (v == null) return null
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as InitialViewConfig
    } catch {
      return null
    }
  }
  return v as InitialViewConfig
}

/**
 * 从 Scene + imageConfig.view 构造引擎需要的 ViewConfig
 * 优先级：initialView(camelCase) > scene.yaw/pitch/hfov > imageConfig.view(hlookat/vlookat/fov) > DEFAULT
 */
export function buildSceneView(
  scene: Scene,
  imageCfgView: Record<string, unknown> | undefined,
): SceneData['view'] {
  const iv = parseInitialView(scene)
  const view = imageCfgView ?? {}

  // 统一取数：按优先级解析各字段（camelCase → scene 顶层 → imageConfig.view krpano风格）
  // - 前两个来源（initialView / scene）的 pitch 遵循编辑器约定：正值=仰视，直接作为 vlookat；
  // - 最末来源 imageConfig.view 是 krpano 约定：vlookat 正值=俯视，需要取反。
  let rawHlookat = iv?.hlookat ?? iv?.yaw ?? scene.yaw
  let rawVlookat: unknown = iv?.vlookat ?? iv?.pitch ?? scene.pitch
  let vlookatFromKrpano = false
  if (rawHlookat == null && view.hlookat != null) rawHlookat = view.hlookat
  if (rawVlookat == null) {
    if (view.vlookat != null) {
      rawVlookat = view.vlookat
      vlookatFromKrpano = true
    }
  }
  let rawFov = iv?.fov ?? iv?.hfov ?? scene.hfov
  let fovtypeSource = iv?.fovtype ?? iv?.fovType ?? view.fovtype
  if (rawFov == null && view.fov != null) rawFov = view.fov
  if (fovtypeSource == null) fovtypeSource = view.fovtype
  const rawFovMin = iv?.fovmin ?? iv?.fovMin ?? view.fovmin
  const rawFovMax = iv?.fovmax ?? iv?.fovMax ?? view.fovmax
  const rawMaxPZ = iv?.maxpixelzoom ?? iv?.maxPixelZoom ?? view.maxpixelzoom
  const fovtype = (fovtypeSource ?? DEFAULT_INITIAL_VIEW.fovType) as string
  const limitview = (iv?.limitview ?? iv?.limitView ?? view.limitview ?? DEFAULT_INITIAL_VIEW.limitView) as string

  const hlookat = toNum(rawHlookat, DEFAULT_INITIAL_VIEW.hlookat)
  let vlookatNum = toNum(rawVlookat, DEFAULT_INITIAL_VIEW.vlookat)
  if (vlookatFromKrpano) {
    // krpano vlookat 正值=俯视，转为编辑器 pitch（正值=仰视）需取反
    vlookatNum = -vlookatNum
  }
  const vlookat = vlookatNum
  const fov = toNum(rawFov, DEFAULT_INITIAL_VIEW.fov)
  const fovmin = toNum(rawFovMin, DEFAULT_INITIAL_VIEW.fovMin)
  const fovmax = toNum(rawFovMax, DEFAULT_INITIAL_VIEW.fovMax)
  const maxpixelzoom = toNum(rawMaxPZ, DEFAULT_INITIAL_VIEW.maxPixelZoom)

  return {
    hlookat: String(hlookat),
    vlookat: String(vlookat),
    fov: String(fov),
    fovtype: String(fovtype).toUpperCase(),
    fovmin: String(fovmin),
    fovmax: String(fovmax),
    maxpixelzoom: String(maxpixelzoom),
    limitview: String(limitview),
  }
}

/** 将前端 Hotspot 转换为引擎 Hotspot */
export function convertHotspotToEngine(h: Hotspot) {
  const ath = toNum(h.ath ?? h.yaw, 0)
  const atv = toNum(h.atv ?? h.pitch, 0)
  const linkedscene = h.linkedSceneId ?? h.targetSceneId ?? ''

  // 按热点类型选默认样式：图片/视频/quad 不使用 DOM 点样式
  let resolvedStyle: string
  if (typeof h.style === 'string' && h.style) {
    resolvedStyle = h.style
  } else if (h.type === 'image' || h.type === 'video' || h.type === 'quad' || h.type === 'model') {
    resolvedStyle = 'custom-image'
  } else if (h.type === 'scene') {
    resolvedStyle = 'floating-arrow'
  } else if (h.type === 'info') {
    resolvedStyle = 'info-icon'
  } else {
    resolvedStyle = 'pulsing-dot'
  }

  // DOM 点样式（0 宽容器 + 内部圆点）需要固定 px 尺寸，否则会被 flex 压扁
  const STYLES_NEEDING_FIXED_SIZE = ['pulsing-dot', 'glow-orb', 'info-icon', 'navi-point']
  const needsFixedSize = STYLES_NEEDING_FIXED_SIZE.includes(resolvedStyle)
  const DEFAULT_DOT_SIZE = '18'

  const resolvedWidth = needsFixedSize
    ? h.width != null
      ? String(h.width)
      : DEFAULT_DOT_SIZE
    : h.width != null
      ? String(h.width)
      : undefined
  const resolvedHeight = needsFixedSize
    ? h.height != null
      ? String(h.height)
      : DEFAULT_DOT_SIZE
    : h.height != null
      ? String(h.height)
      : undefined

  // 自动生成场景跳转命令（与 PanoEditor 保持一致）
  const onclick = h.onclick || (linkedscene ? `changescene('${linkedscene}')` : '')

  return {
    name: h.id,
    style: resolvedStyle,
    ath: String(ath),
    atv: String(atv),
    linkedscene,
    tooltip: h.tooltip || h.name || '',
    onclick,
    events: h.events || '',
    on: onclick,
    // 类型（quad/image/video/model/info/scene 等）：引擎据此走不同渲染分支
    ...(h.type ? { type: h.type } : {}),
    // mesh 热点的几何/贴图字段（DOM 点即使有这些字段也无副作用，但不可丢失）
    ...(h.points ? { points: h.points } : {}),
    ...(h.url ? { url: h.url } : {}),
    ...(resolvedWidth != null ? { width: resolvedWidth } : {}),
    ...(resolvedHeight != null ? { height: resolvedHeight } : {}),
    ...(h.scale != null ? { scale: String(h.scale) } : {}),
    ...(h.rotate != null ? { rotate: String(h.rotate) } : {}),
    ...(h.blendmode ? { blendmode: h.blendmode } : {}),
    ...(h.bgcolor ? { bgcolor: h.bgcolor } : {}),
    ...(h.tolerance != null ? { tolerance: Number(h.tolerance) } : {}),
    ...(h.feather != null ? { feather: Number(h.feather) } : {}),
    ...(h.followZoom ? { followzoom: '1' } : {}),
    ...(h.content ? { content: h.content } : {}),
    ...(h.shader ? { shader: h.shader } : {}),
  }
}

/** 将后端 Scene 整体转换为引擎 SceneData */
export function convertSceneToEngineData(scene: Scene): SceneData | null {
  if (!scene.imageConfig) return null
  let cfg: Record<string, any>
  try {
    cfg = JSON.parse(scene.imageConfig)
  } catch {
    return null
  }

  const view = buildSceneView(scene, cfg.view)

  const engineHotspots = (scene.hotspots || [])
    .filter((h) => h.visible !== false)
    .map(convertHotspotToEngine)

  return {
    scene: {
      name: scene.id,
      title: scene.name || scene.title || '',
      onstart: '',
      thumburl: scene.thumbUrl || '',
      lat: '',
      lng: '',
      heading: '',
    },
    view,
    preview: cfg.preview
      ? { url: cfg.preview.url }
      : scene.previewUrl
        ? { url: scene.previewUrl }
        : undefined,
    image: {
      type: cfg.image?.type || 'CUBE',
      multires: cfg.image?.multires ?? true,
      tilesize: String(cfg.image?.tilesize ?? '512'),
      levels: (cfg.image?.levels || []).map((level: any) => ({
        tiledimagewidth: String(level.tiledimagewidth),
        tiledimageheight: String(level.tiledimageheight),
        cube: { url: level.cube?.url || '' },
      })),
    },
    hotspots: engineHotspots,
  }
}

/** 批量转换多场景 */
export function convertScenesToEngineData(scenes: Scene[]): SceneData[] {
  return scenes.map(convertSceneToEngineData).filter((sd): sd is SceneData => sd !== null)
}

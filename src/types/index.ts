/** 项目 */
export interface Project {
  id: string
  name: string
  description: string
  coverUrl: string
  scenes: Scene[]
  settings: ProjectSettings
  createdAt: string
  updatedAt: string
}

export interface ProjectSettings {
  autoRotate: boolean
  autoRotateSpeed: number
  defaultFov: number
  minFov: number
  maxFov: number
  enableCompass: boolean
}

/** 初始视角配置（对齐编辑器 InitialView，字段来自后端 viewConfig JSON） */
export interface InitialViewConfig {
  yaw?: number
  pitch?: number
  hfov?: number
  fov?: number
  fovMin?: number
  fovMax?: number
  maxPixelZoom?: number
  fovType?: string
  fovtype?: string
  limitView?: string
  limitview?: string
  [key: string]: unknown
}

/** 场景 */
export interface Scene {
  id: string
  projectId: string
  name: string
  description: string
  thumbUrl: string
  previewUrl: string
  imageConfig: string
  /** 后端 viewConfig JSON 字符串，内含 initialView / lat / lng / heading / onstart */
  viewConfig?: string | null
  status: string
  pitch: number
  yaw: number
  hfov: number
  hotspots: Hotspot[]
  metadata: Record<string, string>
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** 热点 */
export interface Hotspot {
  id: string
  sceneId: string
  type: HotspotType
  name: string
  description: string
  pitch: number
  yaw: number
  targetSceneId?: string
  icon?: string
  /** 后端样式键（custom-image / custom-web / map-pin / pulsing-dot 等），驱动引擎渲染路径 */
  styleName?: string
  style?: HotspotStyle
  tooltip?: string
  points?: string
  url?: string
  width?: number
  height?: number
  scale?: number
  rotate?: string
  /** 模型视觉前方轴（'axis:sign'，如 'z:-1'），供 ModelHotspot 计算固有偏移 */
  modelForwardAxis?: string
  /** 模型热点着色器（grayscale / sepia / invert 等） */
  shader?: string
  content?: string
  followZoom?: boolean
  onclick?: string
  visible?: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export type HotspotType = 'scene' | 'info' | 'link' | 'image' | 'video' | 'web' | 'model' | 'quad'

export interface HotspotStyle {
  iconColor: string
  iconSize: number
  animation: 'pulse' | 'bounce' | 'none'
}

/** 场景光照配置（后端 scene_lighting_configs） */
export interface LightingConfig {
  id: string
  sceneId: string
  /** HDR 环境贴图地址（null = 默认 RoomEnvironment） */
  envMapUrl: string | null
  /** 环境照明开关（false = 完全禁用 IBL） */
  envMapEnabled: boolean
  sunEnabled: boolean
  sunAzimuth: number
  sunElevation: number
  sunIntensity: number
  sunColor: string
  /** 阴影开关 */
  sunShadowsEnabled: boolean
  /** 阴影透明度(0-1) */
  sunShadowOpacity: number
}

/** 后期处理 */
export interface PostProcessingConfig {
  style: string
  lut: string
  exposure: number
  contrast: number
  brightness: number
  saturation: number
  // 后端 DTO（/public/scenes/{id}/postprocessing）实际返回的字段，供 PanoCanvas 回放使用
  enabled?: boolean
  presetStyle?: string
  toneMapping?: string
  colorTemperature?: number
  vignette?: number
  vignetteIntensity?: number
  lutResourceId?: string | null
  lutFileUrl?: string | null
  lutIntensity?: number
  bloomStrength?: number
  bloomThreshold?: number
  bloomRadius?: number
}

/** 统计上报 */
export interface StatsPayload {
  projectId: string
}

/** API 通用响应 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** 查看器模式 */
export type ViewerMode = 'panorama' | 'flight'

/** 小地图标记 */
export interface MinimapMarker {
  sceneId: string
  x: number
  y: number
  label: string
  active: boolean
}

/** LUT 选项 */
export interface LutOption {
  id: string
  name: string
  previewUrl: string
}

/** 风格选项 */
export interface StyleOption {
  id: string
  name: string
  previewUrl: string
}

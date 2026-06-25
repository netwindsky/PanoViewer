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

/** 场景 */
export interface Scene {
  id: string
  projectId: string
  name: string
  description: string
  thumbUrl: string
  previewUrl: string
  imageConfig: string
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
  style?: HotspotStyle
  tooltip?: string
  createdAt: string
  updatedAt: string
}

export type HotspotType = 'scene' | 'info' | 'link' | 'image' | 'video'

export interface HotspotStyle {
  iconColor: string
  iconSize: number
  animation: 'pulse' | 'bounce' | 'none'
}

/** 后期处理 */
export interface PostProcessingConfig {
  style: string
  lut: string
  exposure: number
  contrast: number
  brightness: number
  saturation: number
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

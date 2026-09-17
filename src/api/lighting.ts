import http, { unwrap } from './index'
import type { SunLightConfig } from '@panoview'
import type { ApiResponse, LightingConfig } from '@/types'

/**
 * 场景光照配置（只读）。
 * 查看器为免登录分享页，走 /api/public 白名单；
 * 编辑/持久化在 PanoEditor 中完成，查看器不回写。
 */

/** 拉取场景光照配置（后端无配置时返回默认值：默认环境 + 太阳关闭） */
export function getPublicLighting(sceneId: string): Promise<LightingConfig> {
  return http
    .get<ApiResponse<LightingConfig>>(`/public/scenes/${sceneId}/lighting`)
    .then(unwrap)
}

/** 将方位角归一化到 [0, 360)：gizmo 反演 atan2 可能产生负角/超圈角 */
export function normalizeAzimuth(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** 后端光照配置 → 引擎太阳光配置（去掉 sun 前缀） */
export function toSunConfig(lighting: LightingConfig): SunLightConfig {
  return {
    enabled: lighting.sunEnabled,
    azimuth: normalizeAzimuth(lighting.sunAzimuth),
    elevation: lighting.sunElevation,
    intensity: lighting.sunIntensity,
    color: lighting.sunColor,
    shadows: lighting.sunShadowsEnabled ?? true,
    shadowOpacity: lighting.sunShadowOpacity ?? 0.4,
  }
}

import http, { unwrap } from './index'
import type { PostProcessingConfig, LutOption, StyleOption } from '@/types'

export function getPostProcessingConfig(sceneId: string): Promise<PostProcessingConfig> {
  return http.get(`/public/scenes/${sceneId}/postprocessing`).then(unwrap)
}

export function getLutOptions(): Promise<LutOption[]> {
  return http.get('/public/luts').then(unwrap)
}

export function getStyleOptions(): Promise<StyleOption[]> {
  return http.get('/post-processing/presets').then(unwrap)
}

import http, { unwrap } from './index'
import type { Hotspot } from '@/types'

export function getHotspots(sceneId: string): Promise<Hotspot[]> {
  return http.get(`/public/scenes/${sceneId}/hotspots`).then(unwrap)
}

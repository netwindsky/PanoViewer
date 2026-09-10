import http, { unwrap } from './index'
import type { Hotspot } from '@/types'

interface HotspotRaw {
  id: string
  sceneId: string
  name: string
  type: string
  ath: number
  atv: number
  points?: string
  style?: string
  url?: string
  width?: number
  height?: number
  scale?: number
  rotate?: string
  linkedSceneId?: string
  tooltip?: string
  content?: string
  followZoom?: boolean
  visible?: boolean
  sortOrder?: number
}

function mapHotspot(h: HotspotRaw): Hotspot {
  return {
    id: h.id,
    sceneId: h.sceneId,
    name: h.name,
    type: h.type,
    yaw: h.ath,
    pitch: h.atv,
    points: h.points,
    styleName: h.style,
    style: { animation: 'pulse' },
    url: h.url,
    width: h.width,
    height: h.height,
    scale: h.scale,
    rotate: h.rotate,
    targetSceneId: h.linkedSceneId,
    tooltip: h.tooltip,
    content: h.content,
    followZoom: h.followZoom,
    visible: h.visible ?? true,
    sortOrder: h.sortOrder,
  }
}

export function getHotspots(sceneId: string): Promise<Hotspot[]> {
  return http
    .get(`/public/scenes/${sceneId}/hotspots`)
    .then(unwrap)
    .then((list: HotspotRaw[]) => list.map(mapHotspot))
}

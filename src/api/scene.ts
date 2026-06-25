import http, { unwrap } from './index'
import type { Scene } from '@/types'

export function getScene(sceneId: string): Promise<Scene> {
  return http.get(`/public/scenes/${sceneId}`).then(unwrap)
}

export function getScenesByProject(projectId: string): Promise<Scene[]> {
  return http.get(`/public/projects/${projectId}/scenes`).then(unwrap)
}

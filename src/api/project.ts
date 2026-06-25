import http, { unwrap } from './index'
import type { Project } from '@/types'

export function getProject(projectId: string): Promise<Project> {
  return http.get(`/public/projects/${projectId}`).then(unwrap)
}

export function getProjectList(): Promise<Project[]> {
  return http.get('/public/projects').then(unwrap)
}

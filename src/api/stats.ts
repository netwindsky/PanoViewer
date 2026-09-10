import http from './index'

export function reportStats(projectId: string): Promise<void> {
  return http.post('/public/stats', { projectId }).then(() => {})
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '@/types'
import { getProject } from '@/api/project'

export const useProjectStore = defineStore('project', () => {
  const project = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const projectName = computed(() => project.value?.name ?? '')
  const scenes = computed(() => project.value?.scenes ?? [])

  async function fetchProject(projectId: string) {
    loading.value = true
    error.value = null
    try {
      project.value = await getProject(projectId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载项目失败'
    } finally {
      loading.value = false
    }
  }

  return { project, loading, error, projectName, scenes, fetchProject }
})

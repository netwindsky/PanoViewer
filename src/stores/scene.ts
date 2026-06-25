import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Scene, Hotspot } from '@/types'
import { getScenesByProject } from '@/api/scene'
import { getHotspots } from '@/api/hotspot'

export const useSceneStore = defineStore('scene', () => {
  const scenes = ref<Scene[]>([])
  const currentSceneId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentScene = computed<Scene | null>(() =>
    scenes.value.find((s) => s.id === currentSceneId) ?? null,
  )

  const currentHotspots = computed<Hotspot[]>(() => currentScene.value?.hotspots ?? [])

  function setCurrentScene(sceneId: string) {
    currentSceneId.value = sceneId
  }

  async function fetchScenes(projectId: string) {
    loading.value = true
    error.value = null
    try {
      scenes.value = await getScenesByProject(projectId)
      if (scenes.value.length > 0 && !currentSceneId.value) {
        currentSceneId.value = scenes.value[0]!.id
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载场景失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchHotspots(sceneId: string) {
    try {
      const hotspots = await getHotspots(sceneId)
      const scene = scenes.value.find((s) => s.id === sceneId)
      if (scene) {
        scene.hotspots = hotspots
      }
    } catch (e) {
      console.error('加载热点失败:', e)
    }
  }

  return {
    scenes,
    currentSceneId,
    currentScene,
    currentHotspots,
    loading,
    error,
    setCurrentScene,
    fetchScenes,
    fetchHotspots,
  }
})

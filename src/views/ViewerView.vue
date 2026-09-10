<template>
  <div class="viewer-layout">
    <TopBar />

    <div class="viewer-body">
      <SceneSidebar />

      <div class="viewer-canvas-area">
        <PanoCanvas />

        <Minimap v-if="!isMobile" />

        <InfoPanel v-if="!isMobile" />
      </div>
    </div>

    <PostProcessingControls />
    <BottomControls />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useSceneStore } from '@/stores/scene'
import { useViewerStore } from '@/stores/viewer'
import { reportStats } from '@/api/stats'
import TopBar from '@/components/TopBar.vue'
import SceneSidebar from '@/components/SceneSidebar.vue'
import Minimap from '@/components/Minimap.vue'
import InfoPanel from '@/components/InfoPanel.vue'
import BottomControls from '@/components/BottomControls.vue'
import PostProcessingControls from '@/components/PostProcessingControls.vue'
import PanoCanvas from '@/components/PanoCanvas.vue'

const props = defineProps<{
  projectId: string
}>()

const projectStore = useProjectStore()
const sceneStore = useSceneStore()
const viewerStore = useViewerStore()

const currentScene = computed(() => sceneStore.currentScene)
const currentHotspots = computed(() => sceneStore.currentHotspots)

const isMobile = computed(() => window.innerWidth < 768)

async function loadHotspots() {
  const sceneId = sceneStore.currentSceneId
  if (sceneId) {
    await sceneStore.fetchHotspots(sceneId)
  }
}

async function loadData() {
  await projectStore.fetchProject(props.projectId)
  await sceneStore.fetchScenes(props.projectId)
  await loadHotspots()
}

watch(
  () => props.projectId,
  () => {
    loadData()
  },
)

watch(() => sceneStore.currentSceneId, () => {
  loadHotspots()
})

watch(currentScene, (scene) => {
  if (scene) {
    reportStats(props.projectId)
  }
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.viewer-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}

.viewer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.viewer-canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>

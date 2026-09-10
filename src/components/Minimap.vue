<template>
  <div class="minimap">
    <div class="minimap-header">
      <span>小地图</span>
    </div>
    <div class="minimap-body">
      <div
        v-for="marker in markers"
        :key="marker.sceneId"
        class="minimap-marker"
        :class="{ active: marker.active }"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        :title="marker.label"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useProjectStore } from '@/stores/project'
import type { MinimapMarker } from '@/types'

const sceneStore = useSceneStore()
const projectStore = useProjectStore()

const markers = computed<MinimapMarker[]>(() => {
  const scenes = projectStore.scenes
  const total = scenes.length
  if (total === 0) return []

  const cols = Math.ceil(Math.sqrt(total))
  return scenes.map((scene, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const rows = Math.ceil(total / cols)
    return {
      sceneId: scene.id,
      x: cols > 1 ? 10 + (col / (cols - 1)) * 80 : 50,
      y: rows > 1 ? 10 + (row / (rows - 1)) * 80 : 50,
      label: scene.name,
      active: scene.id === sceneStore.currentSceneId,
    }
  })
})
</script>

<style scoped>
.minimap {
  position: absolute;
  top: 12px;
  right: 12px;
  width: var(--minimap-width);
  height: var(--minimap-height);
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 50;
}

.minimap-header {
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.minimap-body {
  position: relative;
  width: 100%;
  height: calc(100% - 28px);
}

.minimap-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all var(--transition-fast);
}

.minimap-marker.active {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-dim);
  width: 10px;
  height: 10px;
}
</style>

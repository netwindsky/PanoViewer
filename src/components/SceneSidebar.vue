<template>
  <aside class="scene-sidebar" :class="{ collapsed: viewerStore.sidebarCollapsed }">
    <div class="sidebar-header">
      <span class="sidebar-title">场景列表</span>
      <button class="toggle-btn" @click="viewerStore.toggleSidebar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path v-if="viewerStore.sidebarCollapsed" d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none" />
          <path v-else d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </button>
    </div>

    <div v-if="!viewerStore.sidebarCollapsed" class="scene-list">
      <div
        v-for="scene in scenes"
        :key="scene.id"
        class="scene-item"
        :class="{ active: scene.id === sceneStore.currentSceneId }"
        @click="handleSceneClick(scene.id)"
      >
        <div class="scene-thumb">
          <img
            v-if="scene.thumbUrl"
            :src="scene.thumbUrl"
            :alt="scene.name"
            loading="lazy"
          />
          <div v-else class="scene-thumb-placeholder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-muted)">
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
              <circle cx="7" cy="7" r="2" fill="currentColor" />
              <path d="M2 14l4-4 3 3 3-4 6 5v2H2z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        </div>
        <span class="scene-name">{{ scene.name }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useProjectStore } from '@/stores/project'
import { useViewerStore } from '@/stores/viewer'
import { reportStats } from '@/api/stats'

const sceneStore = useSceneStore()
const projectStore = useProjectStore()
const viewerStore = useViewerStore()

const scenes = computed(() => sceneStore.scenes)

function handleSceneClick(sceneId: string) {
  const prevSceneId = sceneStore.currentSceneId
  sceneStore.setCurrentScene(sceneId)
  if (prevSceneId !== sceneId && projectStore.project) {
    reportStats(projectStore.project.id)
  }
}
</script>

<style scoped>
.scene-sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  overflow: hidden;
  flex-shrink: 0;
}

.scene-sidebar.collapsed {
  width: 44px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.collapsed .sidebar-title {
  display: none;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  color: var(--accent);
  border-color: var(--border-accent);
}

.scene-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  margin-bottom: 4px;
}

.scene-item:hover {
  background: var(--bg-tertiary);
}

.scene-item.active {
  background: var(--accent-glow);
  border: 1px solid var(--border-accent);
}

.scene-thumb {
  width: 48px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.scene-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scene-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scene-item.active .scene-name {
  color: var(--accent);
}
</style>

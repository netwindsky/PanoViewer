<template>
  <div class="info-panel" :class="{ collapsed: viewerStore.infoPanelCollapsed }">
    <div class="info-panel-header">
      <span>场景信息</span>
      <button class="toggle-btn" @click="viewerStore.toggleInfoPanel">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path v-if="viewerStore.infoPanelCollapsed" d="M4 2l6 5-6 5" stroke="currentColor" stroke-width="2" fill="none" />
          <path v-else d="M10 2l-6 5 6 5" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </button>
    </div>

    <div v-if="!viewerStore.infoPanelCollapsed && currentScene" class="info-panel-body">
      <h3 class="scene-title">{{ currentScene.name }}</h3>
      <p v-if="currentScene.description" class="scene-desc">{{ currentScene.description }}</p>

      <div v-if="hasMetadata" class="metadata">
        <div v-for="(value, key) in currentScene.metadata" :key="key" class="meta-item">
          <span class="meta-key">{{ key }}</span>
          <span class="meta-value">{{ value }}</span>
        </div>
      </div>

      <div class="scene-stats">
        <div class="stat-item">
          <span class="stat-label">热点数</span>
          <span class="stat-value">{{ currentScene.hotspots.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">视角</span>
          <span class="stat-value">{{ currentScene.hfov }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useViewerStore } from '@/stores/viewer'

const sceneStore = useSceneStore()
const viewerStore = useViewerStore()

const currentScene = computed(() => sceneStore.currentScene)

const hasMetadata = computed(() => {
  const meta = currentScene.value?.metadata
  return meta && Object.keys(meta).length > 0
})
</script>

<style scoped>
.info-panel {
  position: absolute;
  bottom: 80px;
  right: 12px;
  width: var(--info-panel-width);
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 50;
  transition: width var(--transition-normal);
}

.info-panel.collapsed {
  width: 40px;
}

.info-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.info-panel-header span {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.collapsed .info-panel-header span {
  display: none;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.toggle-btn:hover {
  color: var(--accent);
}

.info-panel-body {
  padding: 12px;
}

.scene-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.scene-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.metadata {
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

.meta-key {
  font-size: 12px;
  color: var(--text-muted);
}

.meta-value {
  font-size: 12px;
  color: var(--text-primary);
}

.scene-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}
</style>

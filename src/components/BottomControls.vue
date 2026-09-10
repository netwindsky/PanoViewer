<template>
  <div class="bottom-controls">
    <div class="controls-group">
      <button
        class="ctrl-btn"
        :class="{ active: sceneStore.currentSceneId !== scenes[0]?.id }"
        @click="prevScene"
        title="上一个场景"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M11 4l-5 5 5 5" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: viewerStore.mode === 'panorama' }"
        @click="viewerStore.setMode('panorama')"
        title="全景模式"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5" fill="none" />
          <path d="M2 9h14M9 2a12 12 0 014 7 12 12 0 01-4 7 12 12 0 01-4-7 12 12 0 014-7z" stroke="currentColor" stroke-width="1" fill="none" />
        </svg>
        <span>全景</span>
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: viewerStore.mode === 'flight' }"
        @click="viewerStore.setMode('flight')"
        title="飞行模式"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M9 2l2 5h5l-4 3 1.5 5L9 12 4.5 15 6 10 2 7h5z" stroke="currentColor" stroke-width="1" fill="none" />
        </svg>
        <span>飞行</span>
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: viewerStore.isAutoRotate }"
        @click="viewerStore.toggleAutoRotate"
        title="自动旋转"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M9 3a6 6 0 016 6h-2a4 4 0 00-4-4V3z" fill="currentColor" />
          <path d="M15 9a6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
        <span>旋转</span>
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: viewerStore.isAutoTour }"
        @click="viewerStore.toggleAutoTour"
        title="自动漫游"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M3 9h12M13 6l3 3-3 3" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
        <span>漫游</span>
      </button>

      <button class="ctrl-btn" @click="handleVR" title="VR模式">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="1" y="5" width="16" height="8" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
          <circle cx="6" cy="9" r="2" stroke="currentColor" stroke-width="1" fill="none" />
          <circle cx="12" cy="9" r="2" stroke="currentColor" stroke-width="1" fill="none" />
        </svg>
        <span>VR</span>
      </button>

      <button class="ctrl-btn" @click="handleFullscreen" title="全屏">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M3 3h4v1.5H4.5V7H3V3zm8 0h4v4h-1.5V4.5H11V3zM3 11h1.5v2.5H7V15H3v-4zm11.5 2.5V11H15v4h-4v-1.5h2.5z" fill="currentColor" />
        </svg>
        <span>全屏</span>
      </button>

      <button
        class="ctrl-btn"
        :class="{ active: sceneStore.currentSceneId !== scenes[scenes.length - 1]?.id }"
        @click="nextScene"
        title="下一个场景"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M7 4l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </button>
    </div>
  </div>
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

const scenes = computed(() => projectStore.scenes)

function prevScene() {
  const currentId = sceneStore.currentSceneId
  const idx = scenes.value.findIndex((s) => s.id === currentId)
  if (idx > 0) {
    const prevScene = scenes.value[idx - 1]
    if (prevScene) {
      sceneStore.setCurrentScene(prevScene.id)
    }
  }
}

function nextScene() {
  const currentId = sceneStore.currentSceneId
  const idx = scenes.value.findIndex((s) => s.id === currentId)
  if (idx < scenes.value.length - 1) {
    const next = scenes.value[idx + 1]
    if (next) {
      sceneStore.setCurrentScene(next.id)
    }
  }
}

function handleFullscreen() {
  viewerStore.toggleFullscreen()
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
  if (projectStore.project) {
    reportStats(projectStore.project.id)
  }
}

function handleVR() {
  if (projectStore.project) {
    reportStats(projectStore.project.id)
  }
}
</script>

<style scoped>
.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-controls-height);
  background: var(--bg-overlay);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ctrl-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.ctrl-btn.active {
  color: var(--accent);
  border-color: var(--border-accent);
  background: var(--accent-glow);
}

.ctrl-btn span {
  display: none;
}

@media (min-width: 768px) {
  .ctrl-btn span {
    display: inline;
  }
}
</style>

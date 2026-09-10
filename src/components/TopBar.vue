<template>
  <header class="topbar">
    <div class="topbar-left">
      <div class="logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="var(--accent)" stroke-width="2" />
          <circle cx="14" cy="14" r="5" fill="var(--accent)" />
          <line x1="14" y1="2" x2="14" y2="8" stroke="var(--accent)" stroke-width="1.5" />
          <line x1="14" y1="20" x2="14" y2="26" stroke="var(--accent)" stroke-width="1.5" />
          <line x1="2" y1="14" x2="8" y2="14" stroke="var(--accent)" stroke-width="1.5" />
          <line x1="20" y1="14" x2="26" y2="14" stroke="var(--accent)" stroke-width="1.5" />
        </svg>
      </div>
      <h1 class="project-title">{{ projectName }}</h1>
    </div>

    <div class="topbar-right">
      <a class="topbar-link" href="/editor" target="_blank">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1.5l1 1-8.5 8.5H5v-1l8.5-8.5zM14.5.5a1 1 0 00-1.4 0L4.3 9.3a1 1 0 00-.3.7V12a1 1 0 001 1h2a1 1 0 00.7-.3L15.5 5.9a1 1 0 000-1.4L14.5.5zM2 3h6v1H2v10h10v-4h1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" />
        </svg>
        编辑器
      </a>
      <a class="topbar-link" href="/admin" target="_blank">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a2 2 0 110 4 2 2 0 010-4zm0 5c2.7 0 5 1.3 5 3v2H3v-2c0-1.7 2.3-3 5-3z" />
        </svg>
        管理后台
      </a>
      <button class="share-btn" @click="handleShare">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 6a2 2 0 100-4 2 2 0 000 4zm-8 4a2 2 0 100-4 2 2 0 000 4zm8 4a2 2 0 100-4 2 2 0 000 4zM5.5 8.5l5-2.5m-5 1l5 2.5" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
        分享
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { reportStats } from '@/api/stats'
import { useRoute } from 'vue-router'

const projectStore = useProjectStore()
const route = useRoute()

const projectName = computed(() => projectStore.projectName)

function handleShare() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    alert('链接已复制到剪贴板')
  })
  reportStats(route.params.projectId as string)
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.topbar-link:hover {
  color: var(--accent);
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--bg-primary);
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.share-btn:hover {
  background: var(--accent-hover);
}
</style>

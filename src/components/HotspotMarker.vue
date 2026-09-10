<template>
  <div
    class="hotspot-marker"
    :class="[`type-${hotspot.type}`, `anim-${animation}`]"
    :style="markerStyle"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @click="handleClick"
  >
    <div class="hotspot-icon">
      <svg v-if="hotspot.type === 'scene'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a4 4 0 014 4c0 2-4 8-4 8S6 8 6 6a4 4 0 014-4z" fill="currentColor" />
        <circle cx="10" cy="6" r="1.5" fill="var(--bg-primary)" />
      </svg>
      <svg v-else-if="hotspot.type === 'info'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none" />
        <path d="M10 6v1M10 9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
    </div>

    <Transition name="tooltip">
      <div v-if="showTooltip && (hotspot.tooltip || hotspot.name)" class="hotspot-tooltip">
        {{ hotspot.tooltip || hotspot.name }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Hotspot } from '@/types'
import { useSceneStore } from '@/stores/scene'
import { useProjectStore } from '@/stores/project'
import { reportStats } from '@/api/stats'

const props = defineProps<{
  hotspot: Hotspot
}>()

const sceneStore = useSceneStore()
const projectStore = useProjectStore()
const showTooltip = ref(false)

const animation = computed(() => props.hotspot.style?.animation ?? 'pulse')

const markerStyle = computed(() => {
  const yaw = props.hotspot.yaw
  const pitch = props.hotspot.pitch
  const x = ((yaw + 180) / 360) * 100
  const y = ((90 - pitch) / 180) * 100
  return {
    left: `${Math.max(0, Math.min(100, x))}%`,
    top: `${Math.max(0, Math.min(100, y))}%`,
  }
})

function handleClick() {
  if (props.hotspot.type === 'scene' && props.hotspot.targetSceneId) {
    sceneStore.setCurrentScene(props.hotspot.targetSceneId)
  }

  if (projectStore.project) {
    reportStats(projectStore.project.id)
  }
}
</script>

<style scoped>
.hotspot-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 40;
  cursor: pointer;
}

.hotspot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-dim);
  color: var(--accent);
  transition: transform var(--transition-fast);
}

.hotspot-marker:hover .hotspot-icon {
  transform: scale(1.2);
}

.hotspot-marker.type-scene .hotspot-icon {
  background: rgba(80, 160, 201, 0.3);
  color: #50a0c9;
}

.hotspot-marker.type-info .hotspot-icon {
  background: var(--accent-dim);
  color: var(--accent);
}

/* 脉冲动画 */
.hotspot-marker.anim-pulse .hotspot-icon::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* 弹跳动画 */
.hotspot-marker.anim-bounce .hotspot-icon {
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.hotspot-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  pointer-events: none;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--transition-fast);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>

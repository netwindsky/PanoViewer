<template>
  <div class="postprocessing-bar">
    <div class="pp-control">
      <label>风格</label>
      <select :value="config.style" @change="onStyleChange">
        <option value="">默认</option>
        <option v-for="style in styleOptions" :key="style.id" :value="style.id">
          {{ style.name }}
        </option>
      </select>
    </div>

    <div class="pp-control">
      <label>LUT</label>
      <select :value="config.lut" @change="onLutChange">
        <option value="">无</option>
        <option v-for="lut in lutOptions" :key="lut.id" :value="lut.id">
          {{ lut.name }}
        </option>
      </select>
    </div>

    <div class="pp-control">
      <label>曝光</label>
      <input
        type="range"
        min="0.2"
        max="3"
        step="0.1"
        :value="config.exposure"
        @input="onExposureChange"
      />
      <span class="pp-value">{{ config.exposure.toFixed(1) }}</span>
    </div>

    <div class="pp-control">
      <label>对比度</label>
      <input
        type="range"
        min="0.2"
        max="3"
        step="0.1"
        :value="config.contrast"
        @input="onContrastChange"
      />
      <span class="pp-value">{{ config.contrast.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useViewerStore } from '@/stores/viewer'
import { useSceneStore } from '@/stores/scene'
import { usePostProcessing } from '@/composables/usePostProcessing'
import type { LutOption, StyleOption } from '@/types'

const viewerStore = useViewerStore()
const sceneStore = useSceneStore()

const currentSceneId = computed(() => sceneStore.currentSceneId)
const { config, lutOptions, styleOptions, applyStyle, applyLut, updateExposure, updateContrast } =
  usePostProcessing(currentSceneId)

function onStyleChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  applyStyle(value)
}

function onLutChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  applyLut(value)
}

function onExposureChange(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  updateExposure(value)
}

function onContrastChange(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  updateContrast(value)
}
</script>

<style scoped>
.postprocessing-bar {
  position: absolute;
  bottom: var(--bottom-controls-height);
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 8px 16px;
  background: var(--bg-overlay);
  border-top: 1px solid var(--border);
  z-index: 55;
}

.pp-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pp-control label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.pp-control select {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.pp-control select:focus {
  border-color: var(--border-accent);
}

.pp-control input[type='range'] {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: 2px;
  outline: none;
}

.pp-control input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

.pp-value {
  font-size: 11px;
  color: var(--accent);
  min-width: 28px;
  text-align: right;
}

@media (max-width: 768px) {
  .postprocessing-bar {
    gap: 10px;
    padding: 6px 10px;
    overflow-x: auto;
  }

  .pp-control input[type='range'] {
    width: 60px;
  }
}
</style>

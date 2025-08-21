<template>
  <div class="locker-canvas-wrapper">
    <svg
      ref="svgCanvas"
      class="locker-canvas"
      :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
      @click="handleCanvasClick"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
      @wheel.prevent="handleZoom"
    >
      <!-- 그리드 배경 -->
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- 구역 표시 -->
      <g v-for="zone in zones" :key="zone.id">
        <rect
          :x="zone.x"
          :y="zone.y"
          :width="zone.width"
          :height="zone.height"
          :fill="zone.color || '#f8fafc'"
          stroke="#cbd5e1"
          stroke-width="1"
          stroke-dasharray="5,5"
          opacity="0.5"
        />
        <text
          :x="zone.x + 10"
          :y="zone.y + 20"
          font-size="14"
          font-weight="600"
          fill="#64748b"
        >
          {{ zone.name }}
        </text>
      </g>
      
      <!-- 락커들 -->
      <LockerSVG
        v-for="locker in visibleLockers"
        :key="locker.id"
        :locker="locker"
        :is-selected="locker.id === selectedLockerId"
        :view-mode="viewMode"
        :has-error="locker.hasError"
        @click="selectLocker(locker.id)"
      />
      
      <!-- 드래그 중인 새 락커 미리보기 -->
      <rect
        v-if="isDraggingNewLocker"
        :x="newLockerPosition.x"
        :y="newLockerPosition.y"
        :width="newLockerSize.width"
        :height="newLockerSize.height"
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3b82f6"
        stroke-width="2"
        stroke-dasharray="5,5"
      />
    </svg>
    
    <!-- 줌 컨트롤 -->
    <div class="zoom-controls">
      <button @click="zoomIn" class="zoom-btn">+</button>
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      <button @click="zoomOut" class="zoom-btn">-</button>
      <button @click="resetZoom" class="zoom-btn">⟲</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLockerStore } from '@/stores/lockerStore'
import LockerSVG from './LockerSVG.vue'

const props = defineProps<{
  viewMode: 'floor' | 'front'
}>()

const lockerStore = useLockerStore()

// Canvas 설정
const canvasWidth = ref(1050)  // 150px 감소
const canvasHeight = ref(490)  // 프로젝트 표준에 맞춤
const svgCanvas = ref<SVGSVGElement>()

// 줌 & 팬 상태
const zoomLevel = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

// 새 락커 추가 상태
const isDraggingNewLocker = ref(false)
const newLockerPosition = ref({ x: 0, y: 0 })
const newLockerSize = ref({ width: 60, height: 80 })

// Computed
const visibleLockers = computed(() => {
  if (props.viewMode === 'floor') {
    return lockerStore.currentFloorLockers
  }
  return lockerStore.lockers
})

const zones = computed(() => lockerStore.zones)
const selectedLockerId = computed(() => lockerStore.selectedLockerId)

// Methods
const selectLocker = (id: string) => {
  lockerStore.selectLocker(id)
}

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === svgCanvas.value || (event.target as Element).id === 'grid') {
    lockerStore.selectLocker(null)
  }
}

const startPan = (event: MouseEvent) => {
  if (event.shiftKey) {
    isPanning.value = true
    panStart.value = {
      x: event.clientX - panOffset.value.x,
      y: event.clientY - panOffset.value.y
    }
  }
}

const pan = (event: MouseEvent) => {
  if (isPanning.value) {
    panOffset.value = {
      x: event.clientX - panStart.value.x,
      y: event.clientY - panStart.value.y
    }
  }
}

const endPan = () => {
  isPanning.value = false
}

const handleZoom = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  zoomLevel.value = Math.max(0.5, Math.min(3, zoomLevel.value * delta))
}

const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value * 1.2)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value * 0.8)
}

const resetZoom = () => {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
}

// 초기화
onMounted(() => {
  // Component initialization
  // Data should be loaded by parent component from database
})
</script>

<style scoped>
.locker-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: white;
  border-radius: 8px;
}

.locker-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.locker-canvas:active {
  cursor: grabbing;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  align-items: center;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: var(--surface-color);
}

.zoom-level {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  min-width: 50px;
  text-align: center;
}
</style>
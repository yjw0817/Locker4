<template>
  <g
    :data-locker-id="locker.id"
    :transform="`translate(${locker.x}, ${locker.y}) rotate(${locker.rotation || 0}, ${logicalDimensions.width/2}, ${logicalDimensions.height/2})`"
    @click.stop="handleClick"
    @mousedown.prevent="handleMouseDown"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    class="locker-svg"
    :class="{ 
      'locker-selected': isSelected,
      'locker-hovered': isHovered,
      'locker-dragging': isDragging
    }"
    style="cursor: move;"
  >
    <!-- 선택 상태 하이라이트 -->
    <rect 
      v-if="isSelected || isMultiSelected"
      :x="-5"
      :y="-5"
      :width="logicalDimensions.width + 10"
      :height="logicalDimensions.height + 10"
      fill="none"
      stroke="#0768AE"
      stroke-width="2"
      stroke-dasharray="5,5"
      class="selection-outline"
    >
      <animate 
        attributeName="stroke-dashoffset" 
        values="0;10" 
        dur="0.5s" 
        repeatCount="indefinite"
      />
    </rect>
    
    <!-- 락커 본체 (독립적인 경계선) -->
    <rect
      :x="1"
      :y="1"
      :width="logicalDimensions.width - 2"
      :height="logicalDimensions.height - 2"
      :fill="lockerFill"
      :stroke="lockerStroke"
      :stroke-width="strokeWidth"
      :rx="cornerRadius"
      :ry="cornerRadius"
      shape-rendering="crispEdges"
    />
    
    <!-- 전면 표시선 (하단) - 피그마 디자인 준수 - floor view에서만 표시 -->
    <line
      v-if="viewMode === 'floor'"
      :x1="6"
      :y1="logicalDimensions.height - 6"
      :x2="logicalDimensions.width - 6"
      :y2="logicalDimensions.height - 6"
      :stroke="lockerStroke"
      stroke-width="2"
      opacity="0.8"
      class="front-indicator"
    />
    
    <!-- 락커 번호 -->
    <text
      v-if="showNumber !== false && getDisplayNumber()"
      :x="logicalDimensions.width / 2"
      :y="logicalDimensions.height / 2"
      text-anchor="middle"
      dominant-baseline="middle"
      :font-size="fontSize"
      :fill="textColor"
      font-weight="600"
      class="locker-number"
      style="user-select: none; pointer-events: none;"
    >
      {{ getDisplayNumber() }}
    </text>
    
    <!-- 회전 핸들 (선택 시만 표시) -->
    <g v-if="isSelected && showRotateHandle">
      <line
        :x1="logicalDimensions.width / 2"
        :y1="0"
        :x2="logicalDimensions.width / 2"
        :y2="-20"
        stroke="#0768AE"
        stroke-width="1"
      />
      <circle
        :cx="logicalDimensions.width / 2"
        :cy="-20"
        r="5"
        fill="#0768AE"
        style="cursor: grab;"
        @mousedown.stop="handleRotateStart"
      />
    </g>
    
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Locker } from '@/stores/lockerStore'

const props = defineProps<{
  locker: Locker
  isSelected: boolean
  isMultiSelected?: boolean
  isDragging?: boolean
  viewMode?: 'floor' | 'front'
  showNumber?: boolean
  showRotateHandle?: boolean
  hasError?: boolean
}>()

const emit = defineEmits<{
  click: [locker: Locker, event: MouseEvent]
  select: [id: string]
  dragstart: [locker: Locker, event: MouseEvent]
  rotatestart: [locker: Locker, event: MouseEvent]
}>()

const isHovered = ref(false)

// Visual scale for lockers only (canvas stays original, lockers get bigger)
const LOCKER_VISUAL_SCALE = 2.0

// Note: Display scaling is handled by the parent SVG viewBox/size
// All dimensions here are in logical units
// Logical dimensions (all coordinates in SVG are logical)
const logicalDimensions = computed(() => {
  // ✅ CRITICAL FIX: Add defensive programming with fallbacks for all values
  if (!props.locker) {
    console.warn('[LockerSVG] props.locker is undefined, using defaults')
    return { width: 40 * LOCKER_VISUAL_SCALE, height: 40 * LOCKER_VISUAL_SCALE }
  }
  
  const width = (props.locker.width || 40) * LOCKER_VISUAL_SCALE
  const depth = (props.locker.depth || 40) * LOCKER_VISUAL_SCALE
  const height = (props.locker.height || 40) * LOCKER_VISUAL_SCALE
  const actualHeight = (props.locker.actualHeight || 40) * LOCKER_VISUAL_SCALE
  
  if (props.viewMode === 'floor') {
    // Floor view: Width x Depth (both 2x scaled)
    return {
      width,
      height: depth || height || width
    }
  } else {
    // Front view: Width x Height (both 2x scaled)
    const frontHeight = height || actualHeight || (60 * LOCKER_VISUAL_SCALE)
    console.log(`[LockerSVG] ${props.locker.number || 'UNKNOWN'} dimensions in front view (2x scale):`, {
      width,
      height: frontHeight,
      actualHeight,
      scale: LOCKER_VISUAL_SCALE,
      EXPECTED: props.locker.number === 'L3' || props.locker.number === 'L4' ? '162px (90*1.8)' : '54px (30*1.8)',
      IS_CORRECT: frontHeight === (props.locker.number === 'L3' || props.locker.number === 'L4' ? 162 : 54) ? '✅ CORRECT' : '❌ WRONG'
    })
    return {
      width,
      height: frontHeight
    }
  }
})

// 모서리 라운드 값 - 세로배치 모드에서 더 둥글게 (스케일 적용)
const cornerRadius = computed(() => {
  // front view (세로배치)일 때 더 둥글게
  if (props.viewMode === 'front') {
    return 6 * LOCKER_VISUAL_SCALE // 더 둥근 모서리 (2x 스케일)
  }
  return 2 * LOCKER_VISUAL_SCALE // 평면배치일 때는 약간만 둥글게 (2x 스케일)
})

const lockerFill = computed(() => {
  // 에러가 있는 락커는 빨간색 배경
  if (props.hasError || props.locker.hasError) return '#fee2e2'
  if (isHovered.value) return '#F0F8FF'
  if (props.isSelected) return '#E6F4FF'
  
  // Apply locker type color if available
  if (props.locker.color) {
    // Use color with low opacity for fill
    return props.locker.color + '20' // 20 is hex for ~12% opacity
  }
  
  switch (props.locker.status) {
    case 'available': return '#FFFFFF'
    case 'occupied': return '#FFF7ED'
    case 'expired': return '#FEF2F2'
    case 'maintenance': return '#F9FAFB'
    default: return '#FFFFFF'
  }
})

const lockerStroke = computed(() => {
  // 에러가 있는 락커는 빨간색 테두리
  if (props.hasError || props.locker.hasError) return '#ef4444'
  if (props.isSelected) return '#0768AE'
  if (props.isMultiSelected) return '#0768AE'  // Also blue for multi-selected
  if (isHovered.value) {
    // Use locker type color for hover if available
    return props.locker.color || '#374151'
  }
  
  // Apply locker type color if available
  if (props.locker.color) {
    return props.locker.color
  }
  
  switch (props.locker.status) {
    case 'available': return '#D1D5DB'
    case 'occupied': return '#FB923C'
    case 'expired': return '#EF4444'
    case 'maintenance': return '#6B7280'
    default: return '#D1D5DB'
  }
})

const strokeWidth = computed(() => {
  // 에러가 있는 락커는 두꺼운 테두리 (스케일 적용)
  if (props.hasError || props.locker.hasError) return 2 * LOCKER_VISUAL_SCALE
  if (props.isSelected) return 2 * LOCKER_VISUAL_SCALE
  if (props.isMultiSelected) return 1.5 * LOCKER_VISUAL_SCALE  // Slightly thinner for multi-selected
  if (isHovered.value) return 1 * LOCKER_VISUAL_SCALE
  return 0.5 * LOCKER_VISUAL_SCALE  // Thinner default border
})

const fontSize = computed(() => {
  // 폰트 크기도 락커 스케일에 비례 (2x 확대)
  return 12 * LOCKER_VISUAL_SCALE
})

const textColor = computed(() => {
  switch (props.locker.status) {
    case 'available': return '#374151'
    case 'occupied': return '#92400E'
    case 'expired': return '#991B1B'
    case 'maintenance': return '#374151'
    default: return '#374151'
  }
})

// Get the appropriate number to display based on view mode
const getDisplayNumber = () => {
  // ✅ Defensive programming: Handle undefined props.locker
  if (!props.locker) return ''
  
  if (props.viewMode === 'floor') {
    // In floor view, show the zone management number (only for parent lockers)
    return !props.locker.parentLockerId ? (props.locker.number || '') : ''
  } else {
    // In front view, show the assignment number or fallback to regular number
    // frontViewNumber가 없으면 일반 number를 표시
    return props.locker.frontViewNumber || props.locker.number || ''
  }
}

const handleClick = (e: MouseEvent) => {
  e.stopPropagation()
  emit('click', props.locker, e)
  emit('select', props.locker.id)
  console.log('Locker clicked:', props.locker.id, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey)
}

const handleMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  emit('dragstart', props.locker, e)
}

const handleRotateStart = (e: MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
  emit('rotatestart', props.locker, e)
}
</script>

<style scoped>
.locker-svg {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.locker-number {
  font-weight: 600;
  pointer-events: none;
  user-select: none;
}

.locker-hovered {
  filter: brightness(1.05);
}

.locker-selected {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.locker-dragging {
  opacity: 0.7;
}

.selection-outline {
  stroke: #3b82f6;
  stroke-width: 3;
  stroke-dasharray: 8 4; /* 8px 선, 4px 공백 = 총 12px */
  animation: dash-rotate 0.5s linear infinite;
}

@keyframes dash-rotate {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 12; /* dasharray 합계와 동일 */
  }
}
</style>
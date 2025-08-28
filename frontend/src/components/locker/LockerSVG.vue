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
    <!-- 애니메이션 그룹 (자식 락커용) -->
    <g :class="{ 'child-locker-content': shouldAnimateChildLocker }">
      <!-- 선택 상태 하이라이트 -->
      <path 
        v-if="(isSelected || isMultiSelected) && !shouldHideIndividualOutline"
        :d="selectionOutlinePath"
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
      </path>
      
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
      :opacity="isRotating ? 0.8 : 1"
      :style="{ transition: 'opacity 0.2s ease' }"
    />
    
    <!-- 전면 표시선 (하단) - 피그마 디자인 준수 - floor view에서만 표시 -->
    <line
      v-if="viewMode === 'floor'"
      :x1="10"
      :y1="logicalDimensions.height - 4"
      :x2="logicalDimensions.width - 10"
      :y2="logicalDimensions.height - 4"
      :stroke="lockerStroke"
      stroke-width="4"
      opacity="0.9"
      stroke-linecap="square"
      class="front-indicator"
    />
    
    <!-- 락커 번호 -->
    <text
      v-if="showNumber !== false && getDisplayNumber()"
      :x="logicalDimensions.width / 2"
      :y="textYPosition"
      text-anchor="middle"
      :dominant-baseline="textBaseline"
      :font-size="fontSize"
      :fill="textColor"
      font-weight="600"
      class="locker-number"
      style="user-select: none; pointer-events: none;"
    >
      {{ getDisplayNumber() }}
    </text>
    
    <!-- 회전 핸들 (선택 시만 표시) -->
    <g v-if="isSelected && showRotateHandle" class="rotation-handle">
      <line
        :x1="logicalDimensions.width / 2"
        :y1="0"
        :x2="logicalDimensions.width / 2"
        :y2="-25"
        stroke="#0768AE"
        stroke-width="2"
        opacity="0.8"
      />
      <circle
        :cx="logicalDimensions.width / 2"
        :cy="-25"
        r="8"
        fill="#0768AE"
        stroke="#ffffff"
        stroke-width="2"
        :style="{ cursor: isRotating ? 'grabbing' : 'grab' }"
        @mousedown.stop="handleRotateStart"
      />
      
      <!-- 회전 중 각도 표시 -->
      <g v-if="isRotating">
        <!-- 각도 표시 배경 -->
        <rect
          :x="logicalDimensions.width / 2 - 25"
          :y="-50"
          width="50"
          height="20"
          rx="10"
          fill="white"
          stroke="#0768AE"
          stroke-width="1"
          opacity="0.95"
        />
        <text
          :x="logicalDimensions.width / 2"
          :y="-36"
          text-anchor="middle"
          font-size="12"
          fill="#0768AE"
          font-weight="600"
        >
          {{ Math.round(((locker.rotation || 0) % 360 + 360) % 360) }}°
        </text>
        
        <!-- 스냅 인디케이터 (주요 각도에서 표시) -->
        <circle
          v-if="isSnapped"
          :cx="logicalDimensions.width / 2"
          :cy="-25"
          r="10"
          fill="none"
          stroke="#10b981"
          stroke-width="2"
          opacity="0.8"
        >
          <animate
            attributeName="r"
            values="8;12;8"
            dur="0.3s"
            begin="0s"
          />
        </circle>
      </g>
    </g>
    </g> <!-- 애니메이션 그룹 닫기 -->
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
  shouldHideIndividualOutline?: boolean  // 개별 외곽선 숨김 여부
  adjacentSides?: string[]  // 인접한 면 정보 ['top', 'bottom', 'left', 'right']
}>()

const emit = defineEmits<{
  click: [locker: Locker, event: MouseEvent]
  select: [id: string]
  dragstart: [locker: Locker, event: MouseEvent]
  rotatestart: [locker: Locker, event: MouseEvent]
  rotate: [id: string, angle: number]
  rotateend: [id: string]
}>()

const isHovered = ref(false)
const isRotating = ref(false)
const rotationStartAngle = ref(0)
const rotationStartMouseAngle = ref(0)
const isSnapped = ref(false)
const cumulativeRotation = ref(0) // 누적 회전 추적

// Visual scale for lockers only (canvas stays original, lockers get bigger)
const LOCKER_VISUAL_SCALE = 2.0

// Note: Display scaling is handled by the parent SVG viewBox/size
// All dimensions here are in logical units
// Logical dimensions (all coordinates in SVG are logical)
// 선택 외곽선 경로 계산 (인접한 변 제외)
const selectionOutlinePath = computed(() => {
  const x = -5
  const y = -5
  const width = logicalDimensions.value.width + 10
  const height = logicalDimensions.value.height + 10
  
  // 드래그 중이고 인접한 면이 있으면 그 면은 그리지 않음
  if (props.isDragging && props.adjacentSides && props.adjacentSides.length > 0) {
    const segments = []
    const corners = {
      topLeft: `${x},${y}`,
      topRight: `${x + width},${y}`,
      bottomRight: `${x + width},${y + height}`,
      bottomLeft: `${x},${y + height}`
    }
    
    // 각 변을 체크하여 그릴지 결정
    if (!props.adjacentSides.includes('top')) {
      segments.push(`M ${corners.topLeft} L ${corners.topRight}`)
    }
    if (!props.adjacentSides.includes('right')) {
      segments.push(`M ${corners.topRight} L ${corners.bottomRight}`)
    }
    if (!props.adjacentSides.includes('bottom')) {
      segments.push(`M ${corners.bottomRight} L ${corners.bottomLeft}`)
    }
    if (!props.adjacentSides.includes('left')) {
      segments.push(`M ${corners.bottomLeft} L ${corners.topLeft}`)
    }
    
    return segments.join(' ')
  }
  
  // 기본 사각형 경로
  return `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`
})

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
    // Dimension logging removed
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
  
  // Get base color based on locker type or status
  let baseColor = '#FFFFFF'
  
  if (props.locker.color) {
    // Use locker type color with opacity
    baseColor = props.locker.color + '20' // 20 is hex for ~12% opacity
  } else {
    // Use status-based colors
    switch (props.locker.status) {
      case 'available': baseColor = '#FFFFFF'; break
      case 'occupied': baseColor = '#FFF7ED'; break
      case 'expired': baseColor = '#FEF2F2'; break
      case 'maintenance': baseColor = '#F9FAFB'; break
      default: baseColor = '#FFFFFF'
    }
  }
  
  // Apply hover/selection effects while preserving base color
  if (props.isSelected) {
    // For selection, slightly lighten the base color or add blue tint
    if (props.locker.color) {
      // Keep the locker color but increase opacity slightly
      return props.locker.color + '30' // Slightly more opaque when selected
    }
    // For status-based colors, add a slight blue tint
    return baseColor === '#FFFFFF' ? '#E6F4FF' : baseColor
  }
  
  if (isHovered.value) {
    // For hover, similar approach
    if (props.locker.color) {
      return props.locker.color + '25' // Slightly more opaque when hovered
    }
    return baseColor === '#FFFFFF' ? '#F0F8FF' : baseColor
  }
  
  return baseColor
})

const lockerStroke = computed(() => {
  // 에러가 있는 락커는 빨간색 테두리
  if (props.hasError || props.locker.hasError) return '#ef4444'
  
  // Get base stroke color
  let baseStroke = '#D1D5DB'
  
  if (props.locker.color) {
    baseStroke = props.locker.color
  } else {
    switch (props.locker.status) {
      case 'available': baseStroke = '#D1D5DB'; break
      case 'occupied': baseStroke = '#FB923C'; break
      case 'expired': baseStroke = '#EF4444'; break
      case 'maintenance': baseStroke = '#6B7280'; break
      default: baseStroke = '#D1D5DB'
    }
  }
  
  // Selection takes priority but keeps the color scheme
  if (props.isSelected || props.isMultiSelected) {
    // Keep the locker's original color for stroke when selected
    // This maintains visual consistency with the locker type
    return baseStroke
  }
  
  if (isHovered.value) {
    // Use locker type color for hover if available
    return props.locker.color || baseStroke
  }
  
  return baseStroke
})

const strokeWidth = computed(() => {
  // 에러가 있는 락커는 두꺼운 테두리 (스케일 적용)
  if (props.hasError || props.locker.hasError) return 2 * LOCKER_VISUAL_SCALE
  // 선택된 경우에도 원래 테두리 두께 유지 (선택 표시는 별도 점선으로)
  if (props.isSelected || props.isMultiSelected) return 1 * LOCKER_VISUAL_SCALE
  if (isHovered.value) return 1 * LOCKER_VISUAL_SCALE
  return 0.5 * LOCKER_VISUAL_SCALE  // Thinner default border
})

const fontSize = computed(() => {
  // 세로배치 모드에서는 더 작은 폰트 사용
  if (props.viewMode === 'front') {
    return 6 * LOCKER_VISUAL_SCALE  // 더 작은 폰트 크기 (6px)
  }
  // 평면배치 모드에서도 약간 작은 크기
  return 10 * LOCKER_VISUAL_SCALE  // 기존 12px에서 10px로 축소
})

// 텍스트 Y 위치 계산 (세로배치 모드에서는 하단)
const textYPosition = computed(() => {
  if (props.viewMode === 'front') {
    // 세로배치 모드: 하단에 위치 (하단에서 5px 패딩)
    return logicalDimensions.value.height - (5 * LOCKER_VISUAL_SCALE)
  }
  // 평면배치 모드: 중앙에 위치
  return logicalDimensions.value.height / 2
})

// 텍스트 정렬 기준선
const textBaseline = computed(() => {
  if (props.viewMode === 'front') {
    // 세로배치 모드: 하단 정렬을 middle로 변경 (text-after-edge가 올바르게 작동하지 않음)
    return 'middle'
  }
  // 평면배치 모드: 중앙 정렬
  return 'middle'
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

// 자식 락커 애니메이션 여부
const shouldAnimateChildLocker = computed(() => {
  // 세로 모드이고, 자식 락커이며, 초기 렌더링 시에만 애니메이션
  return props.viewMode === 'front' && 
         props.locker.tierLevel && 
         props.locker.tierLevel > 0
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

// 마우스 각도 계산 (락커 중심 기준)
const calculateMouseAngle = (event: MouseEvent, centerX: number, centerY: number) => {
  const deltaX = event.clientX - centerX
  const deltaY = event.clientY - centerY
  // atan2를 사용하여 각도 계산 (라디안 → 도)
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90 // +90 to align with top as 0°
  // 0-360 범위로 정규화
  if (angle < 0) angle += 360
  return angle
}

// 각도 차이 계산 (최단 경로, 더 안정적인 버전)
const getAngleDifference = (angle1: number, angle2: number) => {
  // 두 각도를 0-360 범위로 정규화
  const norm1 = ((angle1 % 360) + 360) % 360
  const norm2 = ((angle2 % 360) + 360) % 360
  
  let diff = norm2 - norm1
  
  // 최단 경로 찾기 (-180 ~ 180)
  if (diff > 180) {
    diff -= 360
  } else if (diff < -180) {
    diff += 360
  }
  
  return diff
}

// 회전 시작 핸들러
const handleRotateStart = (e: MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
  
  isRotating.value = true
  
  // 현재 회전각 저장 (누적 회전 값 사용)
  rotationStartAngle.value = props.locker.rotation || 0
  cumulativeRotation.value = props.locker.rotation || 0
  
  // SVG 요소의 중심점 계산
  const svgElement = (e.currentTarget as SVGElement).closest('g[data-locker-id]')
  if (!svgElement) return
  
  const rect = svgElement.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  // 마우스 시작 각도 저장
  rotationStartMouseAngle.value = calculateMouseAngle(e, centerX, centerY)
  
  let lastMouseAngle = rotationStartMouseAngle.value
  
  // 전역 이벤트 리스너 등록
  const handleRotateMove = (event: MouseEvent) => {
    if (!isRotating.value) return
    
    const currentMouseAngle = calculateMouseAngle(event, centerX, centerY)
    
    // 최단 경로 각도 차이 계산
    const angleDelta = getAngleDifference(lastMouseAngle, currentMouseAngle)
    lastMouseAngle = currentMouseAngle
    
    // 누적 회전에 델타 추가
    cumulativeRotation.value += angleDelta
    let newRotation = cumulativeRotation.value
    
    // Shift 키: 15도 단위로 제한
    if (event.shiftKey) {
      newRotation = Math.round(newRotation / 15) * 15
      isSnapped.value = true // 15도 단위로 제한될 때도 스냅 표시
    }
    // Alt 키가 없을 때만 스냅 기능
    else if (!event.altKey) {
      // 스냅 기능 (8도 범위 내에서 주요 각도로 스냅) - 더 잘 붙도록 범위 증가
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315]
      const snapTolerance = 8
      
      isSnapped.value = false
      // 간단하고 안정적인 스냅 로직
      const normalizedAngle = ((newRotation % 360) + 360) % 360
      
      for (const snapAngle of snapAngles) {
        const diff = Math.abs(normalizedAngle - snapAngle)
        
        if (diff < snapTolerance || (snapAngle === 0 && Math.abs(normalizedAngle - 360) < snapTolerance)) {
          // 현재 회전 수를 유지하면서 스냅
          const fullRotations = Math.floor(newRotation / 360)
          
          // 0도 근처에서 특별 처리
          if (snapAngle === 0) {
            if (normalizedAngle > 180) {
              // 270도 이상에서 0도로 접근 - 다음 회전의 0도(360도)로
              newRotation = (fullRotations + 1) * 360
            } else {
              // 90도 이하에서 0도로 접근 - 현재 회전의 0도로
              newRotation = fullRotations * 360
            }
          } else {
            newRotation = fullRotations * 360 + snapAngle
          }
          
          isSnapped.value = true
          break
        }
      }
    } else {
      isSnapped.value = false
    }
    
    // 360도 처리: 누적 회전 방식 사용 (정규화하지 않음)
    // 이렇게 하면 360도를 넘어가도 역회전 없이 계속 회전
    
    emit('rotate', props.locker.id, newRotation)
  }
  
  const handleRotateEnd = () => {
    if (!isRotating.value) return
    
    isRotating.value = false
    isSnapped.value = false
    
    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleRotateMove)
    document.removeEventListener('mouseup', handleRotateEnd)
    
    emit('rotateend', props.locker.id)
  }
  
  document.addEventListener('mousemove', handleRotateMove)
  document.addEventListener('mouseup', handleRotateEnd)
  
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

.rotation-handle {
  transition: opacity 0.2s ease;
}

.rotation-handle:hover {
  opacity: 1;
}

.rotation-handle circle {
  transition: transform 0.2s ease, fill 0.2s ease;
}

.rotation-handle circle:hover {
  transform: scale(1.2);
  fill: #0556a3;
}

@keyframes dash-rotate {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 12; /* dasharray 합계와 동일 */
  }
}

/* 자식 락커 슬라이드 애니메이션 */
.child-locker-content {
  animation: slideUpFromBottom 0.3s ease-out forwards;
  transform-origin: center center;
}

@keyframes slideUpFromBottom {
  from {
    opacity: 0;
    transform: translateY(20);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
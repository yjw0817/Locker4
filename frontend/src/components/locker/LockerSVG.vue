<template>
  <g
    :data-locker-id="locker.id"
    :transform="`translate(${displayX}, ${displayY}) rotate(${locker.rotation || 0}, ${logicalDimensions.width/2}, ${logicalDimensions.height/2})`"
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
    <g :class="{ 
      'child-locker-content': shouldAnimateChildLocker,
      'child-locker-fade-out': shouldFadeOutChildLocker
    }">
      <!-- 선택 상태 하이라이트 -->
      <path 
        v-if="(isSelected || isMultiSelected) && !shouldHideIndividualOutline && !isDragging"
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
      :x="viewMode === 'front' ? 0 : 1"
      :y="viewMode === 'front' ? 0 : 1"
      :width="viewMode === 'front' ? logicalDimensions.width : logicalDimensions.width - 2"
      :height="viewMode === 'front' ? logicalDimensions.height : logicalDimensions.height - 2"
      :fill="lockerFill"
      :stroke="lockerStroke"
      :stroke-width="strokeWidth"
      :rx="cornerRadius"
      :ry="cornerRadius"
      shape-rendering="crispEdges"
      :opacity="isRotating ? 0.8 : 1"
      :style="{ transition: 'opacity 0.2s ease' }"
    />
    
    <!-- LockerPlacement 평면배치 - 락커 안 문 방향 표시선 -->
    <line
      v-if="viewMode === 'floor' && !isManagementPage"
      :x1="10"
      :x2="logicalDimensions.width - 10"
      :y1="logicalDimensions.height - 4"
      :y2="logicalDimensions.height - 4"
      :stroke="locker.color || '#1e40af'"
      stroke-width="4"
      opacity="0.9"
      stroke-linecap="square"
      shape-rendering="crispEdges"
    />
    
    <!-- LockerManagement 평면배치 - 바닥선 점선 -->
    <line
      v-if="viewMode === 'floor' && isManagementPage"
      :x1="1"
      :x2="logicalDimensions.width - 1"
      :y1="logicalDimensions.height + 3"
      :y2="logicalDimensions.height + 3"
      :stroke="lockerStroke"
      stroke-width="1.5"
      stroke-dasharray="3,3"
      shape-rendering="crispEdges"
    />
    
    <!-- LockerManagement 평면배치모드에서 툴팁 기능 -->
    <g v-if="props.isManagementPage && viewMode === 'floor'">
      <!-- 자식 락커가 있는 경우 - 분할된 섹션 표시 -->
      <template v-if="props.childLockers && props.childLockers.length > 0">
        <!-- 모든 락커에 가로 분할선 표시 (회전 상태와 무관하게) -->
        <line
          v-for="(child, index) in props.childLockers"
          :key="`divider-${child.id}`"
          :x1="1"
          :x2="logicalDimensions.width - 1"
          :y1="getDividerY(index)"
          :y2="getDividerY(index)"
          stroke="#6b7280"
          stroke-width="0.5"
          opacity="0.8"
        />
        
        <!-- 자식 락커 섹션 hover 영역 -->
        <rect
          v-for="(child, index) in props.childLockers"
          :key="`section-${child.id}`"
          :x="1"
          :y="getSectionY(index)"
          :width="logicalDimensions.width - 2"
          :height="getSectionHeight()"
          fill="transparent"
          class="section-hover"
          :class="{ 'section-hovered': hoveredSection === `child-${index}` }"
          @mouseenter="(e) => { hoveredSection = `child-${index}`; startTooltipTimer(`child-${index}`, child, e) }"
          @mousemove="(e) => { updateMousePosition(e); updateTooltipPosition() }"
          @mouseleave="hoveredSection = null; clearTooltipTimer()"
          style="cursor: pointer;"
        />
        
        <!-- 부모 락커 섹션 hover 영역 -->
        <rect
          :x="1"
          :y="getSectionY(props.childLockers.length)"
          :width="logicalDimensions.width - 2"
          :height="getSectionHeight()"
          fill="transparent"
          class="section-hover"
          :class="{ 'section-hovered': hoveredSection === 'parent' }"
          @mouseenter="(e) => { hoveredSection = 'parent'; startTooltipTimer('parent', props.locker, e) }"
          @mousemove="(e) => { updateMousePosition(e); updateTooltipPosition() }"
          @mouseleave="hoveredSection = null; clearTooltipTimer()"
          style="cursor: pointer;"
        />
        
        <!-- 각 섹션의 락커 번호 표시 (좌측) -->
        <text
          v-for="(child, index) in props.childLockers"
          :key="`label-${child.id}`"
          :x="8"
          :y="getSectionCenterY(index) + 1"
          font-size="7"
          fill="#374151"
          font-weight="600"
          text-anchor="start"
          dominant-baseline="middle"
          style="pointer-events: none;"
        >
          {{ getChildDisplayNumber(child) }}
        </text>
        
        <!-- 부모 락커 번호 (마지막 섹션) -->
        <text
          :x="8"
          :y="getSectionCenterY(props.childLockers.length) + 1"
          font-size="7"
          fill="#374151"
          font-weight="600"
          text-anchor="start"
          dominant-baseline="middle"
          style="pointer-events: none;"
        >
          {{ getDisplayNumber() }}
        </text>
      </template>
      
      <!-- 자식 락커가 없는 경우 - 단일 hover 영역 -->
      <template v-else>
        <rect
          :x="1"
          :y="1"
          :width="logicalDimensions.width - 2"
          :height="logicalDimensions.height - 2"
          fill="transparent"
          class="section-hover"
          :class="{ 'section-hovered': hoveredSection === 'single' }"
          @mouseenter="(e) => { hoveredSection = 'single'; startTooltipTimer('single', props.locker, e) }"
          @mousemove="(e) => { updateMousePosition(e); updateTooltipPosition() }"
          @mouseleave="hoveredSection = null; clearTooltipTimer()"
          style="cursor: pointer;"
        />
      </template>
    </g>
    
    <!-- 툴팁 (hover 시 표시) - 회전 상태와 무관하게 항상 수평 표시 -->
    <g v-if="showTooltip && tooltipData" class="tooltip" :transform="tooltipTransform">
      <!-- 툴팁 그림자 -->
      <rect
        :x="tooltipPosition.x + 2"
        :y="tooltipPosition.y + 2"
        :width="tooltipSize.width"
        :height="tooltipSize.height"
        fill="rgba(0, 0, 0, 0.1)"
        rx="6"
        ry="6"
      />
      
      <!-- 툴팁 배경 -->
      <rect
        :x="tooltipPosition.x"
        :y="tooltipPosition.y"
        :width="tooltipSize.width"
        :height="tooltipSize.height"
        fill="rgba(0, 0, 0, 0.85)"
        stroke="rgba(255, 255, 255, 0.2)"
        stroke-width="0.5"
        rx="6"
        ry="6"
      />
      
      <!-- 툴팁 화살표 (삼각형) - 중앙에서 아래로 뾰족하게 -->
      <polygon
        :points="`${tooltipPosition.x + tooltipSize.width / 2 - 6},${tooltipPosition.y + tooltipSize.height} ${tooltipPosition.x + tooltipSize.width / 2},${tooltipPosition.y + tooltipSize.height + 6} ${tooltipPosition.x + tooltipSize.width / 2 + 6},${tooltipPosition.y + tooltipSize.height}`"
        fill="rgba(0, 0, 0, 0.85)"
      />
      
      <!-- 툴팁 텍스트 -->
      <text
        :x="tooltipPosition.x + tooltipSize.width / 2"
        :y="tooltipPosition.y + tooltipSize.height / 2 + 2"
        font-size="11"
        fill="white"
        font-weight="500"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="system-ui, -apple-system, sans-serif"
      >
        {{ tooltipData.displayNumber }}
      </text>
    </g>
    
    
    <!-- 세로배치 모드에서 하단 라벨 배경 -->
    <path
      v-if="viewMode === 'front' && showNumber !== false && getDisplayNumber()"
      :d="labelBackgroundPath"
      :fill="labelBackgroundColor"
      shape-rendering="crispEdges"
    />
    
    <!-- 락커 레이블 (하단 중앙) -->
    <text
      v-if="showNumber !== false && getDisplayNumber() && !(isManagementPage && viewMode === 'floor')"
      :x="logicalDimensions.width / 2"
      :y="viewMode === 'front' ? (logicalDimensions.height - (3 * LOCKER_VISUAL_SCALE)) : (logicalDimensions.height / 2)"
      text-anchor="middle"
      :dominant-baseline="viewMode === 'front' ? 'middle' : 'middle'"
      :font-size="fontSize"
      :fill="viewMode === 'front' ? '#ffffff' : textColor"
      font-weight="600"
      class="locker-number"
      style="user-select: none; pointer-events: none;"
    >
      {{ getDisplayNumber() }}
    </text>
    
    <!-- 락커 번호 (좌측 상단 - 세로모드에서만) -->
    <text
      v-if="viewMode === 'front' && props.locker.lockrNo"
      :x="4 * LOCKER_VISUAL_SCALE"
      :y="6 * LOCKER_VISUAL_SCALE"
      text-anchor="start"
      dominant-baseline="middle"
      :font-size="fontSize"
      fill="#374151"
      font-weight="600"
      class="locker-number-top"
      style="user-select: none; pointer-events: none;"
    >
      {{ props.locker.lockrNo !== undefined && props.locker.lockrNo !== null ? props.locker.lockrNo : (props.locker.lockrLabel || props.locker.number) }}
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
  isTransitioningToFloor?: boolean  // 평면 모드로 전환 중인지
  showNumber?: boolean
  showRotateHandle?: boolean
  hasError?: boolean
  shouldHideIndividualOutline?: boolean  // 개별 외곽선 숨김 여부
  adjacentSides?: string[]  // 인접한 면 정보 ['top', 'bottom', 'left', 'right']
  zoomLevel?: number  // 현재 줌 레벨
  isManagementPage?: boolean  // LockerManagement 페이지 여부
  childLockers?: Locker[]  // 자식 락커들 (평면배치모드에서 분할 표시용)
}>()

// 뷰 모드에 따라 적절한 좌표 사용
const displayX = computed(() => {
  if (props.viewMode === 'front' && props.locker.frontViewX !== undefined) {
    return props.locker.frontViewX
  }
  return props.locker.x
})

const displayY = computed(() => {
  if (props.viewMode === 'front' && props.locker.frontViewY !== undefined) {
    return props.locker.frontViewY
  }
  return props.locker.y
})

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

// 섹션 hover 상태 관리
const hoveredSection = ref<string | null>(null)
const showTooltip = ref(false)
const tooltipData = ref<any>(null)
const tooltipTimer = ref<NodeJS.Timeout | null>(null)

// 툴팁 위치 및 크기
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipSize = ref({ width: 80, height: 28 })

// 현재 마우스 위치 추적
const currentMousePosition = ref({ x: 0, y: 0 })

// 툴팁 변환 (락커 회전 상태에 관계없이 항상 수평 표시)
const tooltipTransform = computed(() => {
  if (!showTooltip.value || !props.locker.rotation) {
    return ''
  }
  
  // 락커 회전각의 반대로 툴팁을 회전시켜서 항상 수평 유지
  const rotation = props.locker.rotation || 0
  const centerX = logicalDimensions.value.width / 2
  const centerY = logicalDimensions.value.height / 2
  
  return `rotate(${-rotation}, ${centerX}, ${centerY})`
})

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

// 모서리 라운드 값 - 세로배치 모드는 6px (스케일 적용)
const cornerRadius = computed(() => {
  // front view (세로배치)일 때
  if (props.viewMode === 'front') {
    return 3 * LOCKER_VISUAL_SCALE // 6px 라운딩 (3 * 2 스케일)
  }
  return 2 * LOCKER_VISUAL_SCALE // 평면배치일 때는 4px 라운딩
})

const lockerFill = computed(() => {
  // 에러가 있는 락커는 빨간색 배경
  if (props.hasError || props.locker.hasError) return '#fee2e2'
  
  // LockerManagement 페이지에서는 색상 사용하지 않음 - 투명하게 설정
  if (props.isManagementPage) {
    return 'transparent'
  }
  
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
  
  // LockerManagement 페이지에서는 색상 사용하지 않음 - 회색 테두리
  if (props.isManagementPage) {
    return '#9ca3af'  // gray-400 (정면배치모드와 동일한 회색)
  }
  
  // 세로모드에서는 더 진한 회색 테두리
  if (props.viewMode === 'front') {
    return '#9ca3af'  // gray-400 (더 진한 회색)
  }
  
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
  // 줌 레벨에 관계없이 일정한 두께를 유지하기 위해 줌 레벨로 나눔
  const zoomAdjustment = props.zoomLevel || 1
  
  // 에러가 있는 락커는 두꺼운 테두리 (스케일 적용)
  if (props.hasError || props.locker.hasError) return (2 * LOCKER_VISUAL_SCALE) / zoomAdjustment
  // 선택된 경우에도 원래 테두리 두께 유지 (선택 표시는 별도 점선으로)
  if (props.isSelected || props.isMultiSelected) return (1 * LOCKER_VISUAL_SCALE) / zoomAdjustment
  if (isHovered.value) return (1 * LOCKER_VISUAL_SCALE) / zoomAdjustment
  return (0.5 * LOCKER_VISUAL_SCALE) / zoomAdjustment  // Thinner default border
})

const fontSize = computed(() => {
  // 세로배치 모드에서는 더 작은 폰트 사용
  if (props.viewMode === 'front') {
    return 4 * LOCKER_VISUAL_SCALE  // 기존 폰트 크기 복원 (4px * 2 = 8px)
  }
  // 평면배치 모드에서도 약간 작은 크기
  return 8 * LOCKER_VISUAL_SCALE  // 기존 10px에서 8px로 축소
})

// Text baseline removed - not used

// 라벨 배경색 (세로배치 모드)
const labelBackgroundColor = computed(() => {
  // 에러가 있는 락커는 빨간색
  if (props.hasError || props.locker.hasError) return '#dc2626'
  
  // 락커 타입 색상 사용 (진한 색)
  if (props.locker.color) {
    return props.locker.color
  }
  
  // 상태별 색상
  switch (props.locker.status) {
    case 'available': return '#6b7280'  // gray-500
    case 'occupied': return '#ea580c'   // orange-600
    case 'expired': return '#dc2626'    // red-600
    case 'maintenance': return '#374151' // gray-700
    default: return '#6b7280'
  }
})

// 라벨 배경 경로 (하단 모서리만 라운딩)
const labelBackgroundPath = computed(() => {
  const x = 0  // 세로모드에서는 0부터 시작
  const y = logicalDimensions.value.height - (7 * LOCKER_VISUAL_SCALE)  // 라벨 영역 시작 위치
  const width = logicalDimensions.value.width  // 전체 너비 사용
  const height = 7 * LOCKER_VISUAL_SCALE  // 라벨 영역 높이
  
  // 락커와 동일한 라운딩 값 사용
  const radius = cornerRadius.value  // 6 * LOCKER_VISUAL_SCALE = 12px
  
  // 하단 모서리만 라운딩된 사각형 경로
  // 상단은 직각, 하단은 락커와 동일한 라운딩
  return `
    M ${x} ${y}
    L ${x + width} ${y}
    L ${x + width} ${y + height - radius}
    Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
    L ${x + radius} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - radius}
    L ${x} ${y}
    Z
  `
})

const textColor = computed(() => {
  // 세로배치 모드에서는 상단 좌측 배치이므로 어두운 색상 사용 (가독성 확보)
  if (props.viewMode === 'front') {
    return '#374151'  // 어두운 회색으로 가독성 확보
  }
  
  // 평면배치 모드에서는 기존 색상 로직 유지
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

// 자식 락커 페이드 아웃 애니메이션 여부
const shouldFadeOutChildLocker = computed(() => {
  // 평면 모드로 전환 중이고, 자식 락커일 때
  return props.isTransitioningToFloor && 
         props.locker.tierLevel && 
         props.locker.tierLevel > 0
})

// 락커가 가로로 놓여있는지 확인 (90도 또는 270도 회전)
const isHorizontalLocker = computed(() => {
  const rotation = props.locker.rotation || 0
  const normalizedRotation = ((rotation % 360) + 360) % 360
  return normalizedRotation === 90 || normalizedRotation === 270
})

// 평면배치모드에서 분할선 Y 위치 계산 (세로 락커용)
const getDividerY = (index: number) => {
  if (!props.childLockers) return 0
  const totalSections = props.childLockers.length + 1 // 자식 + 부모
  const sectionHeight = (logicalDimensions.value.height - 2) / totalSections
  return 1 + sectionHeight * (index + 1)
}

// 평면배치모드에서 분할선 X 위치 계산 (가로 락커용)
const getDividerX = (index: number) => {
  if (!props.childLockers) return 0
  const totalSections = props.childLockers.length + 1 // 자식 + 부모
  const sectionWidth = (logicalDimensions.value.width - 2) / totalSections
  return 1 + sectionWidth * (index + 1)
}

// 각 섹션의 중앙 Y 위치 계산 (세로 락커용)
const getSectionCenterY = (index: number) => {
  if (!props.childLockers) return 0
  const totalSections = props.childLockers.length + 1
  const sectionHeight = (logicalDimensions.value.height - 2) / totalSections
  return 1 + sectionHeight * index + sectionHeight / 2
}

// 각 섹션의 중앙 X 위치 계산 (가로 락커용)
const getSectionCenterX = (index: number) => {
  if (!props.childLockers) return 0
  const totalSections = props.childLockers.length + 1
  const sectionWidth = (logicalDimensions.value.width - 2) / totalSections
  return 1 + sectionWidth * index + sectionWidth / 2
}

// 각 섹션의 시작 Y 위치 계산
const getSectionY = (index: number) => {
  if (!props.childLockers) return 1
  const totalSections = props.childLockers.length + 1
  const sectionHeight = (logicalDimensions.value.height - 2) / totalSections
  return 1 + sectionHeight * index
}

// 각 섹션의 높이 계산
const getSectionHeight = () => {
  if (!props.childLockers) return logicalDimensions.value.height - 2
  const totalSections = props.childLockers.length + 1
  return (logicalDimensions.value.height - 2) / totalSections
}

// 마우스 위치 업데이트 함수 (SVG CTM 기반)
const updateMousePosition = (event: MouseEvent) => {
  const svgElement = event.currentTarget as SVGGraphicsElement
  const rootSVG = svgElement.ownerSVGElement as SVGSVGElement
  
  console.log('updateMousePosition - svgElement:', svgElement, 'rootSVG:', rootSVG)
  
  if (rootSVG && svgElement) {
    try {
      // SVG 좌표 변환 매트릭스 사용 (CTM)
      const ctm = svgElement.getScreenCTM()
      if (ctm) {
        // 역변환 매트릭스를 사용하여 화면 좌표를 로컬 SVG 좌표로 변환
        const inverse = ctm.inverse()
        const screenPoint = rootSVG.createSVGPoint()
        screenPoint.x = event.clientX
        screenPoint.y = event.clientY
        
        // 변환된 로컬 좌표 계산
        const localPoint = screenPoint.matrixTransform(inverse)
        
        console.log('Client position:', { clientX: event.clientX, clientY: event.clientY })
        console.log('CTM transformed position:', { x: localPoint.x, y: localPoint.y })
        
        currentMousePosition.value = {
          x: localPoint.x,
          y: localPoint.y
        }
      } else {
        console.warn('CTM not available, falling back to bounding rect method')
        // Fallback: 기존 방식 사용
        const svgRect = rootSVG.getBoundingClientRect()
        currentMousePosition.value = {
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top
        }
      }
    } catch (error) {
      console.error('Error in CTM transformation:', error)
      // Fallback: 기존 방식 사용
      const svgRect = rootSVG.getBoundingClientRect()
      currentMousePosition.value = {
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
      }
    }
  } else {
    console.error('Root SVG not available for mouse position calculation')
  }
}

// 툴팁 위치 업데이트 함수
const updateTooltipPosition = () => {
  if (!currentMousePosition.value) {
    console.warn('No mouse position available for tooltip')
    return
  }
  
  console.log('Updating tooltip position, mouse:', currentMousePosition.value)
  
  // 기본 위치 계산 (마우스 위쪽에 중앙 정렬)
  // 여기에 락커의 회전각도에 따른 계산 추가

  
  let x = 0
  let y = 0
  
  // 락커의 회전각도에 따른 계산
  const rotation = props.locker.rotation
  const displayWidth = props.locker.displayWidth
  const displayHeight = props.locker.displayHeight
  switch (rotation) {
    case 0:
      x = currentMousePosition.value.x - 40
      y = currentMousePosition.value.y - 40
      break
    case 90:      
      x =  20 - currentMousePosition.value.y
      y = currentMousePosition.value.x - 40
      break
    case 180:
      x = 20 - currentMousePosition.value.x 
      y = 20 - currentMousePosition.value.y 
      break
    case 270:
    x =  20 - currentMousePosition.value.y
    y = 20 - currentMousePosition.value.x 
      break
  }
  
  
  tooltipPosition.value = { x, y }
  
  console.log('Final tooltip position:', tooltipPosition.value)
}

// 툴팁 타이머 시작
const startTooltipTimer = (sectionId: string, lockerData: any, event: MouseEvent) => {
  clearTooltipTimer()
  
  // 초기 마우스 위치 설정
  updateMousePosition(event)
  
  console.log('Starting tooltip timer for section:', sectionId, 'mouse position:', currentMousePosition.value)
  
  tooltipTimer.value = setTimeout(() => {
    showTooltip.value = true
    tooltipData.value = {
      displayNumber: sectionId === 'parent' || sectionId === 'single' ? getDisplayNumber() : getChildDisplayNumber(lockerData)
    }
    
    console.log('Tooltip activated. Data:', tooltipData.value, 'showTooltip:', showTooltip.value)
    
    // 초기 툴팁 위치 설정
    updateTooltipPosition()
    
    console.log('Tooltip position set to:', tooltipPosition.value)
  }, 400) // 0.4초로 약간 빠르게
}

// 툴팁 타이머 클리어
const clearTooltipTimer = () => {
  if (tooltipTimer.value) {
    clearTimeout(tooltipTimer.value)
    tooltipTimer.value = null
  }
  showTooltip.value = false
  tooltipData.value = null
}

// 디버깅: 툴팁 렌더링 조건 확인
console.log('=== Tooltip Rendering Conditions ===')
console.log('isManagementPage:', props.isManagementPage)
console.log('viewMode:', props.viewMode)
console.log('childLockers:', props.childLockers)
console.log('childLockers length:', props.childLockers?.length)
console.log('All conditions met:', props.isManagementPage && props.viewMode === 'floor' && props.childLockers && props.childLockers.length > 0)
console.log('=====================================')

// 디버깅: 자식 락커 정보 확인
if (props.isManagementPage && props.viewMode === 'floor' && props.childLockers) {
  console.log(`Locker ${props.locker.lockrCd} - childLockers:`, props.childLockers)
  console.log(`isManagementPage: ${props.isManagementPage}, viewMode: ${props.viewMode}`)
}

// Get locker number (LOCKR_NO)
const getLockrNo = () => {
  if (!props.locker) return ''
  
  // Return LOCKR_NO with proper null checking (0 is a valid number)
  return props.locker.lockrNo !== undefined && props.locker.lockrNo !== null 
    ? String(props.locker.lockrNo)
    : ''
}

// Get locker label (LOCKR_LABEL)
const getLockrLabel = () => {
  if (!props.locker) return ''
  
  // Return LOCKR_LABEL or fallback values
  return props.locker.lockrLabel || props.locker.frontViewNumber || props.locker.number || ''
}

// LockerManagement 페이지용 번호 반환
const getManagementPageNumber = () => {
  if (!props.locker) return ''
  
  if (props.viewMode === 'floor') {
    // 평면배치에서는 모든 락커 실제 번호 표시 (부모, 자식 모두)
    return getLockrNo()
  } else {
    // 정면배치에서는 모든 락커 레이블 표시 (부모, 자식 모두)
    return getLockrLabel()
  }
}

// LockerPlacement 페이지용 번호 반환  
const getPlacementPageNumber = () => {
  if (!props.locker) return ''
  
  if (props.viewMode === 'floor') {
    // 평면배치에서는 모든 락커 레이블 표시 (부모, 자식 모두)
    return getLockrLabel()
  } else {
    // 정면배치에서는 모든 락커 레이블 표시 (부모, 자식 모두)
    return getLockrLabel()
  }
}

// 메인 디스플레이 번호 라우터 함수
const getDisplayNumber = () => {
  return props.isManagementPage ? getManagementPageNumber() : getPlacementPageNumber()
}

// 자식 락커 번호 표시용 함수
const getChildDisplayNumber = (childLocker: any) => {
  if (!childLocker) return ''
  
  if (props.isManagementPage) {
    // LockerManagement: 자식 락커도 실제 번호(lockrNo) 표시
    return childLocker.lockrNo !== undefined && childLocker.lockrNo !== null 
      ? String(childLocker.lockrNo)
      : (childLocker.lockrLabel || childLocker.number || '')
  } else {
    // LockerPlacement: 자식 락커도 레이블(lockrLabel) 표시
    return childLocker.lockrLabel || childLocker.number || ''
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
  /* 초기 상태 명시적 설정 - 애니메이션 시작 전 */
  opacity: 0;
  transform: translateY(20px);
  
  /* GPU 가속을 위한 will-change 속성 */
  will-change: transform, opacity;
  
  /* 애니메이션 설정 - both로 변경하여 시작/끝 상태 모두 적용 */
  animation: slideUpFromBottom 0.3s ease-out both;
  transform-origin: center center;
}

@keyframes slideUpFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 자식 락커 페이드 아웃 애니메이션 */
.child-locker-fade-out {
  /* GPU 가속을 위한 will-change 속성 */
  will-change: transform, opacity;
  
  animation: fadeOutDown 0.3s ease-in forwards;
  transform-origin: center center;
}

@keyframes fadeOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* 섹션 hover 효과 */
.section-hover {
  transition: all 0.2s ease;
}

.section-hovered {
  fill: rgba(59, 130, 246, 0.1) !important;
  stroke: #3b82f6;
  stroke-width: 1;
}

/* 툴팁 스타일 */
.tooltip {
  pointer-events: none;
  z-index: 1000;
  animation: tooltipFadeIn 0.2s ease-out;
}

.tooltip rect {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.tooltip polygon {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
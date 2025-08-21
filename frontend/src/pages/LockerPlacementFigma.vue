<template>
  <div class="locker-placement">
    <!-- Loading overlay to prevent initial flicker -->
    <div v-if="isLoadingTypes || isLoadingLockers" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading locker data...</p>
      </div>
    </div>
    
    <!-- Main content - only show when data is ready -->
    <div v-else class="main-content">
      <!-- 간단한 헤더 -->
      <header class="header">
      <h1 class="title">락커 배치</h1>
      <div class="breadcrumb">
        <span>관리자</span>
        <span class="divider">/</span>
        <span>락커 배치</span>
      </div>
    </header>

    <div class="container">
      <!-- 좌측 사이드바 - 평면배치모드에서만 표시 -->
      <aside class="sidebar">
        <h2 class="sidebar-title">락커 선택창</h2>
        
        <!-- Loading state -->
        <div v-if="isLoadingTypes" class="loading-state">
          <p>🔄 락커 타입을 불러오는 중...</p>
        </div>
        
        <!-- Empty state after loading -->
        <div v-else-if="hasLoadedTypes && visibleLockerTypes.length === 0" class="empty-state">
          <p>📦 등록된 락커가 없습니다</p>
          <p class="empty-hint">락커를 등록해주세요</p>
        </div>
        
        <!-- Loaded data state -->
        <div v-else-if="visibleLockerTypes.length > 0" class="locker-types">
          <div 
            v-for="type in visibleLockerTypes" 
            :key="type.id"
            class="locker-type-item-wrapper"
          >
            <div
              class="locker-type-item"
              :class="{ active: selectedType?.id === type.id }"
              @click="selectLockerType(type)"
              @dblclick="addLockerByDoubleClick(type)"
              @contextmenu.prevent="showTypeContextMenuHandler($event, type)"
              style="cursor: pointer"
            >
              <div class="type-visual">
              <!-- SVG preview matching actual display size -->
              <svg 
                :width="(type.width || 40) * 2.0" 
                :height="((type.depth || type.width) || 40) * 2.0"
                :viewBox="`0 0 ${(type.width || 40) * 2.0} ${((type.depth || type.width) || 40) * 2.0}`"
                class="type-preview"
              >
                <rect 
                  x="2" 
                  y="2" 
                  :width="Math.max(((type.width || 40) * 2.0) - 4, 1)"
                  :height="Math.max((((type.depth || type.width) || 40) * 2.0) - 4, 1)"
                  :fill="type.color ? `${type.color}20` : '#FFFFFF'"
                  :stroke="type.color || '#D1D5DB'"
                  :stroke-width="0.5 * 2.0"
                  :rx="2 * 2.0"
                  :ry="2 * 2.0"
                  shape-rendering="crispEdges"
                />
                <!-- Front indicator line -->
                <line
                  :x1="6 * 2.0"
                  :y1="(((type.depth || type.width) || 40) * 2.0) - (6 * 2.0)"
                  :x2="((type.width || 40) * 2.0) - (6 * 2.0)"
                  :y2="(((type.depth || type.width) || 40) * 2.0) - (6 * 2.0)"
                  :stroke="type.color || '#D1D5DB'"
                  :stroke-width="2 * 2.0"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div class="type-info">
              <span class="type-name">{{ type.name || 'Unknown' }}</span>
              <span class="type-size">
                {{ type.width }}x{{ type.depth || type.width }}x{{ type.height }}cm
              </span>
            </div>
            </div>
            <!-- Delete button for this locker type -->
            <button 
              class="delete-type-button"
              @click.stop="deleteLockerType(type)"
              title="이 락커 타입 삭제"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 4 L12 12 M12 4 L4 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        
        <!-- 삭제된 타입 섹션 -->
        <div v-if="hiddenTypes.length > 0" class="deleted-types-section">
          <div class="section-title">삭제된 타입</div>
          <div v-for="typeId in hiddenTypes" :key="typeId" class="deleted-type-item">
            <span>{{ getTypeLabel(typeId) }}</span>
            <button @click="restoreLockerType(typeId)" class="restore-btn">복원</button>
          </div>
        </div>

        <!-- 락커 등록 버튼 -->
        <button class="register-locker-btn" @click="showLockerRegistrationModal = true">
          락커 등록
        </button>


      </aside>

      <!-- 메인 캔버스 영역 -->
      <main class="canvas-area">
        <!-- 구역 탭 -->
        <div class="zone-tabs">
          <button 
            v-for="zone in zones" 
            :key="zone.id"
            class="zone-tab"
            :class="{ active: selectedZone?.id === zone.id }"
            @click="selectZone(zone)"
            @contextmenu="showZoneContextMenuHandler($event, zone)"
          >
            {{ zone.name }}
            <span v-if="selectedZone?.id === zone.id" class="tab-indicator"></span>
          </button>
          
          <!-- Zone controls container -->
          <div class="zone-controls">
            <!-- 구역 추가 버튼 - LEFT position -->
            <button 
              class="zone-add-btn"
              @click="showZoneModal = true"
            >
              + 구역 추가
            </button>
            
            <!-- 모드 전환 버튼 - RIGHT of add button -->
            <div class="mode-toggle-inline">
              <button 
                class="mode-btn"
                :class="{ active: currentViewMode === 'floor' }"
                @click="setViewMode('floor')"
                title="평면배치모드 (P)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="7" y="7" width="4" height="4" />
                  <rect x="13" y="7" width="4" height="4" />
                  <rect x="7" y="13" width="4" height="4" />
                  <rect x="13" y="13" width="4" height="4" />
                </svg>
                <span>평면배치</span>
              </button>
              <button 
                class="mode-btn"
                :class="{ active: currentViewMode === 'front' }"
                @click="setViewMode('front')"
                title="세로배치모드 (F)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="15" x2="21" y2="15" stroke-dasharray="2 2" />
                  <rect x="7" y="7" width="4" height="6" />
                  <rect x="13" y="7" width="4" height="6" />
                </svg>
                <span>세로배치</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 캔버스 -->
        <div class="canvas-wrapper">
          <svg 
            ref="canvasRef"
            class="canvas"
            width="100%"
            height="100%"
            :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
            :style="{ cursor: getCursorStyle, margin: 0, padding: 0 }"
            preserveAspectRatio="none"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"
            @click="handleCanvasClick"
          >
            <!-- 그리드 (옵션) -->
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e5e5" stroke-width="0.5"/>
              </pattern>
              <filter id="buttonShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" class="canvas-background" />

            <!-- 구역 경계 -->
            <rect 
              v-if="selectedZone"
              x="0"
              y="0"
              :width="canvasWidth"
              :height="canvasHeight"
              fill="none"
              stroke="black"
              stroke-width="1"
            />

            <!-- 바닥선 (프론트 뷰에서만 표시) -->
            <g v-if="currentViewMode === 'front'">
              <!-- 바닥선 -->
              <line
                :x1="0"
                :y1="FLOOR_Y"
                :x2="1550"
                :y2="FLOOR_Y"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="10,5"
              />
              
              <!-- 바닥선 라벨 -->
              <text
                :x="20"
                :y="FLOOR_Y + 20"
                fill="#64748b"
                font-size="12"
                font-weight="500"
              >
                바닥선
              </text>
            </g>

            <!-- 락커들 -->
            <LockerSVG
              v-for="locker in sortedLockers"
              :key="locker.id"
              :locker="locker"
              :is-selected="selectedLocker?.id === locker.id"
              :is-multi-selected="selectedLockerIds.has(locker.id)"
              :is-dragging="isDragging && selectedLockerIds.has(locker.id)"
              :view-mode="currentViewMode"
              :show-number="true"
              :show-rotate-handle="selectedLocker?.id === locker.id"
              @click="(locker, event) => selectLocker(locker, event)"
              @contextmenu.prevent="showContextMenu"
              @select="(id) => selectedLocker = currentLockers.find(l => l.id === id)"
              @dragstart="startDragLocker"
              @rotatestart="startRotateLocker"
            />
            
            <!-- Selection UI handles (delete, rotate) - Follow during drag and rotate with locker -->
            <g v-if="selectedLocker && !isDragging && showSelectionUI">
              <!-- Apply position and rotation transforms (all in logical coordinates) -->
              <g :transform="`translate(${getSelectionUIPosition().x}, ${getSelectionUIPosition().y}) rotate(${selectedLocker.rotation || 0}, ${selectedLocker.width / 2}, ${selectedLocker.height / 2})`">
                
                <!-- Delete button (top right, outside locker bounds) -->
                <g 
                  :transform="`translate(${selectedLocker.width + 15}, -15)`"
                  @click.stop="deleteSelectedLocker"
                  style="cursor: pointer"
                  class="selection-button delete-button"
                >
                  <circle r="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
                  <circle r="12" fill="#ef4444" opacity="0" class="hover-fill"/>
                  <!-- Simple X icon -->
                  <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                </g>
                
                <!-- Rotate Clockwise button (above center handle, slightly right) -->
                <g 
                  :transform="`translate(${selectedLocker.width / 2 + 15}, -30)`"
                  @click.stop="() => rotateSelectedLocker(45)"
                  style="cursor: pointer"
                  class="selection-button rotate-cw-button"
                >
                  <title>시계방향 회전 (R)</title>
                  <circle r="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
                  <circle r="12" fill="#3b82f6" opacity="0" class="hover-fill"/>
                  <!-- Stable rotation icon without transform -->
                  <path 
                    d="M 0,-6 A 6,6 0 0,1 6,0 L 4,-2 M 6,0 L 4,2" 
                    fill="none" 
                    stroke="#3b82f6" 
                    stroke-width="2" 
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                
                <!-- Rotate Counter-Clockwise button (above center handle, slightly left) -->
                <g 
                  :transform="`translate(${selectedLocker.width / 2 - 15}, -30)`"
                  @click.stop="() => rotateSelectedLocker(-45)"
                  style="cursor: pointer"
                  class="selection-button rotate-ccw-button"
                >
                  <title>반시계방향 회전 (Shift+R)</title>
                  <circle r="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
                  <circle r="12" fill="#10b981" opacity="0" class="hover-fill"/>
                  <!-- Stable rotation icon without transform -->
                  <path 
                    d="M 0,-6 A 6,6 0 0,0 -6,0 L -4,-2 M -6,0 L -4,2" 
                    fill="none" 
                    stroke="#10b981" 
                    stroke-width="2" 
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                
                <!-- Multi-select badge removed as requested -->
                <!-- <g v-if="selectedLockerIds.size > 1" 
                   :transform="`translate(${selectedLocker.width / 2}, -25)`"
                   class="multi-select-indicator">
                  <rect 
                    :x="-30" 
                    y="-10" 
                    width="60" 
                    height="20" 
                    rx="10" 
                    fill="#1e40af" 
                    opacity="0.9"
                  />
                  <text 
                    x="0" 
                    y="0" 
                    text-anchor="middle" 
                    dominant-baseline="middle" 
                    fill="white" 
                    font-size="12" 
                    font-weight="600"
                  >
                    {{ selectedLockerIds.size }}개 선택됨
                  </text>
                </g> -->
              </g>
            </g>

            <!-- 정렬 가이드라인 -->
            <g v-if="showAlignmentGuides" class="alignment-guides">
              <!-- 수평 가이드라인 -->
              <line
                v-for="guide in horizontalGuides"
                :key="`h-${guide.position}`"
                :x1="0"
                :y1="guide.position"
                :x2="canvasWidth.value"
                :y2="guide.position"
                stroke="#00ff00"
                stroke-width="1"
                stroke-dasharray="5,5"
                opacity="0.6"
                pointer-events="none"
              />
              <!-- 수직 가이드라인 -->
              <line
                v-for="guide in verticalGuides"
                :key="`v-${guide.position}`"
                :x1="guide.position"
                :y1="0"
                :x2="guide.position"
                :y2="canvasHeight.value"
                stroke="#00ff00"
                stroke-width="1"
                stroke-dasharray="5,5"
                opacity="0.6"
                pointer-events="none"
              />
            </g>
            
            <!-- 드래그 선택 박스 - Only show if actually dragging, not just clicked -->
            <rect
              v-if="isDragSelecting && 
                    dragSelectStart.x != null && dragSelectStart.y != null && 
                    dragSelectEnd.x != null && dragSelectEnd.y != null &&
                    Math.abs((dragSelectEnd.x || 0) - (dragSelectStart.x || 0)) > 5"
              :x="Math.min(dragSelectStart.x || 0, dragSelectEnd.x || 0)"
              :y="Math.min(dragSelectStart.y || 0, dragSelectEnd.y || 0)"
              :width="Math.abs((dragSelectEnd.x || 0) - (dragSelectStart.x || 0))"
              :height="Math.abs((dragSelectEnd.y || 0) - (dragSelectStart.y || 0))"
              fill="rgba(0, 122, 255, 0.1)"
              stroke="#007AFF"
              stroke-width="1"
              stroke-dasharray="5 5"
              pointer-events="none"
              class="selection-box"
            />
            
            <!-- Preview removed - direct addition mode now -->
          </svg>
        </div>
      </main>
    </div>
  </div>
  
  <!-- 다중 선택 배지 - removed as requested -->
  <!-- <div v-if="selectedLockerIds.size > 1" class="multi-select-badge">
    {{ selectedLockerIds.size }}개 선택됨
  </div> -->
  
  <!-- 구역 추가 모달 -->
  <ZoneModal 
    v-if="showZoneModal"
    @close="showZoneModal = false"
    @save="handleZoneSave"
  />
  
  <!-- 락커 등록 모달 -->
  <LockerRegistrationModal
    v-if="showLockerRegistrationModal"
    @close="showLockerRegistrationModal = false"
    @save="handleLockerRegistration"
  />

  <!-- Context Menu - Only visible in front view (세로배치모드) -->
  <div 
    v-if="contextMenuVisible && currentViewMode === 'front'" 
    :style="{ 
      position: 'fixed', 
      left: contextMenuPosition.x + 'px', 
      top: contextMenuPosition.y + 'px',
      zIndex: 1000
    }"
    class="context-menu"
    @click.stop
  >
    <div class="context-menu-item" @click="showFloorInputDialog">
      <i class="fas fa-layer-group"></i> 단수 입력
    </div>
    <div class="context-menu-item" @click="showNumberAssignDialog">
      <i class="fas fa-sort-numeric-up"></i> 번호 부여
    </div>
    <div class="context-menu-item" @click="deleteNumbers">
      <i class="fas fa-eraser"></i> 번호 삭제
    </div>
  </div>
  
  <!-- Floor Input Dialog -->
  <div v-if="floorInputVisible" class="modal-overlay" @click="floorInputVisible = false">
    <div class="modal-content" @click.stop>
      <h3>단수 입력</h3>
      <div class="form-group">
        <label>층수:</label>
        <input 
          v-model.number="floorCount" 
          type="number" 
          min="1" 
          max="10"
          placeholder="1-10 사이 입력"
          class="form-control"
        >
      </div>
      <div class="modal-buttons">
        <button class="btn btn-secondary" @click="floorInputVisible = false">취소</button>
        <button class="btn btn-primary" @click="addFloors">확인</button>
      </div>
    </div>
  </div>
  
  <!-- Number Assignment Dialog -->
  <div v-if="numberAssignVisible" class="modal-overlay" @click="numberAssignVisible = false">
    <div class="modal-content" @click.stop>
      <h3>번호 부여</h3>
      <div class="form-group">
        <label>시작 번호:</label>
        <input 
          v-model.number="startNumber" 
          type="number" 
          :min="1" 
          placeholder="시작 번호"
          class="form-control"
        >
      </div>
      <div class="form-group">
        <label>정렬 방향:</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="numberDirection" value="horizontal">
            가로
          </label>
          <label>
            <input type="radio" v-model="numberDirection" value="vertical">
            세로
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="reverseDirection">
          역방향
        </label>
      </div>
      <div class="form-group" v-if="numberDirection === 'vertical'">
        <label>
          <input type="checkbox" v-model="fromTop">
          위에서부터
        </label>
      </div>
      <div class="modal-buttons">
        <button class="btn btn-secondary" @click="numberAssignVisible = false">취소</button>
        <button class="btn btn-primary" @click="assignNumbers">번호 부여</button>
      </div>
    </div>
    </div> <!-- Close main-content -->
    
    <!-- Zone Context Menu -->
    <teleport to="body">
      <div 
        v-if="showZoneContextMenu" 
        class="zone-context-menu"
        :style="{
          position: 'fixed',
          left: zoneContextMenuPosition.x + 'px',
          top: zoneContextMenuPosition.y + 'px',
          zIndex: 9999
        }"
        @click.stop
      >
        <div class="zone-context-menu-item" @click="editZone(contextMenuZone)">
          <span class="zone-context-menu-icon">✏️</span>
          구역 수정
        </div>
        <div class="zone-context-menu-item" @click="deleteZone(contextMenuZone)">
          <span class="zone-context-menu-icon">🗑️</span>
          구역 삭제
        </div>
      </div>
    </teleport>

    <!-- Locker Type Context Menu -->
    <teleport to="body">
      <div
        v-if="showTypeContextMenu"
        class="context-menu"
        :style="{
          position: 'fixed',
          left: contextMenuPosition.x + 'px',
          top: contextMenuPosition.y + 'px',
          zIndex: 9999
        }"
        @click.stop
      >
        <div class="context-menu-item" @click="deleteLockerType(contextMenuType)">
          <span class="context-menu-icon">🗑️</span>
          타입 삭제
        </div>
      </div>
    </teleport>
  </div> <!-- Close locker-placement -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useLockerStore } from '@/stores/lockerStore'
import LockerSVG from '@/components/locker/LockerSVG.vue'
import ZoneModal from '@/components/modals/ZoneModal.vue'
import LockerRegistrationModal from '@/components/modals/LockerRegistrationModal.vue'
// import * as lockerApi from '@/api/lockers' // TODO: Add this when API module is created

const lockerStore = useLockerStore()

// 상태
const selectedZone = ref<any>(null)
const selectedType = ref<any>(null)
const selectedLocker = ref<any>(null)
// Preview mode removed - direct addition now
const isVerticalMode = ref(false)
const canvasRef = ref<any>(null)
const showZoneModal = ref(false)
const showLockerRegistrationModal = ref(false) // 락커 등록 모달
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const currentViewMode = ref<'floor' | 'front'>('floor') // View mode state
const showSelectionUI = ref(true) // Control selection UI visibility during drag
const isCopyMode = ref(false) // Track if Ctrl/Cmd is pressed for copy mode

// Context menu state
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

// Zone context menu state
const showZoneContextMenu = ref(false)
const zoneContextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuZone = ref(null)

// Locker type context menu state
const showTypeContextMenu = ref(false)
const typeContextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuType = ref(null)

// Dialog states
const floorInputVisible = ref(false)
const floorCount = ref(1)
const numberAssignVisible = ref(false)
const startNumber = ref(1)
const numberDirection = ref<'horizontal' | 'vertical'>('horizontal')
const reverseDirection = ref(false)
const fromTop = ref(false)

// Display scale for visual rendering - 모든 뷰모드에서 동일한 스케일 사용
const FLOOR_VIEW_SCALE = 1.0  // 평면배치 모드
const FRONT_VIEW_SCALE = 1.0  // 세로배치 모드

// 현재 뷰모드에 따른 스케일 계산
const getCurrentScale = () => {
  return currentViewMode.value === 'floor' ? FLOOR_VIEW_SCALE : FRONT_VIEW_SCALE
}

// 캔버스 디스플레이 너비 계산 (뷰모드에 따라 다름)
const getCanvasDisplayWidth = () => {
  // 두 모드 모두 고정 크기 사용
  return 1550  // 고정 1550px
}

// 하위 호환성을 위한 DISPLAY_SCALE (기본값)
const DISPLAY_SCALE = 1.0

// Floor line position for front view (logical units)
const FLOOR_Y = 450  // 바닥선 Y 위치

// Log scale configuration
console.log('[Scale] Display configuration:', {
  floorScale: FLOOR_VIEW_SCALE,
  frontScale: FRONT_VIEW_SCALE,
  currentScale: getCurrentScale(),
  viewMode: currentViewMode.value,
  sizes: {
    small: { logical: 40, display: 72 },   // 40 * 1.8 = 72
    medium: { logical: 50, display: 90 },  // 50 * 1.8 = 90
    large: { logical: 60, display: 108 }   // 60 * 1.8 = 108
  },
  grid: { logical: 20, visual: 36 }        // 20 * 1.8 = 36
})

// 캔버스 크기 (동적으로 조정)
const canvasWidth = ref(1550)  // 고정 너비
const canvasHeight = ref(720)  // 평면배치 시 720px

// 세로모드일 때 동적 viewBox 크기
const dynamicCanvasWidth = ref(1550)
const dynamicCanvasHeight = ref(700)

// Update canvas size to fill container
const updateCanvasSize = () => {
  // 로딩 중일 때는 캔버스 크기 변경하지 않음 (깜빡임 방지)
  if (isLoadingTypes.value || isLoadingLockers.value) {
    return
  }
  
  const wrapper = document.querySelector('.canvas-wrapper')
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect()
    // Use full wrapper dimensions without subtracting padding
    const wrapperWidth = rect.width
    const wrapperHeight = rect.height
    
    console.log('[Canvas] Dimensions:', { 
      wrapper: { width: wrapperWidth, height: wrapperHeight },
      canvas: { width: canvasWidth.value, height: canvasHeight.value },
      viewBox: `0 0 ${canvasWidth.value} ${canvasHeight.value}`
    })
  }
}

// Helper functions for coordinate conversion
const toLogicalCoords = (displayX: number, displayY: number) => {
  const scale = getCurrentScale()
  return {
    x: displayX / scale,
    y: displayY / scale
  }
}

const toDisplayCoords = (logicalX: number, logicalY: number) => {
  const scale = getCurrentScale()
  return {
    x: logicalX * scale,
    y: logicalY * scale
  }
}

const toDisplaySize = (width: number, height: number) => {
  const scale = getCurrentScale()
  return {
    width: width * scale,
    height: height * scale
  }
}

// 구역 목록 - 스토어에서 가져오기
const zones = computed(() => lockerStore.zones)

// 락커 타입 목록 (depth 속성 포함)
// Locker types will be loaded from database
const lockerTypes = ref([])

// Loading states
const isLoading = ref(false)
const isLoadingTypes = ref(true)
const isLoadingLockers = ref(true)
const hasLoadedTypes = ref(false)
const saveError = ref<string | null>(null)
const loadError = ref<string | null>(null)

// API Base URL
const API_BASE_URL = 'http://localhost:3333/api'

// Data Loading Functions
const loadZones = async () => {
  try {
    console.log('[API] Loading zones from API...')
    const response = await fetch(`${API_BASE_URL}/zones`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('[API] Zones API response:', data)
    
    // Transform backend data to frontend format
    if (data.zones) {
      const transformedZones = data.zones.map(zone => ({
        id: zone.LOCKR_KND_CD,
        name: zone.LOCKR_KND_NM,
        x: zone.X,
        y: zone.Y,
        width: zone.WIDTH,
        height: zone.HEIGHT,
        color: zone.COLOR,
        floor: zone.FLOOR,
        // Keep original data as well
        ...zone
      }))
      
      lockerStore.zones = transformedZones
      console.log('[API] Zones loaded and transformed:', transformedZones.length)
    } else {
      console.warn('[API] No zones data in response:', data)
      lockerStore.zones = []
    }
  } catch (error) {
    console.error('[API] Failed to load zones:', error.message)
    // Don't throw error - just log it and continue
    lockerStore.zones = []
  }
}

const loadLockers = async () => {
  try {
    console.log('[API] Loading lockers from API...')
    const response = await fetch(`${API_BASE_URL}/lockrs`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('[API] Lockers API response:', data)
    
    if (data.success && data.lockers) {
      // Transform backend data to frontend format
      const transformedLockers = data.lockers.map(locker => {
        // 타입 정보에서 실제 치수 가져오기
        const lockerType = lockerTypes.value.find(t => t.id === locker.LOCKR_TYPE_CD)
        const typeWidth = lockerType?.width || 40
        const typeHeight = lockerType?.height || 60  // 실제 높이
        const typeDepth = lockerType?.depth || 40
        
        // CRITICAL DEBUG: 타입 매핑 확인
        console.log(`[LoadLockers] ${locker.LOCKR_LABEL}:`, {
          typeCode: locker.LOCKR_TYPE_CD,
          foundType: lockerType ? `Found - ${lockerType.name}` : 'NOT FOUND',
          expectedHeight: typeHeight,
          isNormalLocker: locker.LOCKR_TYPE_CD === 'custom-1755675491548' ? 'YES (30px)' : 'NO',
          isTallLocker: locker.LOCKR_TYPE_CD === 'custom-1755675506519' ? 'YES (90px)' : 'NO'
        })
        
        const transformedLocker = {
          id: `locker-${locker.LOCKR_CD}`,
          lockrCd: locker.LOCKR_CD,
          number: locker.LOCKR_LABEL || `L${locker.LOCKR_CD}`,
          x: locker.X || 0,
          y: locker.Y || 0,
          width: typeWidth,
          height: typeDepth,  // Floor view에서는 depth를 height로 사용
          depth: typeDepth,
          actualHeight: typeHeight,  // 실제 높이를 별도로 저장 (세로배치용)
          status: 'available',
          rotation: locker.ROTATION || 0,
          zoneId: locker.LOCKR_KND,
          typeId: locker.LOCKR_TYPE_CD,
          type: locker.LOCKR_TYPE_CD,
          color: lockerType?.color,  // 타입 색상도 추가
          // Database fields
          compCd: locker.COMP_CD,
          bcoffCd: locker.BCOFF_CD,
          lockrLabel: locker.LOCKR_LABEL,
          lockrNo: locker.LOCKR_NO,
          lockrKnd: locker.LOCKR_KND,
          lockrTypeCd: locker.LOCKR_TYPE_CD,
          // Front view positions
          frontViewX: locker.FRONT_VIEW_X,
          frontViewY: locker.FRONT_VIEW_Y,
          frontViewNumber: locker.FRONT_VIEW_NUMBER,
          // Other fields
          parentLockrCd: locker.PARENT_LOCKR_CD,
          tierLevel: locker.TIER_LEVEL,
          lockrStat: locker.LOCKR_STAT
        }
        
        // CRITICAL DEBUG: Verify actualHeight is in the transformed object
        console.log(`[LoadLockers Transform] ${transformedLocker.number}: actualHeight=${transformedLocker.actualHeight}, typeHeight=${typeHeight}`)
        
        return transformedLocker
      })
      
      // Update the store with transformed data
      lockerStore.lockers = transformedLockers
      
      // CRITICAL DEBUG: Verify actualHeight is preserved in store
      transformedLockers.forEach(locker => {
        if (locker.number === 'L3' || locker.number === 'L4') {
          console.log(`[Store Assignment] ${locker.number}: actualHeight=${locker.actualHeight} (should be 90)`)
        } else if (locker.number === 'L1' || locker.number === 'L2' || locker.number === 'L5') {
          console.log(`[Store Assignment] ${locker.number}: actualHeight=${locker.actualHeight} (should be 30)`)
        }
      })
      
      console.log('[API] Lockers loaded successfully:', transformedLockers.length)
    } else if (data.lockers) {
      // Handle case where success flag is not present but lockers exist
      // CRITICAL: Process the data instead of direct assignment to preserve actualHeight
      const transformedLockers = data.lockers.map(locker => {
        // Find matching type
        const lockerType = lockerTypes.value.find(t => t.id === locker.LOCKR_TYPE_CD)
        const typeHeight = lockerType?.height || 60
        
        return {
          id: `locker-${locker.LOCKR_CD}`,
          lockrCd: locker.LOCKR_CD,
          number: locker.LOCKR_LABEL || `L${locker.LOCKR_CD}`,
          x: locker.X || 0,
          y: locker.Y || 0,
          width: lockerType?.width || 40,
          height: lockerType?.depth || 40,
          depth: lockerType?.depth || 40,
          actualHeight: typeHeight,  // CRITICAL: Calculate actualHeight
          status: 'available',
          rotation: locker.ROTATION || 0,
          zoneId: locker.LOCKR_KND,
          typeId: locker.LOCKR_TYPE_CD,
          type: locker.LOCKR_TYPE_CD,
          color: lockerType?.color,
          // ... other fields
          compCd: locker.COMP_CD,
          bcoffCd: locker.BCOFF_CD,
          lockrLabel: locker.LOCKR_LABEL,
          lockrNo: locker.LOCKR_NO,
          lockrKnd: locker.LOCKR_KND,
          lockrTypeCd: locker.LOCKR_TYPE_CD,
          frontViewX: locker.FRONT_VIEW_X,
          frontViewY: locker.FRONT_VIEW_Y,
          frontViewNumber: locker.FRONT_VIEW_NUMBER,
          parentLockrCd: locker.PARENT_LOCKR_CD,
          tierLevel: locker.TIER_LEVEL,
          lockrStat: locker.LOCKR_STAT
        }
      })
      
      lockerStore.lockers = transformedLockers
      console.log('[API] Lockers loaded successfully (fallback path):', transformedLockers.length)
    } else {
      console.warn('[API] No lockers data in response:', data)
      lockerStore.lockers = []
    }
  } catch (error) {
    console.error('[API] Failed to load lockers:', error.message)
    // Don't throw error - just log it and continue
    lockerStore.lockers = []
  }
}

const loadLockerTypes = async () => {
  try {
    isLoadingTypes.value = true
    console.log('Loading locker types from API...')
    
    const response = await fetch(`${API_BASE_URL}/types`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Types API response:', data)
    
    if (data.success) {
      // Transform backend data to frontend format
      const transformedTypes = (data.types || []).map(type => ({
        id: type.LOCKR_TYPE_CD,
        name: type.LOCKR_TYPE_NM,
        width: type.WIDTH,
        height: type.HEIGHT,
        depth: type.DEPTH,
        color: type.COLOR || '#3b82f6',
        type: type.LOCKR_TYPE_CD
      }))
      
      lockerTypes.value = transformedTypes
      console.log('Locker types loaded and transformed:', transformedTypes.length)
    }
  } catch (error) {
    console.error('Failed to load locker types:', error)
    lockerTypes.value = []
  } finally {
    isLoadingTypes.value = false
    hasLoadedTypes.value = true
  }
}

// Save Functions
const saveZone = async (zoneData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData)
    })
    
    if (!response.ok) throw new Error('Failed to save zone')
    const result = await response.json()
    
    if (result.success) {
      await loadZones() // Refresh zones
      console.log('[API] Zone saved successfully')
      return result
    }
  } catch (error) {
    console.error('[API] Zone save failed:', error)
    saveError.value = 'Failed to save zone'
    throw error
  }
}

const saveLocker = async (lockerData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lockrs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lockerData)
    })
    
    if (!response.ok) throw new Error('Failed to save locker')
    const result = await response.json()
    
    if (result.success) {
      await loadLockers() // Refresh lockers
      console.log('[API] Locker saved successfully')
      return result
    }
  } catch (error) {
    console.error('[API] Locker save failed:', error)
    saveError.value = 'Failed to save locker'
    throw error
  }
}

const updateLockerPlacement = async (lockerId: string, placementData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lockrs/${lockerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placementData)
    })
    
    if (!response.ok) throw new Error('Failed to update locker placement')
    const result = await response.json()
    
    if (result.success) {
      console.log('[API] Locker placement updated successfully')
      return result
    }
  } catch (error) {
    console.error('[API] Locker placement update failed:', error)
    saveError.value = 'Failed to update locker placement'
    throw error
  }
}

// Helper function for saving locker position changes (with debouncing)
const saveLockerPositionDebounced = (() => {
  let timeout: any = null
  return (lockerId: string, position: { x: number, y: number }) => {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      try {
        await updateLockerPlacement(lockerId, position)
      } catch (error) {
        console.error(`Failed to save position for locker ${lockerId}:`, error)
      }
    }, 500) // Debounce for 500ms to avoid too many API calls during dragging
  }
})()

// Helper to save multiple locker positions
const saveMultipleLockerPositions = async (positions: Array<{ id: string, x: number, y: number }>) => {
  // Save all positions after drag ends
  try {
    const savePromises = positions.map(pos => {
      // Find the locker to get its database ID
      const locker = currentLockers.value.find(l => l.id === pos.id)
      if (locker && locker.lockrCd) {
        // If locker has a database ID, update its position
        return updateLockerPlacement(locker.lockrCd, { 
          X: pos.x, 
          Y: pos.y 
        })
      } else if (locker) {
        // If locker doesn't have a database ID yet, save it first
        const saveData = {
          LOCKR_KND: selectedZone.value?.id,
          LOCKR_TYPE_CD: locker.type || '1',
          X: pos.x,
          Y: pos.y,
          LOCKR_LABEL: locker.number,
          ROTATION: locker.rotation || 0,
          LOCKR_STAT: '00'
        }
        return saveLocker(saveData).then(result => {
          if (result && result.lockrCd) {
            locker.lockrCd = result.lockrCd
          }
          return result
        })
      }
    })
    
    await Promise.all(savePromises)
    console.log('[API] Saved positions for', positions.length, 'lockers')
  } catch (error) {
    console.error('[API] Failed to save some locker positions:', error)
  }
}

// Hidden/deleted locker types
const hiddenTypes = ref<string[]>([])

// Filter visible locker types
const visibleLockerTypes = computed(() => {
  return lockerTypes.value.filter(type => !hiddenTypes.value.includes(type.id))
})

// 현재 구역의 락커들
const currentLockers = computed(() => {
  if (!selectedZone.value) return []
  const filtered = lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
  
  // CRITICAL DEBUG: Check actualHeight at the start of the computed chain
  filtered.forEach(locker => {
    if (locker.number === 'L3' || locker.number === 'L4' || locker.number === 'L1' || locker.number === 'L2' || locker.number === 'L5') {
      console.log(`[CurrentLockers] ${locker.number}: actualHeight=${locker.actualHeight}, typeId=${locker.typeId}`)
    }
  })
  
  return filtered
})

// Compute display versions of lockers with scaled dimensions
const displayLockers = computed(() => {
  // Filter lockers based on view mode
  const filteredLockers = currentLockers.value.filter(locker => {
    // In floor view, only show parent lockers (no parent ID)
    if (currentViewMode.value === 'floor') {
      return !locker.parentLockerId
    }
    // In front view, show all lockers (parents and children)
    return true
  })
  
  return filteredLockers.map((locker, index) => {
    let displayX, displayY, displayHeight
    // CRITICAL FIX: Move lockerActualHeight declaration outside if/else blocks
    const lockerActualHeight = locker.actualHeight || locker.height || 60
    
    if (currentViewMode.value === 'floor') {
      // Floor view: use stored positions
      const displayPos = toDisplayCoords(locker.x, locker.y)
      displayX = displayPos.x
      displayY = displayPos.y
      displayHeight = toDisplaySize(locker.width, locker.height || locker.depth || 40).height
    } else {
      // Front view: use frontViewX and frontViewY set by transformToFrontView
      
      // Use frontView positions if available, otherwise fallback
      const scale = getCurrentScale() // 락커 렌더링 크기를 위한 스케일
      if (locker.frontViewX !== undefined && locker.frontViewY !== undefined) {
        displayX = locker.frontViewX * scale
        displayY = locker.frontViewY * scale
      } else {
        // Fallback: Calculate X position (arrange side by side)
        let currentX = 50  // Start position
        for (let i = 0; i < index; i++) {
          const prevLocker = filteredLockers[i]
          currentX += prevLocker.width + 20  // Add spacing
        }
        
        // Y position: bottom of locker sits on floor line
        displayX = currentX * scale
        displayY = (FLOOR_Y - lockerActualHeight) * scale
      }
      displayHeight = lockerActualHeight * scale
    }
    
    const displayWidth = locker.width * getCurrentScale() // 모든 뷰모드에서 동일한 렌더링 스케일 적용
    
    // CRITICAL DEBUG: Check actualHeight preservation
    console.log(`[DisplayLockers] ${locker.number}: actualHeight=${locker.actualHeight}, typeId=${locker.typeId}`)
    
    return {
      ...locker,
      displayX,
      displayY,
      displayWidth,
      displayHeight,
      // CRITICAL: Preserve actualHeight for front view - ensure it's never undefined
      actualHeight: locker.actualHeight || lockerActualHeight || 60,
      // Keep original logical values for data operations
      logicalX: locker.x,
      logicalY: locker.y,
      logicalWidth: locker.width,
      logicalHeight: locker.height || locker.depth || 40
    }
  })
})

// Z-index를 위한 정렬된 락커 배열 (선택된 락커를 마지막에 렌더링)
const sortedLockers = computed(() => {
  // Map lockers to have the right x, y, and rotation for the current view mode
  const lockers = displayLockers.value.map(locker => {
    if (currentViewMode.value === 'front') {
      // For front view, override x, y, and RESET rotation (all face forward)
      // actualHeight를 확실히 전달 (30 또는 90)
      const frontViewHeight = locker.actualHeight || locker.height || 60
      
      console.log(`[SortedLockers] ${locker.number}:`, {
        actualHeight: locker.actualHeight,
        height: locker.height,
        frontViewHeight: frontViewHeight,
        typeId: locker.typeId,
        EXPECTED_L3_L4: locker.number === 'L3' || locker.number === 'L4' ? '90px' : '30px',
        IS_CORRECT: frontViewHeight === (locker.number === 'L3' || locker.number === 'L4' ? 90 : 30) ? '✅ CORRECT' : '❌ WRONG'
      })
      
      const resultLocker = {
        ...locker,
        x: locker.frontViewX !== undefined ? locker.frontViewX : locker.displayX / getCurrentScale(),
        y: locker.frontViewY !== undefined ? locker.frontViewY : locker.displayY / getCurrentScale(),
        height: frontViewHeight,  // LockerSVG에서 이 값을 사용
        actualHeight: frontViewHeight,  // actualHeight도 명시적으로 설정
        rotation: 0  // IMPORTANT: All lockers face forward in front view
      }
      
      // FINAL DEBUG: Check final result passed to LockerSVG
      if (locker.number === 'L3' || locker.number === 'L4') {
        console.log(`[SortedLockers FINAL] ${locker.number}: height=${resultLocker.height}, actualHeight=${resultLocker.actualHeight} (FINAL RESULT TO LockerSVG)`)
      }
      
      return resultLocker
    }
    return locker
  })
  
  if (selectedLocker.value) {
    const selectedIndex = lockers.findIndex(l => l.id === selectedLocker.value.id)
    if (selectedIndex > -1) {
      // 선택된 락커를 배열 끝으로 이동
      const [selected] = lockers.splice(selectedIndex, 1)
      lockers.push(selected)
      console.log('[Canvas] Reordering lockers, selected:', selectedLocker.value.id)
    }
  }
  return lockers
})

// 선택된 락커들 (다중 선택을 위한 준비)
const selectedLockers = computed(() => {
  // 현재는 단일 선택만 지원, 추후 다중 선택 구현 시 수정
  return selectedLocker.value ? [selectedLocker.value] : []
})

// 다중 선택 모드 (향후 구현)
const isMultiSelectMode = ref(false)
const multiSelectedIds = ref<string[]>([])

// 미리보기 충돌 상태
// Direct addition mode - no preview collision tracking needed

// 뷰 모드에 따른 락커 치수 계산
// Get the actual position for selection UI (always use current locker position)
const getSelectionUIPosition = () => {
  if (!selectedLocker.value) return { x: 0, y: 0 }
  
  // Always use the current position from the locker data
  // The locker position is already being updated during drag
  const currentLocker = currentLockers.value.find(l => l.id === selectedLocker.value.id)
  if (currentLocker) {
    return {
      x: currentLocker.x,
      y: currentLocker.y
    }
  }
  
  return {
    x: selectedLocker.value.x,
    y: selectedLocker.value.y
  }
}

const getLockerDimensions = (locker) => {
  if (!locker) return { width: 0, height: 0 }
  
  if (currentViewMode.value === 'floor') {
    // Floor view (평면배치): Width x Depth
    return {
      width: locker.width || 40,
      height: locker.depth || locker.height || 40
    }
  } else {
    // Front view (세로배치): Width x Height
    return {
      width: locker.width || 40,
      height: locker.height || 60
    }
  }
}

// 키보드 회전 연속 처리를 위한 변수
let rotateInterval: number | null = null
const isRotating = ref(false)

// 복사/붙여넣기를 위한 변수
const copiedLockers = ref<any[]>([])

// 다중 선택을 위한 변수
const selectedLockerIds = ref<Set<string>>(new Set())
const lastSelectedLocker = ref<any>(null)

// 드래그 선택 박스
const isDragSelecting = ref(false)
const dragSelectStart = ref({ x: 0, y: 0 })
const dragSelectEnd = ref({ x: 0, y: 0 })
const draggedLockers = ref<any[]>([])
const dragThreshold = 5 // Minimum drag distance to start selection
const dragSelectionJustFinished = ref(false) // Flag to prevent click event after drag selection
const lockerDragJustFinished = ref(false) // Flag to prevent click event after locker dragging

// 정렬 가이드라인 시스템
interface AlignmentGuide {
  type: 'horizontal' | 'vertical'
  position: number
  lockers: string[] // 정렬된 락커 ID들
}

const alignmentGuides = ref<AlignmentGuide[]>([])
const showAlignmentGuides = ref(false)
const horizontalGuides = ref<AlignmentGuide[]>([])
const verticalGuides = ref<AlignmentGuide[]>([])
const ALIGNMENT_THRESHOLD = 5 // 5px 이내면 정렬선 표시

// 구역 선택
const selectZone = (zone) => {
  selectedZone.value = zone
  selectedLocker.value = null
}

// Show zone context menu
const showZoneContextMenuHandler = (event, zone) => {
  event.preventDefault()
  event.stopPropagation()
  
  contextMenuZone.value = zone
  zoneContextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showZoneContextMenu.value = true
  
  // Close menu when clicking elsewhere
  const closeMenu = () => {
    showZoneContextMenu.value = false
    document.removeEventListener('click', closeMenu)
  }
  document.addEventListener('click', closeMenu)
}

// Delete zone function
const deleteZone = async (zone) => {
  try {
    // Debug logging
    console.log('[DEBUG] Deleting zone:', zone)
    console.log('[DEBUG] Zone ID:', zone.id)
    console.log('[DEBUG] Zone LOCKR_KND_CD:', zone.LOCKR_KND_CD)
    console.log('[DEBUG] Full zone object:', JSON.stringify(zone, null, 2))
    
    // Check if zone has lockers
    const zoneLockers = currentLockers.value.filter(l => l.LOCKR_KND === zone.id || l.zoneId === zone.id || l.LOCKR_KND === zone.LOCKR_KND_CD)
    
    if (zoneLockers.length > 0) {
      alert(`구역 삭제 불가\n\n이 구역에 ${zoneLockers.length}개의 락커가 배치되어 있습니다.\n먼저 모든 락커를 제거해주세요.`)
      return
    }
    
    // Confirm deletion
    if (!confirm(`구역 "${zone.name}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    
    // Use LOCKR_KND_CD if available, otherwise use id
    const zoneIdToDelete = zone.LOCKR_KND_CD || zone.id
    const deleteUrl = `${API_BASE_URL}/zones/${zoneIdToDelete}`
    
    console.log('[DEBUG] DELETE URL:', deleteUrl)
    console.log('[DEBUG] Zone ID to delete:', zoneIdToDelete)
    
    // Call API
    const response = await fetch(deleteUrl, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to delete zone')
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[API] Zone deleted successfully:', zone.name)
      
      // Refresh zones
      await loadZones()
      
      // If deleted zone was selected, select another zone or clear selection
      if (selectedZone.value?.id === zone.id) {
        selectedZone.value = zones.value.length > 0 ? zones.value[0] : null
      }
      
      alert('구역이 성공적으로 삭제되었습니다.')
    }
  } catch (error) {
    console.error('[API] Zone deletion failed:', error)
    alert(`구역 삭제 중 오류가 발생했습니다:\n${error.message}`)
  } finally {
    showZoneContextMenu.value = false
  }
}

// Show type context menu
const showTypeContextMenuHandler = (event, type) => {
  event.preventDefault()
  contextMenuType.value = type
  typeContextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showTypeContextMenu.value = true
  
  const closeMenu = () => {
    showTypeContextMenu.value = false
    document.removeEventListener('click', closeMenu)
  }
  document.addEventListener('click', closeMenu)
}

// Delete locker type function
const deleteLockerType = async (type) => {
  try {
    console.log('[DEBUG] Delete type function called:', type)
    
    // Check if type has lockers
    const typeLockers = currentLockers.value.filter(l => l.LOCKR_TYPE_CD === type.id || l.type === type.id)
    
    if (typeLockers.length > 0) {
      alert(`타입 삭제 불가\n\n이 타입으로 ${typeLockers.length}개의 락커가 배치되어 있습니다.\n먼저 모든 락커를 제거해주세요.`)
      return
    }
    
    // Confirm deletion
    if (!confirm(`락커 타입 "${type.name}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    
    console.log('[DEBUG] Sending DELETE request to:', `${API_BASE_URL}/types/${type.id}`)
    
    // Call API
    const response = await fetch(`${API_BASE_URL}/types/${type.id}`, {
      method: 'DELETE'
    })
    
    console.log('[DEBUG] Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.log('[DEBUG] Error response:', errorData)
      throw new Error(errorData.message || 'Failed to delete locker type')
    }
    
    const result = await response.json()
    console.log('[DEBUG] Success response:', result)
    
    if (result.success) {
      console.log('[API] Locker type deleted successfully:', type.name)
      
      // Refresh locker types
      await loadLockerTypes()
      
      // If deleted type was selected, clear selection
      if (selectedType.value?.id === type.id) {
        selectedType.value = null
      }
      
      showTypeContextMenu.value = false
    }
  } catch (error) {
    console.error('Failed to delete locker type:', error)
    alert('락커 타입 삭제에 실패했습니다.')
  }
}

// 락커 타입 선택
const selectLockerType = (type) => {
  selectedType.value = type
  console.log('[Locker Addition] Type selected:', type)
}

// Helper function to find available position
const findAvailablePosition = (startX: number, startY: number, width: number, depth: number) => {
  let x = startX
  let y = startY
  
  // Snap to grid first
  x = Math.round(x / 20) * 20
  y = Math.round(y / 20) * 20
  
  // Check if position is available
  let attempts = 0
  const maxAttempts = 50 // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    // Check for collision at current position
    const hasCollision = currentLockers.value.some(other => {
      const otherDims = getLockerDimensions(other)
      
      // Check if there's actual overlap
      const overlapX = Math.min(x + width, other.x + otherDims.width) - Math.max(x, other.x)
      const overlapY = Math.min(y + depth, other.y + otherDims.height) - Math.max(y, other.y)
      
      return overlapX > 0 && overlapY > 0
    })
    
    if (!hasCollision) {
      return { x, y } // Found available position
    }
    
    // Try next position
    x += 20 // Move right by grid size
    if (x > canvasWidth.value - width - 100) { // If too far right, go to next row
      x = startX
      y += 20
      
      if (y > canvasHeight.value - depth - 100) { // If too far down, wrap to top
        y = 100
        startX += 20 // Shift starting X for next iteration
        x = startX
      }
    }
    
    attempts++
  }
  
  // If no position found after max attempts, return original
  console.warn('[Direct Add] Could not find collision-free position, using default')
  return { x: startX, y: startY }
}

// Direct locker addition without preview
const addLocker = async () => {
  console.log('[Direct Add] Add button clicked', {
    currentViewMode: currentViewMode.value,
    hasType: !!selectedType.value,
    hasZone: !!selectedZone.value
  })
  
  // 평면배치모드에서만 락커 추가 가능
  if (currentViewMode.value !== 'floor') {
    alert('평면배치모드에서만 락커를 추가할 수 있습니다.')
    return
  }
  
  if (!selectedType.value || !selectedZone.value) {
    alert('구역과 락커 타입을 선택해주세요.')
    return
  }
  
  // Calculate default position (left side of canvas)
  const defaultX = 100
  const defaultY = Math.round(canvasHeight.value / 3) // Upper third of canvas
  
  // Find an available position if default is occupied
  const position = findAvailablePosition(
    defaultX, 
    defaultY, 
    selectedType.value.width, 
    selectedType.value.depth
  )
  
  // Create new locker
  const newLocker = {
    id: `locker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: selectedType.value.name,
    x: position.x,
    y: position.y,
    width: selectedType.value.width,
    height: selectedType.value.depth, // In floor view, height stores depth for rendering
    depth: selectedType.value.depth,
    actualHeight: selectedType.value.height, // Store real height for 3D view
    color: selectedType.value.color,
    zone: selectedZone.value,
    zoneId: selectedZone.value.id,
    status: 'available',
    rotation: 0,
    number: `L${currentLockers.value.length + 1}`
  }
  
  console.log('[Direct Add] Creating locker:', {
    type: selectedType.value.name,
    position: position,
    dimensions: { 
      width: newLocker.width, 
      height: newLocker.height, 
      depth: newLocker.depth 
    }
  })
  
  // Save to database first (this will also add to store via loadLockers)
  try {
    const saveData = {
      LOCKR_KND: selectedZone.value.id,
      LOCKR_TYPE_CD: selectedType.value.id || selectedType.value.type,
      X: newLocker.x,
      Y: newLocker.y,
      LOCKR_LABEL: newLocker.number,
      ROTATION: newLocker.rotation || 0,
      LOCKR_STAT: '00' // available status
    }
    
    const result = await saveLocker(saveData)
    if (result && result.lockrCd) {
      console.log('[Database] Locker saved with ID:', result.lockrCd)
    }
  } catch (error) {
    console.error('[Database] Failed to save locker:', error)
    // If save fails, add locally only
    const created = lockerStore.addLocker(newLocker)
    selectedLocker.value = created
    selectedLockerIds.value.clear()
    selectedLockerIds.value.add(created.id)
    showSelectionUI.value = true
  }
  
  // Debug all locker dimensions after adding
  debugLockerDimensions()
  
  console.log('[Direct Add] Locker placed:', {
    type: selectedType.value.name,
    position: { x: position.x, y: position.y },
    dimensions: { width: newLocker.width, depth: newLocker.depth }
  })
}

// Add tiers to selected parent lockers
const addTiersToSelectedLockers = async (tierCount: number) => {
  if (currentViewMode.value !== 'front') {
    console.warn('[Tiers] Tier addition only works in front view')
    alert('층 추가는 세로배치모드(Front View)에서만 가능합니다.')
    return
  }
  
  const selectedIds = Array.from(selectedLockerIds.value)
  if (selectedIds.length === 0) {
    console.warn('[Tiers] No lockers selected')
    alert('층을 추가할 락커를 먼저 선택해주세요.')
    return
  }
  
  let addedCount = 0
  let skippedCount = 0
  
  for (const lockerId of selectedIds) {
    const locker = currentLockers.value.find(l => l.id === lockerId)
    
    // Skip if not a parent locker
    if (!locker || locker.parentLockrCd || locker.tierLevel > 0) {
      console.log(`[Tiers] Skipping ${lockerId} - not a parent locker`)
      skippedCount++
      continue
    }
    
    // Skip if no lockrCd (not saved to DB yet)
    if (!locker.lockrCd) {
      console.warn(`[Tiers] Locker ${lockerId} has no database ID`)
      skippedCount++
      continue
    }
    
    try {
      // Call API to add tiers
      // TODO: Implement lockerApi.addTiers when API module is created
      // const newTiers = await lockerApi.addTiers(locker.lockrCd, tierCount)
      
      // For now, show message that tier functionality is not yet implemented
      console.log(`[Tiers] Would add ${tierCount} tiers to locker ${locker.lockrLabel || locker.number}`)
      alert('층 추가 기능은 아직 구현 중입니다.')
      return
      
      // if (newTiers && newTiers.length > 0) {
      //   // Add new tiers to local store
      //   newTiers.forEach(tier => {
      //     lockerStore.addLocker(tier)
      //   })
      //   
      //   console.log(`[Tiers] Added ${newTiers.length} tiers to locker ${locker.lockrLabel || locker.number}`)
      //   addedCount++
      // }
    } catch (error) {
      console.error(`[Tiers] Failed to add tiers to locker ${lockerId}:`, error)
    }
  }
  
  // Show result
  if (addedCount > 0) {
    console.log(`[Tiers] Successfully added tiers to ${addedCount} locker(s)`)
    
    // Refresh locker display - use proper loadLockers to preserve actualHeight
    if (lockerStore.isOnlineMode) {
      await loadLockers()  // Use page component's loadLockers instead of store's
    }
  }
  
  if (skippedCount > 0) {
    console.log(`[Tiers] Skipped ${skippedCount} locker(s) (not parent lockers or not saved)`)
  }
}

// Helper function to show tier addition dialog
const showAddTiersDialog = () => {
  const tierCount = prompt('추가할 층 수를 입력하세요 (1-3):', '1')
  
  if (tierCount === null) return // User cancelled
  
  const count = parseInt(tierCount)
  if (isNaN(count) || count < 1 || count > 3) {
    alert('올바른 층 수를 입력해주세요 (1-3)')
    return
  }
  
  addTiersToSelectedLockers(count)
}

// Add locker by double-clicking on type card
const addLockerByDoubleClick = async (type: any) => {
  console.log('[Double-Click] Adding locker:', {
    type: type.name,
    trigger: 'double-click',
    dimensions: { width: type.width, depth: type.depth, height: type.height },
    timestamp: Date.now()
  })
  
  // Check if in floor mode
  if (currentViewMode.value !== 'floor') {
    alert('평면배치모드에서만 락커를 추가할 수 있습니다.')
    return
  }
  
  if (!selectedZone.value) {
    alert('구역을 선택해주세요.')
    return
  }
  
  // Set the selected type
  selectedType.value = type
  
  // Calculate default position
  const defaultX = 100
  const defaultY = Math.round(canvasHeight.value / 3)
  
  // Find available position with snapping
  const position = findAvailablePosition(
    defaultX,
    defaultY,
    type.width,
    type.depth || type.width
  )
  
  // 인접 락커에 스냅 시도
  const snappedPosition = snapToAdjacent(
    position.x,
    position.y,
    type.width,
    type.depth || type.width
  )
  
  // Create new locker with all required properties for snapping
  const newLocker = {
    id: `locker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: type.name,
    x: snappedPosition.x,
    y: snappedPosition.y,
    width: type.width,
    height: type.depth || type.width, // IMPORTANT: In floor view, height property stores depth!
    depth: type.depth || type.width,
    actualHeight: type.height, // Store real height for 3D view
    color: type.color, // Add type color
    rotation: 0,
    type: type.name,
    status: 'available',
    number: `L${currentLockers.value?.length + 1}`,
    zoneId: selectedZone.value.id
  }
  
  console.log('[Double-Click] Creating locker with properties:', {
    id: newLocker.id,
    type: newLocker.type,
    dimensions: { width: newLocker.width, height: newLocker.height, depth: newLocker.depth },
    position: { x: newLocker.x, y: newLocker.y }
  })
  
  // Save to database first (this will also add to store via loadLockers)
  try {
    const saveData = {
      LOCKR_KND: selectedZone.value.id,
      LOCKR_TYPE_CD: type.id || type.type,
      X: newLocker.x,
      Y: newLocker.y,
      LOCKR_LABEL: newLocker.number,
      ROTATION: newLocker.rotation || 0,
      LOCKR_STAT: '00' // available status
    }
    
    const result = await saveLocker(saveData)
    if (result && result.lockrCd) {
      console.log('[Database] Locker saved with ID:', result.lockrCd)
    }
  } catch (error) {
    console.error('[Database] Failed to save locker:', error)
    // If save fails, add locally only
    lockerStore.addLocker(newLocker)
  }
  
  // Select the newly added locker
  selectedLocker.value = created
  selectedLockerIds.value.clear()
  selectedLockerIds.value.add(created.id)
  showSelectionUI.value = true
  
  // Debug all locker dimensions after adding
  debugLockerDimensions()
  
  // Add pulse animation feedback
  const event = window.event as MouseEvent
  if (event && event.currentTarget) {
    const card = event.currentTarget as HTMLElement
    card.classList.add('pulse-animation')
    setTimeout(() => card.classList.remove('pulse-animation'), 300)
  }
  
  console.log('[Double-Click] Locker added successfully:', created)
}

// Restore deleted locker type
const restoreLockerType = (typeId: string) => {
  const index = hiddenTypes.value.indexOf(typeId)
  if (index > -1) {
    hiddenTypes.value.splice(index, 1)
  }
  console.log('[Locker Type] Restored:', typeId)
}

// Get type label from type ID
const getTypeLabel = (typeId: string) => {
  const type = lockerTypes.value.find(t => t.type === typeId)
  return type ? type.name : typeId
}

// Helper function to get correct mouse position in SVG coordinates
const getMousePosition = (event: MouseEvent) => {
  const svg = canvasRef.value
  if (!svg) return { x: 0, y: 0 }
  
  // Create an SVG point
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  
  // Transform the point to SVG coordinates
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
  
  const scale = getCurrentScale()
  console.log('[Coordinates] System check:', {
    scale: scale,
    viewMode: currentViewMode.value,
    client: { x: event.clientX, y: event.clientY },
    svg: { x: svgP.x, y: svgP.y },
    logical: { x: svgP.x, y: svgP.y },
    display: { x: svgP.x * scale, y: svgP.y * scale },
    collision: 'Using logical coordinates',
    snapping: 'Using logical coordinates'
  })
  
  // SVG coordinates are already in logical space (not display space)
  // because viewBox defines the logical coordinate system
  return {
    x: svgP.x,
    y: svgP.y
  }
}

// 캔버스 마우스 다운 처리
const handleCanvasMouseDown = (event) => {
  // Get correct SVG coordinates
  const pos = getMousePosition(event)
  const x = pos.x
  const y = pos.y
  
  console.log('[SVG Coords] Mouse down at:', { x, y })
  
  // More comprehensive check for empty space
  const target = event.target as Element
  
  // Check if target is a locker or locker element
  const isLockerElement = target.closest('[data-locker-id]') || 
                         target.tagName === 'rect' && !target.classList.contains('canvas-background') ||
                         target.tagName === 'text' ||
                         target.tagName === 'g' && target.querySelector('text') // Locker group
  
  // Empty space includes: SVG canvas, grid background, or empty rect
  const isEmptySpace = !isLockerElement && (
    target.tagName === 'svg' || 
    target.classList.contains('canvas-background') ||
    target.getAttribute('fill') === 'url(#grid)' ||
    target.classList.contains('selection-box') // Ignore selection box itself
  )
  
  console.log('[MouseDown] Target:', target.tagName, 'Classes:', target.className, 'IsEmpty:', isEmptySpace, 'IsLocker:', isLockerElement)
  
  // Only start drag selection on truly empty space
  if (isEmptySpace && !isDragging.value) {
    console.log('[Rectangle Select] Starting at', x, y)
    isDragSelecting.value = true
    dragSelectStart.value = { x, y }
    dragSelectEnd.value = { x, y }
    selectedLockerIds.value.clear() // Clear previous selection
    selectedLocker.value = null
    event.preventDefault()
    event.stopPropagation() // Prevent bubble to locker handlers
  }
}

// 캔버스 마우스 이동 처리
const handleCanvasMouseMove = (event) => {
  // Get correct SVG coordinates
  const pos = getMousePosition(event)
  const currentX = pos.x
  const currentY = pos.y
  
  if (isDragSelecting.value) {
    dragSelectEnd.value = { x: currentX, y: currentY }
    
    // Only show selection box if dragged enough distance
    const dragDistance = Math.sqrt(
      Math.pow(currentX - dragSelectStart.value.x, 2) + 
      Math.pow(currentY - dragSelectStart.value.y, 2)
    )
    
    if (dragDistance > dragThreshold) {
      // Update selection in real-time for visual feedback
      updateSelectionInRectangle()
    }
  } else if (isDragging.value) {
    handleDragMove(event)
  } else {
    // Regular mouse move (direct addition mode - no preview)
    handleMouseMove(event)
  }
}

// 캔버스 마우스 업 처리
const handleCanvasMouseUp = (event) => {
  if (isDragSelecting.value) {
    // Get correct SVG coordinates
    const pos = getMousePosition(event)
    const endX = pos.x
    const endY = pos.y
    
    // Calculate drag distance
    const dragDistance = Math.sqrt(
      Math.pow(endX - dragSelectStart.value.x, 2) + 
      Math.pow(endY - dragSelectStart.value.y, 2)
    )
    
    // Only select if dragged enough distance
    if (dragDistance > dragThreshold) {
      updateSelectionInRectangle()
      
      // Set flag to prevent immediate deselection by click event
      dragSelectionJustFinished.value = true
      console.log('[Rectangle Select] Setting dragSelectionJustFinished flag to true')
      
      // Ensure selection UI is shown after drag selection
      if (selectedLockerIds.value.size > 0) {
        showSelectionUI.value = true
      }
      
      // Clear flag after a short delay
      setTimeout(() => {
        dragSelectionJustFinished.value = false
        console.log('[Rectangle Select] Cleared dragSelectionJustFinished flag')
      }, 100)
      
      console.log('[Rectangle Select] Finished selection')
      console.log('[Rectangle Select] Start:', dragSelectStart.value, 'End:', dragSelectEnd.value)
      console.log('[Rectangle Select] Selected lockers:', Array.from(selectedLockerIds.value))
      console.log('[Rectangle Select] Current selection count:', selectedLockerIds.value.size)
    } else {
      // Just a click, clear selection
      selectedLockerIds.value.clear()
      selectedLocker.value = null
      console.log('[Rectangle Select] Cancelled - not enough drag distance')
    }
    
    // Reset drag selection state
    isDragSelecting.value = false
    dragSelectStart.value = { x: 0, y: 0 }
    dragSelectEnd.value = { x: 0, y: 0 }
  }
  
  // Also handle end of locker dragging
  if (isDragging.value) {
    endDragLocker()
  }
}

// 사각형 선택 업데이트
const updateSelectionInRectangle = () => {
  // ✅ CRITICAL FIX: Add defensive programming for undefined coordinates
  if (!dragSelectStart.value || !dragSelectEnd.value || 
      dragSelectStart.value.x == null || dragSelectStart.value.y == null ||
      dragSelectEnd.value.x == null || dragSelectEnd.value.y == null) {
    console.warn('[Rectangle Select] Invalid coordinates, skipping selection update')
    return
  }
  
  const minX = Math.min(dragSelectStart.value.x, dragSelectEnd.value.x)
  const maxX = Math.max(dragSelectStart.value.x, dragSelectEnd.value.x)
  const minY = Math.min(dragSelectStart.value.y, dragSelectEnd.value.y)
  const maxY = Math.max(dragSelectStart.value.y, dragSelectEnd.value.y)
  
  console.log('[DEBUG] Selection rectangle:', { minX, maxX, minY, maxY })
  console.log('[DEBUG] Current lockers:', currentLockers.value.map(l => ({
    id: l.id,
    x: l.x,
    y: l.y,
    width: l.width,
    height: l.height || l.depth,
    frontViewX: l.frontViewX,
    frontViewY: l.frontViewY
  })))
  
  selectedLockerIds.value.clear()
  
  currentLockers.value.forEach(locker => {
    let lockerLeft, lockerRight, lockerTop, lockerBottom
    
    if (currentViewMode.value === 'front') {
      // Use front view positions for hit detection
      const frontX = locker.frontViewX !== undefined ? locker.frontViewX : locker.x
      const frontY = locker.frontViewY !== undefined ? locker.frontViewY : locker.y
      const displayHeight = locker.actualHeight || locker.height || 60
      
      lockerLeft = frontX
      lockerRight = frontX + locker.width
      lockerTop = frontY
      lockerBottom = frontY + displayHeight
    } else {
      // Use floor view positions
      const dims = getLockerDimensions(locker)
      lockerLeft = locker.x
      lockerRight = locker.x + dims.width
      lockerTop = locker.y
      lockerBottom = locker.y + dims.height
    }
    
    console.log('[DEBUG] Checking locker:', locker.id, {
      left: lockerLeft,
      right: lockerRight,
      top: lockerTop,
      bottom: lockerBottom,
      viewMode: currentViewMode.value
    })
    
    // Check for ANY overlap (not just complete containment)
    const overlaps = !(lockerRight < minX || lockerLeft > maxX || 
                       lockerBottom < minY || lockerTop > maxY)
    
    if (overlaps) {
      console.log('[DEBUG] Locker overlaps!', locker.id)
      selectedLockerIds.value.add(locker.id)
    }
  })
  
  console.log('[DEBUG] Final selected IDs:', Array.from(selectedLockerIds.value))
  
  // Make sure visual update happens
  if (selectedLockerIds.value.size > 0) {
    const firstId = Array.from(selectedLockerIds.value)[0]
    selectedLocker.value = currentLockers.value.find(l => l.id === firstId)
    // Show selection UI immediately when lockers are selected
    showSelectionUI.value = true
  } else {
    selectedLocker.value = null
  }
}

// 캔버스 클릭 처리 (스냅 기능 추가)
const handleCanvasClick = (event) => {
  // Check if any drag operation just finished - if so, ignore this click
  if (dragSelectionJustFinished.value || lockerDragJustFinished.value) {
    console.log('[Canvas] Click ignored - drag operation just finished', {
      dragSelection: dragSelectionJustFinished.value,
      lockerDrag: lockerDragJustFinished.value
    })
    return
  }
  
  console.log('[Canvas] Click event', { 
    target: event.target.tagName,
    targetClasses: event.target.classList
  })
  
  // SVG 체크를 더 유연하게 수정
  const target = event.target
  const isBackgroundClick = target.tagName === 'svg' || 
                           target.classList.contains('canvas-background') ||
                           (target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)') ||
                           target.classList.contains('canvas')
  
  // 배경 클릭 시 선택 해제 (Ctrl/Shift 키가 없을 때만)
  if (isBackgroundClick && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
    console.log('[Canvas] Background clicked - clearing selection')
    selectedLocker.value = null
    selectedLockerIds.value.clear()
    lockerStore.selectLocker(null)
    showSelectionUI.value = false
    return
  }
  
  // 드래그 선택 시작 (Shift 또는 Ctrl 키와 함께)
  if (isBackgroundClick && (event.shiftKey || event.ctrlKey)) {
    const rect = canvasRef.value.getBoundingClientRect()
    selectionBox.value = {
      isSelecting: true,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      endX: event.clientX - rect.left,
      endY: event.clientY - rect.top
    }
    console.log('[Selection] Drag selection started')
    return
  }
  // No more placement logic needed - direct addition mode
}

// 마우스 이동 처리 (현재는 사용하지 않음 - 직접 추가 모드)
const handleMouseMove = (event) => {
  // Direct addition mode - no preview tracking needed
}

// 마우스 떠나기
const handleMouseLeave = () => {
  // Direct addition mode - no preview cleanup needed
}

// 락커 선택 (다중 선택 지원)
const selectLocker = (locker, event?) => {
  console.log('[Selection] Attempting to select in mode:', currentViewMode.value, 'Locker:', locker.id)
  
  // Check if locker dragging just finished - if so, ignore this selection
  if (lockerDragJustFinished.value) {
    console.log('[Select] Ignored - drag just finished')
    return
  }
  
  // Don't select if drag selecting
  if (isDragSelecting.value) {
    console.log('[Select] Ignored - drag selection in progress')
    return
  }
  
  if (isDragging.value) return
  
  // Ctrl/Cmd 키: 토글 선택
  if (event && (event.ctrlKey || event.metaKey)) {
    if (selectedLockerIds.value.has(locker.id)) {
      selectedLockerIds.value.delete(locker.id)
      if (selectedLocker.value?.id === locker.id) {
        // 다른 선택된 락커로 전환
        const remaining = Array.from(selectedLockerIds.value)
        selectedLocker.value = remaining.length > 0 
          ? currentLockers.value.find(l => l.id === remaining[0]) 
          : null
      }
    } else {
      selectedLockerIds.value.add(locker.id)
      selectedLocker.value = locker
    }
    showSelectionUI.value = true // Ensure UI is shown for multi-select
    console.log(`[Selection] Toggle select ${locker.id}, total: ${selectedLockerIds.value.size}`)
  }
  // Shift 키: 범위 선택
  else if (event && event.shiftKey && lastSelectedLocker.value) {
    selectRange(lastSelectedLocker.value, locker)
    showSelectionUI.value = true // Ensure UI is shown for range select
  }
  // 일반 클릭: 단일 선택
  else {
    selectedLockerIds.value.clear()
    selectedLockerIds.value.add(locker.id)
    selectedLocker.value = locker
    
    // Log button positions and rotation
    console.log('[Selection UI] Rotation applied:', {
      lockerRotation: locker.rotation || 0,
      buttonPositions: {
        left: { x: locker.width/2 - 15, y: -30 },
        right: { x: locker.width/2 + 15, y: -30 },
        delete: { x: locker.width + 15, y: -15 }
      },
      rotationCenter: { x: locker.width/2, y: locker.height/2 }
    })
    console.log('[Canvas] Single select:', locker.id)
  }
  
  lastSelectedLocker.value = locker
  lockerStore.selectLocker(locker.id)
  // Direct addition mode - no placement state to clear
  
  // Ensure selection UI is shown in both floor and front view
  showSelectionUI.value = true
  
  // Log current selection state
  console.log('[Select] Selection updated - Count:', selectedLockerIds.value.size, 'IDs:', Array.from(selectedLockerIds.value), 'ShowUI:', showSelectionUI.value)
}

// 범위 선택 함수
const selectRange = (from: any, to: any) => {
  // 두 락커 사이의 모든 락커 선택
  const fromIndex = currentLockers.value.findIndex(l => l.id === from.id)
  const toIndex = currentLockers.value.findIndex(l => l.id === to.id)
  
  if (fromIndex === -1 || toIndex === -1) return
  
  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)
  
  selectedLockerIds.value.clear()
  for (let i = start; i <= end; i++) {
    selectedLockerIds.value.add(currentLockers.value[i].id)
  }
  
  selectedLocker.value = to
  console.log(`[Selection] Range select from ${from.id} to ${to.id}, total: ${selectedLockerIds.value.size}`)
}

// 락커 드래그 시작
const startDragLocker = (locker, event) => {
  // 프론트 뷰에서는 드래그 비활성화
  if (currentViewMode.value === 'front') {
    console.log('[Front View] Drag disabled in front view mode')
    return
  }
  
  if (!locker || isDragSelecting.value) {
    console.log('[Drag] Ignored - drag selection in progress')
    return
  }
  
  // Immediately hide buttons when starting drag
  isDragging.value = true
  showSelectionUI.value = false
  
  const isCopyDrag = event.ctrlKey || event.metaKey
  console.log('[Multi-Select] Copying with drag:', isCopyDrag)
  console.log('[Drag] Started - hiding selection UI')
  
  let leaderLocker = locker // Will be reassigned if copying
  let copiedLockers = [] // Track the created copies
  
  if (isCopyDrag) {
    // Create copies of all selected lockers
    const copiesMap = new Map() // Map original ID to copy ID
    Array.from(selectedLockerIds.value).forEach(id => {
      const original = currentLockers.value.find(l => l.id === id)
      if (original) {
        const copy = {
          ...original,
          id: `locker-${Date.now()}-${Math.random()}`,
          number: `L${currentLockers.value.length + copiesMap.size + 1}`,
          x: original.x + 20, // Offset to show it's a copy
          y: original.y + 20
        }
        const newLocker = lockerStore.addLocker(copy)
        copiesMap.set(original.id, newLocker.id)
        copiedLockers.push(newLocker)
      }
    })
    
    // Clear current selection and select the copies instead
    if (copiesMap.size > 0) {
      // If the clicked locker was copied, update the leader reference
      if (copiesMap.has(locker.id)) {
        const copiedLeaderId = copiesMap.get(locker.id)
        leaderLocker = currentLockers.value.find(l => l.id === copiedLeaderId)
      }
      
      // Clear and select all copies
      selectedLockerIds.value.clear()
      copiesMap.forEach((copyId) => {
        selectedLockerIds.value.add(copyId)
      })
      selectedLocker.value = leaderLocker
      console.log('[Multi-Select] Created copies:', copiesMap.size, 'New leader:', leaderLocker.id)
    }
  }
  
  // If dragging non-selected locker (and not copying), select only this one
  if (!isCopyDrag && !selectedLockerIds.value.has(locker.id)) {
    selectedLockerIds.value.clear()
    selectedLockerIds.value.add(locker.id)
    selectedLocker.value = locker
  }
  
  isDragging.value = true
  
  // Get mouse position in SVG coordinates
  const mousePos = getMousePosition(event)
  
  // Store initial positions and relative offsets for all selected lockers
  draggedLockers.value = Array.from(selectedLockerIds.value).map(id => {
    const l = currentLockers.value.find(loc => loc.id === id)
    const relativeX = l.x - leaderLocker.x  // Relative position to leader
    const relativeY = l.y - leaderLocker.y  // Relative position to leader
    return {
      id: l.id,
      initialX: l.x,
      initialY: l.y,
      relativeX: relativeX,  // Store relative position to leader
      relativeY: relativeY,  // Store relative position to leader
      isLeader: l.id === leaderLocker.id
    }
  })
  
  // Calculate offset between mouse and leader locker position
  dragOffset.value = {
    x: mousePos.x - leaderLocker.x,
    y: mousePos.y - leaderLocker.y
  }
  
  const selectedCount = selectedLockerIds.value.size
  if (selectedCount > 1) {
    console.log('[Group Drag] Started with', selectedCount, 'lockers, leader:', leaderLocker.id)
  } else {
    console.log('[Drag] Start dragging locker:', locker.id)
  }
  event.preventDefault()
}

// 락커 회전 시작 (마우스로)
const startRotateLocker = (locker, event) => {
  if (!locker) return
  
  selectedLocker.value = locker
  isRotating.value = true
  
  // 회전 처리 로직 추가 가능
  console.log('Rotate handle clicked for locker:', locker.id)
}

// 드래그 중 마우스 이동 (정렬 가이드 표시) - 리더 기반 그룹 이동
const handleDragMove = (event) => {
  if (!isDragging.value || draggedLockers.value.length === 0) return
  
  // Get mouse position in SVG coordinates
  const mousePos = getMousePosition(event)
  
  // Find the leader locker
  const leaderInfo = draggedLockers.value.find(d => d.isLeader)
  if (!leaderInfo) return
  
  const leaderLocker = currentLockers.value.find(l => l.id === leaderInfo.id)
  if (!leaderLocker) return
  
  // Calculate new leader position (where the mouse is dragging it)
  const newLeaderX = mousePos.x - dragOffset.value.x
  const newLeaderY = mousePos.y - dragOffset.value.y
  
  // Apply snapping ONLY to the leader
  const leaderDims = getLockerDimensions(leaderLocker)
  const snappedLeaderX = snapToGrid(newLeaderX)
  const snappedLeaderY = snapToGrid(newLeaderY)
  
  // Try to snap leader to adjacent lockers
  const snappedLeader = snapToAdjacent(
    snappedLeaderX, 
    snappedLeaderY, 
    leaderDims.width, 
    leaderDims.height, 
    leaderInfo.id
  )
  
  // Calculate delta from leader's initial position
  const deltaX = snappedLeader.x - leaderInfo.initialX
  const deltaY = snappedLeader.y - leaderInfo.initialY
  
  // Store updated positions for collision checking
  const proposedPositions = []
  let hasCollision = false
  
  // First pass: Calculate all new positions
  draggedLockers.value.forEach(dragInfo => {
    const locker = currentLockers.value.find(l => l.id === dragInfo.id)
    if (locker) {
      const dims = getLockerDimensions(locker)
      
      // For leader, use the snapped position
      // For followers, maintain relative position to leader
      let newX, newY
      if (dragInfo.isLeader) {
        newX = snappedLeader.x
        newY = snappedLeader.y
      } else {
        // Maintain exact relative position to leader
        newX = snappedLeader.x + dragInfo.relativeX
        newY = snappedLeader.y + dragInfo.relativeY
      }
      
      // Canvas boundary check
      const maxX = canvasWidth.value - dims.width
      const maxY = canvasHeight.value - dims.height
      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))
      
      // Check for collisions with non-selected lockers
      const collision = checkCollisionForLocker(newX, newY, dims.width, dims.height, locker.id)
      if (collision) {
        hasCollision = true
      }
      
      proposedPositions.push({
        id: locker.id,
        x: newX,
        y: newY,
        dims: dims
      })
    }
  })
  
  // Only update if no collisions for any locker in the group
  if (!hasCollision) {
    proposedPositions.forEach(pos => {
      lockerStore.updateLocker(pos.id, { x: pos.x, y: pos.y })
      
      // Update selectedLocker if it's being dragged
      if (selectedLocker.value?.id === pos.id) {
        selectedLocker.value = { ...selectedLocker.value, x: pos.x, y: pos.y }
      }
    })
    
    console.log('[Group Drag] Moving', selectedLockerIds.value.size, 'lockers. Leader:', leaderInfo.id, 'Delta:', { 
      x: deltaX.toFixed(1), 
      y: deltaY.toFixed(1) 
    })
  } else {
    console.log('[Group Drag] Collision detected, movement blocked')
  }
}

// 드래그 종료
const endDragLocker = () => {
  // Only reset if actually dragging
  if (!isDragging.value) return
  
  // Set flag to prevent immediate click event
  lockerDragJustFinished.value = true
  console.log('[Drag] Setting lockerDragJustFinished flag to true')
  
  // Clear flag after a slightly longer delay
  setTimeout(() => {
    lockerDragJustFinished.value = false
    console.log('[Drag] Cleared lockerDragJustFinished flag')
  }, 150) // Increased from 100ms for better reliability
  
  // Save positions of all dragged lockers to database
  if (draggedLockers.value.length > 0) {
    const positions = draggedLockers.value.map(locker => ({
      id: locker.id,
      x: locker.x,
      y: locker.y
    }))
    saveMultipleLockerPositions(positions)
  }
  
  isDragging.value = false
  showSelectionUI.value = true
  dragOffset.value = { x: 0, y: 0 }
  draggedLockers.value = []
  // 가이드라인 숨기기
  showAlignmentGuides.value = false
  horizontalGuides.value = []
  verticalGuides.value = []
  
  console.log('[Drag] End dragging - Current selection count:', selectedLockerIds.value.size)
}

// 락커 배치 검증 - 문 앞이 막혔는지 확인
const validateLockerPlacement = () => {
  const errors = []
  const problematicLockers = new Set()
  
  // 락커의 문 방향 앞에 다른 락커가 있는지 체크
  const lockers = currentLockers.value
  
  for (let i = 0; i < lockers.length; i++) {
    const locker = lockers[i]
    
    // 락커의 회전 각도에 따라 문 방향 결정
    // rotation이 0도일 때 문은 앞쪽(+Y 방향)을 향함
    const rotation = locker.rotation || 0
    
    // 문 앞 영역 계산 (락커 크기만큼의 공간)
    let doorFrontArea = null
    
    if (rotation === 0 || rotation === 360) {
      // 문이 아래쪽을 향함 (+Y 방향)
      doorFrontArea = {
        minX: locker.x,
        maxX: locker.x + locker.width,
        minY: locker.y + (locker.depth || locker.height),
        maxY: locker.y + (locker.depth || locker.height) + 50 // 문 앞 최소 공간
      }
    } else if (rotation === 90) {
      // 문이 오른쪽을 향함 (+X 방향)
      doorFrontArea = {
        minX: locker.x + locker.width,
        maxX: locker.x + locker.width + 50,
        minY: locker.y,
        maxY: locker.y + (locker.depth || locker.height)
      }
    } else if (rotation === 180) {
      // 문이 위쪽을 향함 (-Y 방향)
      doorFrontArea = {
        minX: locker.x,
        maxX: locker.x + locker.width,
        minY: locker.y - 50,
        maxY: locker.y
      }
    } else if (rotation === 270) {
      // 문이 왼쪽을 향함 (-X 방향)
      doorFrontArea = {
        minX: locker.x - 50,
        maxX: locker.x,
        minY: locker.y,
        maxY: locker.y + (locker.depth || locker.height)
      }
    }
    
    // 다른 락커가 문 앞을 막고 있는지 확인
    if (doorFrontArea) {
      for (let j = 0; j < lockers.length; j++) {
        if (i === j) continue // 자기 자신은 제외
        
        const otherLocker = lockers[j]
        
        // Skip lockers from different zones
        if (locker.zoneId !== otherLocker.zoneId) continue
        const otherDepth = otherLocker.depth || otherLocker.height
        
        // 다른 락커가 문 앞 영역과 겹치는지 확인
        const overlapsX = !(otherLocker.x + otherLocker.width <= doorFrontArea.minX || 
                           otherLocker.x >= doorFrontArea.maxX)
        const overlapsY = !(otherLocker.y + otherDepth <= doorFrontArea.minY || 
                           otherLocker.y >= doorFrontArea.maxY)
        
        if (overlapsX && overlapsY) {
          // 문 앞이 막혔음
          problematicLockers.add(locker.id)
          problematicLockers.add(otherLocker.id)
          errors.push(`락커 ${locker.number}의 문 앞이 락커 ${otherLocker.number}에 의해 막혀있습니다.`)
        }
      }
    }
  }
  
  // 디버깅 로그
  if (errors.length > 0) {
    console.log('[Door Blockage Check]:', {
      blocked: true,
      errors: errors,
      problematicLockers: Array.from(problematicLockers)
    })
  } else {
    console.log('[Door Blockage Check]: All locker doors are accessible')
  }
  
  // 문 앞이 막힌 경우 세로배치 불가
  if (errors.length > 0) {
    // 에러 메시지를 하나로 통합
    errors.length = 0 // 기존 에러 제거
    errors.push('세로배치 모드 불가: 락커의 문 앞이 다른 락커에 의해 막혀있습니다.')
  }
  
  // 2. 기존 마주보는 입구 검증
  for (let i = 0; i < currentLockers.value.length; i++) {
    const locker1 = currentLockers.value[i]
    
    for (let j = i + 1; j < currentLockers.value.length; j++) {
      const locker2 = currentLockers.value[j]
      
      // 락커가 인접한지 확인
      const isAdjacentHorizontally = 
        Math.abs((locker1.x + locker1.width) - locker2.x) < 5 || 
        Math.abs((locker2.x + locker2.width) - locker1.x) < 5
      
      const isAdjacentVertically = 
        Math.abs((locker1.y + (locker1.depth || locker1.height)) - locker2.y) < 5 || 
        Math.abs((locker2.y + (locker2.depth || locker2.height)) - locker1.y) < 5
      
      if (isAdjacentHorizontally || isAdjacentVertically) {
        // 입구가 서로 마주보고 있는지 확인
        // 입구는 전면(기본 방향)에 있다고 가정
        
        // 수평으로 인접한 경우
        if (isAdjacentHorizontally) {
          const locker1FacingRight = locker1.rotation % 180 === 0
          const locker2FacingLeft = locker2.rotation % 180 === 180
          
          if ((locker1.x < locker2.x && locker1FacingRight && locker2FacingLeft) ||
              (locker2.x < locker1.x && locker2FacingLeft && locker1FacingRight)) {
            // 입구가 서로 마주보고 있음 - 허용되지 않음
            problematicLockers.add(locker1.id)
            problematicLockers.add(locker2.id)
            errors.push(`락커 ${locker1.number}와 ${locker2.number}의 입구가 마주보고 있습니다`)
          }
        }
        
        // 수직으로 인접한 경우
        if (isAdjacentVertically) {
          const locker1FacingDown = locker1.rotation % 180 === 90
          const locker2FacingUp = locker2.rotation % 180 === 270
          
          if ((locker1.y < locker2.y && locker1FacingDown && locker2FacingUp) ||
              (locker2.y < locker1.y && locker2FacingDown && locker1FacingUp)) {
            // 입구가 서로 마주보고 있음 - 허용되지 않음
            problematicLockers.add(locker1.id)
            problematicLockers.add(locker2.id)
            errors.push(`락커 ${locker1.number}와 ${locker2.number}의 입구가 마주보고 있습니다`)
          }
        }
      }
    }
  }
  
  console.log('[Placement Validation]:', {
    isValid: errors.length === 0,
    errors: errors,
    problematicLockers: Array.from(problematicLockers)
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    problematicLockers: Array.from(problematicLockers)
  }
}

// 문제가 있는 락커 강조 표시
const highlightProblematicLockers = (lockerIds: string[]) => {
  // 모든 락커의 에러 상태 초기화
  currentLockers.value.forEach(locker => {
    locker.hasError = false
  })
  
  // 문제가 있는 락커에 에러 플래그 설정
  lockerIds.forEach(id => {
    const locker = currentLockers.value.find(l => l.id === id)
    if (locker) {
      locker.hasError = true
    }
  })
}

// 뷰 모드 설정
const setViewMode = (mode: 'floor' | 'front') => {
  currentViewMode.value = mode
  updateViewMode()
  
  // 스케일 변경 로그
  console.log('[ViewMode] Switching to:', mode, {
    previousScale: mode === 'floor' ? FRONT_VIEW_SCALE : FLOOR_VIEW_SCALE,
    newScale: getCurrentScale(),
    viewMode: currentViewMode.value
  })
  
  // 스케일 변경 후 캔버스 크기 재계산
  nextTick(() => {
    updateCanvasSize()
    // 강제 재렌더링을 위한 플래그 토글 (필요시)
    // forceRerender.value++
  })
}

// 뷰 모드 업데이트
const updateViewMode = () => {
  // 프론트 뷰로 전환하려는 경우 검증 수행
  if (currentViewMode.value === 'front') {
    const validation = validateLockerPlacement()
    
    if (!validation.isValid) {
      console.log('[Validation] Cannot switch to front view:', validation.errors)
      alert('세로모드 진입 불가: 락커 배치가 규칙에 맞지 않습니다.\n문제: ' + validation.errors.join('\n'))
      
      // 문제가 있는 락커를 빨간색으로 강조
      highlightProblematicLockers(validation.problematicLockers)
      
      // 플로어 뷰로 되돌리기
      currentViewMode.value = 'floor'
      return
    }
    
    // 검증 통과 - 에러 상태 초기화
    currentLockers.value.forEach(l => l.hasError = false)
  }
  
  console.log('[View Mode] Configuration:', {
    mode: currentViewMode.value,
    floorY: FLOOR_Y,
    dimensions: currentViewMode.value === 'floor' ? 'width×depth' : 'width×height',
    interactions: currentViewMode.value === 'floor' ? 'enabled' : 'disabled'
  })
  
  isVerticalMode.value = currentViewMode.value === 'front'
  
  if (currentViewMode.value === 'front') {
    // 프론트 뷰에서는 선택 해제 및 상호작용 비활성화
    selectedLocker.value = null
    selectedLockerIds.value.clear()
    isDragging.value = false
    showSelectionUI.value = false
    console.log('[Front View] Interactions disabled, view-only mode')
    
    // 프론트 뷰 변환 수행
    transformToFrontView()
  } else {
    // 플로어 뷰로 돌아올 때 선택 UI 복원
    showSelectionUI.value = true
    console.log('[Floor View] Interactions enabled, full editing mode')
  }
  
  const newMode = currentViewMode.value === 'floor' ? 'flat' : 'vertical'
  lockerStore.setPlacementMode(newMode)
}

// 프론트 뷰 변환 - 단순화된 사용자 관점 언폴딩 로직
const transformToFrontView = () => {
  console.log('[Front View] Starting transformation with user perspective')
  
  const lockers = currentLockers.value
  
  if (lockers.length === 0) {
    console.log('[Front View] No lockers to transform')
    return
  }
  
  // Simple approach: Detect U-shape by checking if lockers form 3 sides
  const bounds = {
    minX: Math.min(...lockers.map(l => l.x)),
    maxX: Math.max(...lockers.map(l => l.x + l.width)),
    minY: Math.min(...lockers.map(l => l.y)),
    maxY: Math.max(...lockers.map(l => l.y + (l.depth || l.height)))
  }
  
  // Categorize lockers by position
  const topRow = []
  const rightColumn = []
  const bottomRow = []
  const leftColumn = []
  const middle = []
  
  lockers.forEach(locker => {
    const isTop = Math.abs(locker.y - bounds.minY) < 30
    const isBottom = Math.abs(locker.y + (locker.depth || locker.height) - bounds.maxY) < 30
    const isLeft = Math.abs(locker.x - bounds.minX) < 30
    const isRight = Math.abs(locker.x + locker.width - bounds.maxX) < 30
    
    if (isTop && !isLeft && !isRight) {
      topRow.push(locker)
    } else if (isBottom && !isLeft && !isRight) {
      bottomRow.push(locker)
    } else if (isRight && !isTop && !isBottom) {
      rightColumn.push(locker)
    } else if (isLeft && !isTop && !isBottom) {
      leftColumn.push(locker)
    } else if (isTop && isRight) {
      // Top-right corner
      rightColumn.push(locker) // Include in right column
    } else if (isBottom && isRight) {
      // Bottom-right corner
      rightColumn.push(locker) // Include in right column
    } else if (isTop && isLeft) {
      // Top-left corner
      topRow.push(locker) // Include in top row
    } else if (isBottom && isLeft) {
      // Bottom-left corner
      bottomRow.push(locker) // Include in bottom row
    } else {
      middle.push(locker)
    }
  })
  
  // Sort each group
  topRow.sort((a, b) => a.x - b.x) // Left to right
  rightColumn.sort((a, b) => a.y - b.y) // Top to bottom
  bottomRow.sort((a, b) => b.x - a.x) // Right to left
  leftColumn.sort((a, b) => b.y - a.y) // Bottom to top
  
  // Build unfolded sequence based on detected shape
  let unfoldedSequence = []
  
  // U-shape (ㄷ) pattern
  if (topRow.length > 0 && rightColumn.length > 0 && bottomRow.length > 0) {
    console.log('[U-Shape] Detected ㄷ pattern')
    unfoldedSequence = [...topRow, ...rightColumn, ...bottomRow]
    
    console.log('[U-Shape] Walking order:', {
      top: topRow.map(l => `L${l.number}`).join('→'),
      right: rightColumn.map(l => `L${l.number}`).join('→'),
      bottom: bottomRow.map(l => `L${l.number}`).join('→'),
      total: unfoldedSequence.map(l => `L${l.number}`).join('→')
    })
  }
  // Back-to-back columns
  else if (leftColumn.length > 0 && rightColumn.length > 0) {
    console.log('[Back-to-Back] Detected two columns')
    leftColumn.sort((a, b) => a.y - b.y) // Top to bottom for left
    rightColumn.sort((a, b) => b.y - a.y) // Bottom to top for right (opposite approach)
    unfoldedSequence = [...leftColumn, ...rightColumn]
  }
  // Simple row
  else {
    console.log('[Simple Row] Single line of lockers')
    unfoldedSequence = [...lockers].sort((a, b) => a.x - b.x)
  }
  
  // Add any left column lockers (for complete U or ㅁ shape)
  if (leftColumn.length > 0 && unfoldedSequence.indexOf(leftColumn[0]) === -1) {
    console.log('[Left Column] Adding left side lockers')
    unfoldedSequence.push(...leftColumn)
  }
  
  // Add any middle lockers not categorized
  if (middle.length > 0) {
    console.log('[Middle] Adding uncategorized lockers:', middle.length)
    unfoldedSequence.push(...middle)
  }
  
  // Verify all lockers are included
  const originalCount = lockers.length
  const unfoldedCount = unfoldedSequence.length
  
  if (originalCount !== unfoldedCount) {
    console.error('[Transform] Locker count mismatch!', {
      original: originalCount,
      unfolded: unfoldedCount
    })
    
    // Find missing lockers
    const unfoldedIds = new Set(unfoldedSequence.map(l => l.id))
    const missing = lockers.filter(l => !unfoldedIds.has(l.id))
    console.log('[Missing] Lockers not included:', missing.map(l => `L${l.number}`))
    
    // Add missing lockers at the end
    unfoldedSequence.push(...missing)
  }
  
  // Position lockers in front view
  positionLockersInFrontView(unfoldedSequence)
}

// 프론트 뷰에서 락커 위치 지정 - 중앙 정렬 및 간격 없음
const positionLockersInFrontView = (lockerSequence) => {
  // 전체 락커 너비 계산 (간격 없이)
  const totalLockersWidth = lockerSequence.reduce((total, locker) => {
    return total + locker.width;
  }, 0);
  
  // 캔버스 너비 사용 (ref 변수이므로 .value 사용)
  const availableWidth = canvasWidth.value;
  
  // 중앙 정렬을 위한 시작 X 계산
  const startX = (availableWidth - totalLockersWidth) / 2;
  
  let currentX = startX;
  
  lockerSequence.forEach((locker, index) => {
    // In front view, all lockers face forward (no rotation)
    const displayHeight = locker.actualHeight || locker.height || 60
    const displayWidth = locker.width // Always use original width
    
    // CRITICAL: Check height for L3 and L4
    if (locker.number === 'L3' || locker.number === 'L4') {
      console.log(`[CRITICAL] ${locker.number} HEIGHT CHECK:`, {
        actualHeight: locker.actualHeight,
        shouldBe90: locker.actualHeight === 90,
        typeId: locker.typeId,
        displayHeight: displayHeight
      })
    }
    
    // Update via store to maintain reactivity and preserve actualHeight
    lockerStore.updateLocker(locker.id, {
      frontViewX: currentX,
      frontViewY: FLOOR_Y - displayHeight,
      frontViewRotation: 0  // All lockers face forward
    })
    
    currentX += displayWidth // 간격 제거 (기존 + 5 제거)
    
    console.log(`[TransformToFront] ${locker.number}:`, {
      actualHeight: locker.actualHeight,
      yPosition: locker.frontViewY,
      floorY: FLOOR_Y,
      calculatedY: `${FLOOR_Y} - ${displayHeight} = ${FLOOR_Y - displayHeight}`
    })
  })
  
  console.log('[Front View] All lockers facing forward (user perspective)')
  console.log('[Front View] Transformation complete:', {
    totalLockers: lockerSequence.length,
    totalWidth: totalLockersWidth,
    startX: startX,
    canvasWidth: availableWidth
  })
}

// Note: Old complex detection functions removed - now using simplified approach in transformToFrontView
// The new approach directly categorizes lockers by position (top/right/bottom/left) 
// and builds the walking sequence based on detected patterns

// 뷰 모드 토글 (평면/세로) - Keep for backwards compatibility
const toggleVerticalMode = () => {
  console.log('[DEBUG] Before toggle:', currentViewMode.value)
  currentViewMode.value = currentViewMode.value === 'floor' ? 'front' : 'floor'
  console.log('[DEBUG] After toggle:', currentViewMode.value)
  console.log('[DEBUG] Button should be:', currentViewMode.value === 'floor' ? 'ENABLED' : 'DISABLED')
  updateViewMode()
}

// 선택된 락커 삭제
const deleteSelectedLocker = () => {
  console.log('[UI] Button clicked: delete')
  deleteSelectedLockers()
}

// 다중 선택된 락커 삭제
const deleteSelectedLockers = () => {
  const lockersToDelete = selectedLockerIds.value.size > 0 
    ? Array.from(selectedLockerIds.value)
    : selectedLocker.value ? [selectedLocker.value.id] : []
  
  if (lockersToDelete.length === 0) return
  
  const parentLockersWithChildren = []
  
  // Check for parent lockers with children
  lockersToDelete.forEach(lockerId => {
    const locker = currentLockers.value.find(l => l.id === lockerId)
    if (locker && !locker.parentLockerId) {
      // This is a parent locker
      const hasChildren = currentLockers.value.some(l => l.parentLockerId === lockerId)
      if (hasChildren) {
        parentLockersWithChildren.push(locker)
      }
    }
  })
  
  // If parent lockers have children, show confirmation
  if (parentLockersWithChildren.length > 0) {
    const lockerNumbers = parentLockersWithChildren.map(l => l.number || 'unnamed').join(', ')
    const confirmed = confirm(
      `락커 ${lockerNumbers}에 배치된 상위 락커가 있습니다.\n` +
      `삭제하시면 배치된 모든 상위 락커가 함께 삭제됩니다.\n` +
      `계속하시겠습니까?`
    )
    
    if (!confirmed) return
    
    // Add all child lockers to deletion list
    parentLockersWithChildren.forEach(parent => {
      const children = currentLockers.value.filter(l => l.parentLockerId === parent.id)
      children.forEach(child => {
        lockersToDelete.push(child.id)
      })
    })
  } else {
    // Regular confirmation for lockers without children
    const count = lockersToDelete.length
    if (!confirm(`삭제하시겠습니까? (${count}개 락커)`)) {
      return
    }
  }
  
  // Proceed with deletion
  lockersToDelete.forEach(id => {
    lockerStore.deleteLocker(id)
  })
  
  selectedLockerIds.value.clear()
  selectedLocker.value = null
  console.log('[Delete] Deleted lockers:', lockersToDelete)
}

// Context menu and number management functions
// Find smallest unassigned number
const findSmallestUnassignedNumber = () => {
  const isFloorView = currentViewMode.value === 'floor'
  const assignedNumbers = new Set(
    currentLockers.value
      .map(l => {
        const num = isFloorView ? l.number : l.frontViewNumber
        return parseInt(num?.replace('L', '')) || 0
      })
      .filter(n => n > 0)
  )
  let num = 1
  while (assignedNumbers.has(num)) num++
  return num
}

// Check for gaps in numbering
const findNumberGaps = () => {
  const isFloorView = currentViewMode.value === 'floor'
  const numbers = currentLockers.value
    .map(l => {
      const num = isFloorView ? l.number : l.frontViewNumber
      return parseInt(num?.replace('L', '')) || 0
    })
    .filter(n => n > 0)
    .sort((a, b) => a - b)
  
  if (numbers.length === 0) return []
  
  const gaps = []
  for (let i = 1; i < numbers[numbers.length - 1]; i++) {
    if (!numbers.includes(i)) gaps.push(`L${i}`)
  }
  return gaps
}

// Show context menu
const showContextMenu = (event: MouseEvent) => {
  // Only show in front view mode (세로배치모드)
  if (currentViewMode.value !== 'front') return
  
  // Only show if lockers are selected
  if (selectedLockerIds.value.size === 0) return
  
  event.preventDefault()
  contextMenuVisible.value = true
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
}

// Hide context menu
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// Show floor input dialog
const showFloorInputDialog = () => {
  hideContextMenu()
  floorInputVisible.value = true
  floorCount.value = 1
}

// Add floors (단수 입력)
const addFloors = () => {
  const count = Number(floorCount.value)
  if (count < 1 || count > 10) {
    alert('1층부터 10층까지 입력 가능합니다.')
    return
  }
  
  if (currentViewMode.value !== 'front') {
    alert('단수 추가는 세로배치모드(Front View)에서만 가능합니다.')
    return
  }
  
  const selectedLockers = Array.from(selectedLockerIds.value).map(id =>
    currentLockers.value.find(l => l.id === id)
  ).filter(Boolean)
  
  selectedLockers.forEach(targetLocker => {
    // Find the base parent (if selected locker is a child)
    let parentLocker = targetLocker
    if (targetLocker.parentLockerId) {
      parentLocker = currentLockers.value.find(l => l.id === targetLocker.parentLockerId)
      if (!parentLocker) return
    }
    
    // Find highest tier for this parent
    const existingChildren = currentLockers.value.filter(l => l.parentLockerId === parentLocker.id)
    const maxTier = Math.max(0, ...existingChildren.map(c => c.tierLevel || 0))
    
    // Create new tier lockers
    for (let i = 1; i <= count; i++) {
      const newTierLevel = maxTier + i
      const tierHeight = 60 // Standard tier height
      const gap = 10 // Gap between tiers
      
      const newLocker = {
        number: '', // Will be assigned via "번호 부여" in floor view
        x: parentLocker.x, // Same X as parent in floor view
        y: parentLocker.y, // Same Y as parent in floor view
        width: parentLocker.width,
        height: tierHeight,
        depth: parentLocker.depth,
        status: 'available' as LockerStatus,
        rotation: parentLocker.rotation || 0,
        zoneId: parentLocker.zoneId,
        typeId: parentLocker.typeId,
        
        // Parent-child relationship
        parentLockerId: parentLocker.id,
        tierLevel: newTierLevel,
        
        // Front view position (stack above)
        frontViewX: parentLocker.frontViewX || parentLocker.x,
        frontViewY: (parentLocker.frontViewY || parentLocker.y) - ((tierHeight + gap) * newTierLevel),
        frontViewNumber: '', // Will be assigned via "번호 부여" in front view
        actualHeight: tierHeight,
        
        // Visibility
        isVisible: true
      }
      
      const created = lockerStore.addLocker(newLocker)
      
      // Update parent's child list
      if (!parentLocker.childLockerIds) {
        parentLocker.childLockerIds = []
      }
      parentLocker.childLockerIds.push(created.id)
    }
  })
  
  floorInputVisible.value = false
  console.log(`[Context Menu] Added ${count} tiers to ${selectedLockers.length} lockers`)
  
  // Refresh the view to show new tiers
  updateViewMode()
}

// Show number assignment dialog
const showNumberAssignDialog = () => {
  hideContextMenu()
  numberAssignVisible.value = true
  startNumber.value = findSmallestUnassignedNumber()
  numberDirection.value = 'horizontal'
  reverseDirection.value = false
  fromTop.value = false
}

// Assign numbers (번호 부여)
const assignNumbers = () => {
  const start = Number(startNumber.value)
  const isFloorView = currentViewMode.value === 'floor'
  
  // Check if start number is already assigned based on view mode
  const existingLocker = currentLockers.value.find(l => {
    const checkNumber = isFloorView ? l.number : l.frontViewNumber
    return parseInt(checkNumber?.replace('L', '')) === start
  })
  
  if (existingLocker) {
    alert(`L${start} 번호는 이미 사용중입니다.`)
    return
  }
  
  // Get selected lockers
  const selectedLockers = Array.from(selectedLockerIds.value).map(id =>
    currentLockers.value.find(l => l.id === id)
  ).filter(Boolean)
  
  // Sort lockers based on direction and options
  let sortedLockers = [...selectedLockers]
  
  if (numberDirection.value === 'horizontal') {
    // Sort by X position (left to right)
    if (isFloorView) {
      sortedLockers.sort((a, b) => a.x - b.x)
    } else {
      // In front view, use frontViewX if available
      sortedLockers.sort((a, b) => (a.frontViewX || a.x) - (b.frontViewX || b.x))
    }
    if (reverseDirection.value) sortedLockers.reverse()
  } else {
    // Sort by Y position
    if (isFloorView) {
      if (fromTop.value) {
        sortedLockers.sort((a, b) => a.y - b.y)
      } else {
        sortedLockers.sort((a, b) => b.y - a.y)
      }
    } else {
      // In front view, use frontViewY
      if (fromTop.value) {
        sortedLockers.sort((a, b) => (a.frontViewY || a.y) - (b.frontViewY || b.y))
      } else {
        sortedLockers.sort((a, b) => (b.frontViewY || b.y) - (a.frontViewY || a.y))
      }
    }
    if (reverseDirection.value) sortedLockers.reverse()
  }
  
  // Assign numbers based on view mode
  let currentNum = start
  const assignedNumbers = new Set(
    currentLockers.value
      .map(l => {
        const num = isFloorView ? l.number : l.frontViewNumber
        return parseInt(num?.replace('L', '')) || 0
      })
      .filter(n => n > 0)
  )
  
  sortedLockers.forEach(locker => {
    // Skip already assigned numbers
    while (assignedNumbers.has(currentNum)) {
      currentNum++
    }
    
    // Update the appropriate number field based on view mode
    if (isFloorView) {
      lockerStore.updateLocker(locker.id, { number: `L${currentNum}` })
    } else {
      lockerStore.updateLocker(locker.id, { frontViewNumber: `L${currentNum}` })
    }
    currentNum++
  })
  
  // Check for gaps after assignment
  const gaps = findNumberGaps()
  if (gaps.length > 0) {
    alert(`주의: 중간에 빈 번호가 있습니다: ${gaps.join(', ')}`)
  }
  
  numberAssignVisible.value = false
  console.log(`[Context Menu] Assigned numbers to ${sortedLockers.length} lockers`)
}

// Delete numbers (번호 삭제)
const deleteNumbers = () => {
  hideContextMenu()
  
  if (confirm('선택된 락커의 번호를 삭제하시겠습니까?')) {
    const isFloorView = currentViewMode.value === 'floor'
    Array.from(selectedLockerIds.value).forEach(id => {
      // Delete the appropriate number based on view mode
      if (isFloorView) {
        lockerStore.updateLocker(id, { number: '' })
      } else {
        lockerStore.updateLocker(id, { frontViewNumber: '' })
      }
    })
    console.log(`[Context Menu] Deleted ${isFloorView ? 'floor' : 'front view'} numbers from ${selectedLockerIds.value.size} lockers`)
  }
}

// 그리드에 스냅
const snapToGrid = (value: number, gridSize: number = 20): number => {
  return Math.round(value / gridSize) * gridSize
}

// 인접 락커에 스냅 - 지능형 모서리 정렬 (수정된 버전)
const snapToAdjacent = (x: number, y: number, width: number, height: number, excludeId?: string) => {
  const SNAP_THRESHOLD = 20
  const EDGE_ALIGN_THRESHOLD = 40  // Increased threshold for better detection
  
  let snappedX = x
  let snappedY = y
  let snapped = false
  
  for (const locker of currentLockers.value) {
    if (locker.id === excludeId) continue
    
    const lockerWidth = locker.width
    const lockerHeight = locker.height || locker.depth || 50
    
    // Check horizontal adjacency (left/right snapping)
    const rightGap = Math.abs((locker.x + lockerWidth) - x)
    const leftGap = Math.abs(locker.x - (x + width))
    
    if (rightGap < SNAP_THRESHOLD) {
      // Snapping to the right of existing locker
      snappedX = locker.x + lockerWidth
      
      // Now check vertical alignment
      const topDiff = Math.abs(y - locker.y)
      const bottomDiff = Math.abs((y + height) - (locker.y + lockerHeight))
      
      // IMPORTANT: Check BOTH top and bottom alignment
      if (topDiff < bottomDiff && topDiff < EDGE_ALIGN_THRESHOLD) {
        // Align tops
        snappedY = locker.y
        console.log('[Snap] RIGHT + TOP alignment')
      } else if (bottomDiff < EDGE_ALIGN_THRESHOLD) {
        // Align bottoms - THIS IS THE KEY FIX
        snappedY = locker.y + lockerHeight - height
        console.log('[Snap] RIGHT + BOTTOM alignment')
      }
      snapped = true
    } else if (leftGap < SNAP_THRESHOLD) {
      // Snapping to the left of existing locker
      snappedX = locker.x - width
      
      // Check vertical alignment
      const topDiff = Math.abs(y - locker.y)
      const bottomDiff = Math.abs((y + height) - (locker.y + lockerHeight))
      
      if (topDiff < bottomDiff && topDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = locker.y
        console.log('[Snap] LEFT + TOP alignment')
      } else if (bottomDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = locker.y + lockerHeight - height
        console.log('[Snap] LEFT + BOTTOM alignment')
      }
      snapped = true
    }
    
    // Check vertical adjacency (top/bottom snapping)
    const bottomGap = Math.abs((locker.y + lockerHeight) - y)
    const topGap = Math.abs(locker.y - (y + height))
    
    if (bottomGap < SNAP_THRESHOLD) {
      // Snapping below existing locker
      snappedY = locker.y + lockerHeight
      
      // Check horizontal alignment
      const leftDiff = Math.abs(x - locker.x)
      const rightDiff = Math.abs((x + width) - (locker.x + lockerWidth))
      
      if (leftDiff < rightDiff && leftDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = locker.x
        console.log('[Snap] BOTTOM + LEFT alignment')
      } else if (rightDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = locker.x + lockerWidth - width
        console.log('[Snap] BOTTOM + RIGHT alignment')
      }
      snapped = true
    } else if (topGap < SNAP_THRESHOLD) {
      // Snapping above existing locker
      snappedY = locker.y - height
      
      const leftDiff = Math.abs(x - locker.x)
      const rightDiff = Math.abs((x + width) - (locker.x + lockerWidth))
      
      if (leftDiff < rightDiff && leftDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = locker.x
        console.log('[Snap] TOP + LEFT alignment')
      } else if (rightDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = locker.x + lockerWidth - width
        console.log('[Snap] TOP + RIGHT alignment')
      }
      snapped = true
    }
  }
  
  if (!snapped) {
    console.log('[Snap] No snapping occurred')
  }
  
  return { x: snappedX, y: snappedY }
}

// 락커 충돌 체크
const checkCollisionForLocker = (x: number, y: number, width: number, height: number, excludeId: string | null = null): boolean => {
  return currentLockers.value.some(other => {
    // Exclude the dragged locker
    if (other.id === excludeId) return false
    
    // During group drag, exclude all selected lockers from collision check
    if (isDragging.value && selectedLockerIds.value.has(other.id)) return false
    
    const otherDims = getLockerDimensions(other)
    
    return !(x >= other.x + otherDims.width ||
             x + width <= other.x ||
             y >= other.y + otherDims.height ||
             y + height <= other.y)
  })
}

// 충돌 체크 함수 - 인접 배치는 허용
const checkCollision = (locker, x, y, excludeId = null) => {
  return currentLockers.value.some(other => {
    if (other.id === locker.id || other.id === excludeId) return false
    
    // 회전을 고려한 충돌 체크
    const l1 = { x, y, width: locker.width, height: locker.height || locker.depth }
    const l2 = { x: other.x, y: other.y, width: other.width, height: other.height || other.depth }
    
    // 회전 각도에 따라 width/height 교체
    if (locker.rotation % 180 === 90) {
      const temp = l1.width
      l1.width = l1.height
      l1.height = temp
    }
    if (other.rotation % 180 === 90) {
      const temp = l2.width
      l2.width = l2.height
      l2.height = temp
    }
    
    // Calculate actual overlap (negative means gap, positive means overlap)
    const overlapX = Math.min(l1.x + l1.width, l2.x + l2.width) - 
                     Math.max(l1.x, l2.x)
    const overlapY = Math.min(l1.y + l1.height, l2.y + l2.height) - 
                     Math.max(l1.y, l2.y)
    
    // Only consider it a collision if there's actual overlap (not just touching)
    const hasOverlap = overlapX > 0 && overlapY > 0
    
    if (hasOverlap) {
      console.log('[Collision] Overlap detected with', other.id, 
                  'overlapX:', overlapX, 'overlapY:', overlapY)
    }
    
    return hasOverlap
  })
}

// 스냅 계산 함수 - 완전히 다시 작성
const calculateSnap = (locker, targetX, targetY) => {
  const SNAP_DISTANCE = 20  // Increase from 15 to 20 for better detection
  const EXACT_SNAP_DISTANCE = 5  // For already touching lockers
  
  let snapX = targetX
  let snapY = targetY
  let hasSnapped = false
  
  const lockerDims = getLockerDimensions(locker)
  
  console.log('[Snap] Trying to snap locker with dims:', lockerDims, 'at position:', targetX, targetY)
  
  // 각 락커에 대해 스냅 가능성 체크
  currentLockers.value.forEach(other => {
    if (other.id === locker.id) return
    
    const otherDims = getLockerDimensions(other)
    
    // Calculate exact adjacent positions
    const rightEdge = other.x + otherDims.width
    const leftEdge = other.x
    const bottomEdge = other.y + otherDims.height
    const topEdge = other.y
    
    // 수평 스냅 (좌우로 붙이기)
    const rightDistance = Math.abs(targetX - rightEdge)
    const leftDistance = Math.abs((targetX + lockerDims.width) - leftEdge)
    
    // Check Y overlap for horizontal snapping
    const yOverlap = !(targetY >= bottomEdge || (targetY + lockerDims.height) <= topEdge)
    
    if (yOverlap) {
      // Snap to right side
      if (rightDistance <= SNAP_DISTANCE) {
        snapX = rightEdge  // Exactly adjacent
        hasSnapped = true
        console.log(`[Snap] Snapped to RIGHT of locker ${other.number} at X:${snapX} (distance was ${rightDistance}px)`)
      }
      // Snap to left side
      else if (leftDistance <= SNAP_DISTANCE) {
        snapX = leftEdge - lockerDims.width  // Exactly adjacent
        hasSnapped = true
        console.log(`[Snap] Snapped to LEFT of locker ${other.number} at X:${snapX} (distance was ${leftDistance}px)`)
      }
    }
    
    // 수직 스냅 (위아래로 붙이기)
    const bottomDistance = Math.abs(targetY - bottomEdge)
    const topDistance = Math.abs((targetY + lockerDims.height) - topEdge)
    
    // Check X overlap for vertical snapping
    const xOverlap = !(targetX >= rightEdge || (targetX + lockerDims.width) <= leftEdge)
    
    if (xOverlap) {
      // Snap to bottom
      if (bottomDistance <= SNAP_DISTANCE) {
        snapY = bottomEdge  // Exactly adjacent
        hasSnapped = true
        console.log(`[Snap] Snapped to BOTTOM of locker ${other.number} at Y:${snapY} (distance was ${bottomDistance}px)`)
      }
      // Snap to top
      else if (topDistance <= SNAP_DISTANCE) {
        snapY = topEdge - lockerDims.height  // Exactly adjacent
        hasSnapped = true
        console.log(`[Snap] Snapped to TOP of locker ${other.number} at Y:${snapY} (distance was ${topDistance}px)`)
      }
    }
    
    // 정렬 스냅 (같은 줄에 정렬) - only if not already snapped
    if (!hasSnapped) {
      // Y축 정렬
      if (Math.abs(targetY - topEdge) <= SNAP_DISTANCE) {
        snapY = topEdge
        console.log(`[Snap] Aligned Y with locker ${other.number} at Y:${snapY}`)
      }
      
      // X축 정렬
      if (Math.abs(targetX - leftEdge) <= SNAP_DISTANCE) {
        snapX = leftEdge
        console.log(`[Snap] Aligned X with locker ${other.number} at X:${snapX}`)
      }
    }
  })
  
  return {
    snapX,
    snapY,
    hasSnapped
  }
}

// 정렬 가이드 찾기
const findAlignmentGuides = (movingLocker: any) => {
  const guides: AlignmentGuide[] = []
  const processedH = new Set<number>()
  const processedV = new Set<number>()
  
  currentLockers.value.forEach(locker => {
    if (locker.id === movingLocker.id) return
    
    // 수평 정렬 체크 (상단, 중앙, 하단)
    // 상단 정렬
    if (Math.abs(movingLocker.y - locker.y) < ALIGNMENT_THRESHOLD) {
      const pos = locker.y
      if (!processedH.has(pos)) {
        guides.push({
          type: 'horizontal',
          position: pos,
          lockers: [locker.id]
        })
        processedH.add(pos)
      }
    }
    
    // 중앙 수평 정렬
    const centerY1 = movingLocker.y + movingLocker.height / 2
    const centerY2 = locker.y + locker.height / 2
    if (Math.abs(centerY1 - centerY2) < ALIGNMENT_THRESHOLD) {
      const pos = centerY2
      if (!processedH.has(pos)) {
        guides.push({
          type: 'horizontal',
          position: pos,
          lockers: [locker.id]
        })
        processedH.add(pos)
      }
    }
    
    // 하단 정렬
    const bottom1 = movingLocker.y + movingLocker.height
    const bottom2 = locker.y + locker.height
    if (Math.abs(bottom1 - bottom2) < ALIGNMENT_THRESHOLD) {
      const pos = bottom2
      if (!processedH.has(pos)) {
        guides.push({
          type: 'horizontal',
          position: pos,
          lockers: [locker.id]
        })
        processedH.add(pos)
      }
    }
    
    // 수직 정렬 체크 (왼쪽, 중앙, 오른쪽)
    // 왼쪽 정렬
    if (Math.abs(movingLocker.x - locker.x) < ALIGNMENT_THRESHOLD) {
      const pos = locker.x
      if (!processedV.has(pos)) {
        guides.push({
          type: 'vertical',
          position: pos,
          lockers: [locker.id]
        })
        processedV.add(pos)
      }
    }
    
    // 중앙 수직 정렬
    const centerX1 = movingLocker.x + movingLocker.width / 2
    const centerX2 = locker.x + locker.width / 2
    if (Math.abs(centerX1 - centerX2) < ALIGNMENT_THRESHOLD) {
      const pos = centerX2
      if (!processedV.has(pos)) {
        guides.push({
          type: 'vertical',
          position: pos,
          lockers: [locker.id]
        })
        processedV.add(pos)
      }
    }
    
    // 오른쪽 정렬
    const right1 = movingLocker.x + movingLocker.width
    const right2 = locker.x + locker.width
    if (Math.abs(right1 - right2) < ALIGNMENT_THRESHOLD) {
      const pos = right2
      if (!processedV.has(pos)) {
        guides.push({
          type: 'vertical',
          position: pos,
          lockers: [locker.id]
        })
        processedV.add(pos)
      }
    }
  })
  
  return guides
}

// 스마트 스냅 (줄맞춤 우선)
const smartSnap = (position: {x: number, y: number}, size: {width: number, height: number}) => {
  let snapped = { ...position }
  let alignmentInfo = { x: null, y: null }
  
  currentLockers.value.forEach(locker => {
    // 수평 줄맞춤 (Y축)
    const alignments = [
      { type: 'top-to-top', diff: Math.abs(position.y - locker.y), snapY: locker.y },
      { type: 'bottom-to-bottom', diff: Math.abs((position.y + size.height) - (locker.y + locker.height)), snapY: locker.y + locker.height - size.height },
      { type: 'center-to-center-y', diff: Math.abs((position.y + size.height/2) - (locker.y + locker.height/2)), snapY: locker.y + locker.height/2 - size.height/2 },
      { type: 'top-to-bottom', diff: Math.abs(position.y - (locker.y + locker.height)), snapY: locker.y + locker.height },
      { type: 'bottom-to-top', diff: Math.abs((position.y + size.height) - locker.y), snapY: locker.y - size.height },
    ]
    
    // 가장 가까운 수평 정렬 찾기
    const closestY = alignments.reduce((min, curr) => curr.diff < min.diff ? curr : min)
    if (closestY.diff < ALIGNMENT_THRESHOLD) {
      snapped.y = closestY.snapY
      alignmentInfo.y = closestY.type
      console.log(`[Alignment] Y-axis: ${closestY.type} with locker ${locker.number}`)
    }
    
    // 수직 줄맞춤 (X축)
    const xAlignments = [
      { type: 'left-to-left', diff: Math.abs(position.x - locker.x), snapX: locker.x },
      { type: 'right-to-right', diff: Math.abs((position.x + size.width) - (locker.x + locker.width)), snapX: locker.x + locker.width - size.width },
      { type: 'center-to-center-x', diff: Math.abs((position.x + size.width/2) - (locker.x + locker.width/2)), snapX: locker.x + locker.width/2 - size.width/2 },
      { type: 'left-to-right', diff: Math.abs(position.x - (locker.x + locker.width)), snapX: locker.x + locker.width },
      { type: 'right-to-left', diff: Math.abs((position.x + size.width) - locker.x), snapX: locker.x - size.width },
    ]
    
    // 가장 가까운 수직 정렬 찾기
    const closestX = xAlignments.reduce((min, curr) => curr.diff < min.diff ? curr : min)
    if (closestX.diff < ALIGNMENT_THRESHOLD) {
      snapped.x = closestX.snapX
      alignmentInfo.x = closestX.type
      console.log(`[Alignment] X-axis: ${closestX.type} with locker ${locker.number}`)
    }
  })
  
  return { ...snapped, alignmentInfo }
}

// 근접한 락커들을 그룹으로 분류
const groupNearbyLockers = () => {
  const groups: any[][] = []
  const visited = new Set<string>()
  const PROXIMITY_THRESHOLD = 100 // 100px 이내 락커는 같은 그룹
  
  currentLockers.value.forEach(locker => {
    if (visited.has(locker.id)) return
    
    const group = [locker]
    visited.add(locker.id)
    
    // BFS로 근접한 락커 찾기
    const queue = [locker]
    while (queue.length > 0) {
      const current = queue.shift()!
      
      currentLockers.value.forEach(other => {
        if (visited.has(other.id)) return
        
        const distance = Math.sqrt(
          Math.pow(current.x - other.x, 2) + 
          Math.pow(current.y - other.y, 2)
        )
        
        if (distance < PROXIMITY_THRESHOLD) {
          group.push(other)
          visited.add(other.id)
          queue.push(other)
        }
      })
    }
    
    groups.push(group)
  })
  
  return groups
}

// 그룹을 격자형으로 정렬
const alignGroupToGrid = (group: any[], anchor: any) => {
  // 같은 행에 있는 락커들 정렬
  const rows = new Map<number, any[]>()
  
  group.forEach(locker => {
    // Y 좌표가 비슷한 락커들을 같은 행으로 분류
    let rowY = -1
    for (const [y, row] of rows.entries()) {
      if (Math.abs(locker.y - y) < 30) { // 30px 이내면 같은 행
        rowY = y
        break
      }
    }
    
    if (rowY === -1) {
      rowY = locker.y
      rows.set(rowY, [])
    }
    
    rows.get(rowY)!.push(locker)
  })
  
  // 각 행 정렬
  let currentY = anchor.y
  const sortedRows = Array.from(rows.entries()).sort((a, b) => a[0] - b[0])
  
  sortedRows.forEach(([_, lockersInRow]) => {
    // 행 내에서 X 좌표로 정렬
    lockersInRow.sort((a, b) => a.x - b.x)
    
    let currentX = anchor.x
    lockersInRow.forEach(locker => {
      // 락커 위치 업데이트 (간격 없이 붙이기)
      lockerStore.updateLocker(locker.id, {
        x: currentX,
        y: currentY
      })
      
      // 다음 락커 X 위치 (간격 없이 붙이기)
      currentX += locker.width
    })
    
    // 다음 행 Y 위치 (가장 높은 락커 기준)
    const maxHeight = Math.max(...lockersInRow.map(l => l.height))
    currentY += maxHeight
  })
}

// 선택 박스 내 락커들 업데이트
const updateSelectedLockersInBox = () => {
  if (!selectionBox.value.isSelecting) return
  
  const box = {
    left: Math.min(selectionBox.value.startX, selectionBox.value.endX),
    right: Math.max(selectionBox.value.startX, selectionBox.value.endX),
    top: Math.min(selectionBox.value.startY, selectionBox.value.endY),
    bottom: Math.max(selectionBox.value.startY, selectionBox.value.endY)
  }
  
  // 박스 내에 있는 락커들 찾기
  selectedLockerIds.value.clear()
  currentLockers.value.forEach(locker => {
    const lockerBounds = {
      left: locker.x,
      right: locker.x + locker.width,
      top: locker.y,
      bottom: locker.y + locker.height
    }
    
    // 락커가 선택 박스와 겹치는지 확인
    if (!(lockerBounds.right < box.left || 
          lockerBounds.left > box.right || 
          lockerBounds.bottom < box.top || 
          lockerBounds.top > box.bottom)) {
      selectedLockerIds.value.add(locker.id)
    }
  })
  
  // 첫 번째 선택된 락커를 메인 선택으로
  if (selectedLockerIds.value.size > 0) {
    const firstId = Array.from(selectedLockerIds.value)[0]
    selectedLocker.value = currentLockers.value.find(l => l.id === firstId)
  } else {
    selectedLocker.value = null
  }
  
  console.log(`[Selection] ${selectedLockerIds.value.size} lockers in selection box`)
}


// 선택된 락커 회전 (연속 회전, 역회전 방지)
const rotateSelectedLocker = (angle = 45) => {
  console.log('[UI] Button clicked:', angle > 0 ? 'rotate-cw' : 'rotate-ccw')
  
  // 다중 선택된 경우
  if (selectedLockerIds.value.size > 1) {
    rotateSelectedLockers(angle > 0 ? 'cw' : 'ccw')
    return
  }
  
  if (!selectedLocker.value) {
    console.warn('[Rotation] No locker selected')
    return
  }
  
  const locker = lockerStore.getLockerById(selectedLocker.value.id)
  if (!locker) {
    console.error('[Rotation] Locker not found in store:', selectedLocker.value.id)
    return
  }
  
  const currentRotation = locker.rotation || 0
  
  // Use cumulative rotation (don't normalize)
  const newRotation = currentRotation + angle
  
  const direction = angle > 0 ? '시계방향' : '반시계방향'
  console.log('[Rotation] Applying rotation:', {
    previousRotation: currentRotation,
    rotationDelta: angle,
    newRotation: newRotation,
    direction: direction,
    lockerId: locker.id
  })
  
  // Update with cumulative rotation
  const updated = lockerStore.updateLocker(locker.id, { rotation: newRotation })
  
  if (updated) {
    selectedLocker.value = updated
    console.log('[Rotation] 회전 완료:', {
      id: updated.id,
      rotation: updated.rotation
    })
    
    // Save rotation to database
    updateLockerPlacement(locker.id, { rotation: newRotation }).catch(error => {
      console.error('Failed to save rotation:', error)
    })
  }
}

// 다중 선택된 락커 회전 (그룹 전체가 공통 중심점 기준으로 회전)
const rotateSelectedLockers = (direction: 'cw' | 'ccw' = 'cw') => {
  if (selectedLockerIds.value.size === 0) return
  
  const angle = direction === 'cw' ? 45 : -45
  console.log(`[Multi-Select] Rotating ${selectedLockerIds.value.size} lockers as GROUP ${direction} by ${Math.abs(angle)}°`)
  
  const selectedArray = Array.from(selectedLockerIds.value)
  const selectedLockers = currentLockers.value.filter(l => selectedArray.includes(l.id))
  
  if (selectedLockers.length === 0) return
  
  // Calculate GROUP center
  const bounds = {
    minX: Math.min(...selectedLockers.map(l => l.x)),
    maxX: Math.max(...selectedLockers.map(l => l.x + l.width)),
    minY: Math.min(...selectedLockers.map(l => l.y)),
    maxY: Math.max(...selectedLockers.map(l => l.y + (l.height || l.depth || 50)))
  }
  
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  
  console.log('[Multi-Select] Group center:', { centerX, centerY })
  
  // Rotate each locker around the GROUP center
  selectedLockers.forEach(locker => {
    const currentRotation = locker.rotation || 0
    const dims = getLockerDimensions(locker)
    
    // Calculate the locker's CENTER position
    const lockerCenterX = locker.x + dims.width / 2
    const lockerCenterY = locker.y + dims.height / 2
    
    // Calculate relative position to group center
    const relX = lockerCenterX - centerX
    const relY = lockerCenterY - centerY
    
    // Apply rotation transformation
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    
    // New center position after rotation
    const newCenterX = relX * cos - relY * sin + centerX
    const newCenterY = relX * sin + relY * cos + centerY
    
    // Convert back to top-left corner position
    const newX = newCenterX - dims.width / 2
    const newY = newCenterY - dims.height / 2
    
    // IMPORTANT: Don't normalize rotation, just add the angle (cumulative)
    const newRotation = currentRotation + angle
    
    console.log(`[Rotate] Locker ${locker.number}: position (${locker.x.toFixed(2)},${locker.y.toFixed(2)}) → (${newX.toFixed(2)},${newY.toFixed(2)}), rotation ${currentRotation}° → ${newRotation}°`)
    
    // Update with accumulated rotation (no wrapping, no normalization)
    lockerStore.updateLocker(locker.id, {
      x: newX,
      y: newY,
      rotation: newRotation  // Cumulative value
    })
  })
  
  console.log('[Multi-Select] Group rotation complete')
}


// 다중 락커 회전 (각도 버전 - 각 락커가 자체 중심으로 회전)
const rotateMultipleLockers = (angle: number) => {
  const direction = angle > 0 ? '시계방향' : '반시계방향'
  console.log(`[Rotation] ${selectedLockerIds.value.size}개 락커 ${direction} ${Math.abs(angle)}° 회전`)
  
  let successCount = 0
  
  selectedLockerIds.value.forEach(lockerId => {
    const locker = lockerStore.getLockerById(lockerId)
    if (!locker) return
    
    const currentRotation = locker.rotation || 0
    
    // 항상 양의 방향으로 정규화 (0-359)
    let newRotation = (currentRotation + angle) % 360
    if (newRotation < 0) {
      newRotation += 360
    }
    
    // 315° ↔ 0° 전환 감지
    const isWrappingClockwise = angle > 0 && currentRotation === 315 && newRotation === 0
    const isWrappingCounterClockwise = angle < 0 && currentRotation === 0 && newRotation === 315
    
    if (isWrappingClockwise) {
      // 315° → 360° → 0°
      lockerStore.updateLocker(lockerId, { rotation: 360 })
      setTimeout(() => {
        lockerStore.updateLocker(lockerId, { rotation: 0 })
      }, 10)
    } else if (isWrappingCounterClockwise) {
      // 0° → -45° → 315°
      lockerStore.updateLocker(lockerId, { rotation: -45 })
      setTimeout(() => {
        lockerStore.updateLocker(lockerId, { rotation: 315 })
      }, 10)
    } else {
      // 일반적인 회전
      lockerStore.updateLocker(lockerId, { rotation: newRotation })
    }
    
    successCount++
  })
  
  console.log(`[Rotation] ${successCount}/${selectedLockerIds.value.size}개 락커 회전 완료`)
}

// 구역 저장 처리
const handleZoneSave = async (zoneData) => {
  try {
    // Generate unique zone ID
    const zoneId = `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Prepare zone data for API - CRITICAL: Use correct field names
    const zoneToSave = {
      LOCKR_KND_CD: zoneId,
      LOCKR_KND_NM: zoneData.name,
      X: 0,
      Y: 0,
      WIDTH: canvasWidth.value,
      HEIGHT: canvasHeight.value,
      COLOR: zoneData.color || '#f0f9ff'
    }
    
    // Save to database
    await saveZone(zoneToSave)
    
    // Find the newly created zone
    const newZone = zones.value.find(z => z.LOCKR_KND_NM === zoneData.name)
    if (newZone) {
      selectedZone.value = newZone
    }
    
    showZoneModal.value = false
  } catch (error) {
    console.error('Failed to save zone:', error)
    alert('Failed to save zone. Please try again.')
  }
}

// 락커 등록 처리
const handleLockerRegistration = async (data) => {
  try {
    // Prepare locker data for API
    const newLocker = {
      id: `locker-${Date.now()}`, // Generate unique ID
      name: data.name,
      width: data.width,
      depth: data.depth,
      height: data.height,
      description: data.description,
      color: data.color || '#3b82f6',
      type: `custom-${Date.now()}`, // Unique type identifier
      zoneId: selectedZone.value?.id || null,
      x: 0,
      y: 0,
      rotation: 0
    }
    
    // Save to database
    await saveLocker(newLocker)
    
    // Save as a locker type to backend
    try {
      const typeResponse = await fetch(`${API_BASE_URL}/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          LOCKR_TYPE_CD: `custom-${Date.now()}`,
          LOCKR_TYPE_NM: data.name,
          WIDTH: data.width,
          HEIGHT: data.height,
          DEPTH: data.depth,
          COLOR: data.color || '#3b82f6'
        })
      })
      
      if (!typeResponse.ok) {
        console.error('Failed to save locker type to backend:', await typeResponse.text())
      } else {
        console.log('[Locker Registration] Type saved to backend successfully')
      }
    } catch (error) {
      console.error('Error saving locker type to backend:', error)
      // Continue even if type save fails
    }
    
    // Also add as a locker type for selection
    const newType = {
      id: newLocker.id,
      name: data.name,
      width: data.width,
      depth: data.depth,
      height: data.height,
      description: data.description,
      color: data.color || '#3b82f6',
      type: newLocker.type
    }
    
    lockerTypes.value.push(newType)
    showLockerRegistrationModal.value = false
    
    console.log('[Locker Registration] New locker saved:', {
      id: newLocker.id,
      name: newLocker.name,
      dimensions: { width: newLocker.width, depth: newLocker.depth, height: newLocker.height },
      type: newLocker.type
    })
  } catch (error) {
    console.error('Failed to save locker:', error)
    alert('Failed to save locker. Please try again.')
  }
}

// 디버그: 모든 락커의 치수 확인
const debugLockerDimensions = () => {
  console.log('[Debug] All locker dimensions:')
  currentLockers.value.forEach(locker => {
    console.log(`${locker.type || locker.name}:`, {
      id: locker.id,
      width: locker.width,
      height: locker.height,  // Should be depth value in floor view
      depth: locker.depth,
      actualHeight: locker.actualHeight,
      position: { x: locker.x, y: locker.y }
    })
  })
  
  console.log('[Snap System] Configuration:', {
    threshold: 20,
    lockerCount: currentLockers.value.length,
    viewMode: currentViewMode.value
  })
}

// 락커 이동
const moveLocker = (dx: number, dy: number) => {
  if (!selectedLocker.value) return
  
  const newX = Math.max(0, Math.min(selectedLocker.value.x + dx, canvasWidth.value - selectedLocker.value.width))
  const newY = Math.max(0, Math.min(selectedLocker.value.y + dy, canvasHeight.value - selectedLocker.value.height))
  
  lockerStore.updateLocker(selectedLocker.value.id, { x: newX, y: newY })
}

// 키보드 이벤트 처리
const handleKeyDown = (event: KeyboardEvent) => {
  // Check for copy mode first (before checking for input fields)
  if (event.ctrlKey || event.metaKey) {
    isCopyMode.value = true
  }
  
  // Skip keyboard shortcuts when typing in input/textarea or when modal is open
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    console.log('[Keyboard] Ignored - typing in input field')
    return // Don't process shortcuts when typing
  }
  
  // Also skip if registration modal is open
  if (showLockerRegistrationModal.value || showZoneModal.value) {
    console.log('[Keyboard] Ignored - modal is open')
    return // Don't process shortcuts when modal is open
  }
  
  // Select All (Ctrl/Cmd + A)
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault()
    currentLockers.value.forEach(locker => {
      selectedLockerIds.value.add(locker.id)
    })
    if (currentLockers.value.length > 0) {
      selectedLocker.value = currentLockers.value[0]
    }
    console.log('[Multi-Select] Selected all lockers')
    return
  }
  
  // R 키: 회전 처리 (Shift+R = 반시계방향)
  if ((event.key === 'r' || event.key === 'R')) {
    event.preventDefault()
    
    const angle = event.shiftKey ? -45 : 45
    const selectedCount = selectedLockerIds.value.size
    
    if (selectedCount > 1) {
      // Multiple lockers selected - rotate as GROUP around common center
      if (!rotateInterval) {
        // First rotation
        const direction = angle > 0 ? 'cw' : 'ccw'
        rotateSelectedLockers(direction)
        
        // Continuous rotation if key is held
        rotateInterval = window.setInterval(() => {
          rotateSelectedLockers(direction)
        }, 100) // Rotate every 100ms
      }
    } else if (selectedLocker.value) {
      // Single locker selected
      if (!rotateInterval) {
        // First rotation
        rotateSelectedLocker(angle)
        
        // Continuous rotation if key is held
        rotateInterval = window.setInterval(() => {
          rotateSelectedLocker(angle)
        }, 100) // Rotate every 100ms
      }
    }
    
    return
  }
  
  // Ctrl/Cmd + C: 복사 (floor view only)
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    // Disable copy in front view
    if (currentViewMode.value === 'front') {
      console.log('[Copy] Disabled in front view mode')
      return
    }
    
    event.preventDefault()
    if (selectedLockerIds.value.size > 0) {
      copiedLockers.value = Array.from(selectedLockerIds.value).map(id => {
        const locker = currentLockers.value.find(l => l.id === id)
        return locker ? { ...locker } : null
      }).filter(Boolean)
      console.log('[Multi-Select] Copied', copiedLockers.value.length, 'lockers')
    } else if (selectedLocker.value) {
      copiedLockers.value = [{ ...selectedLocker.value }]
      console.log('[Copy] Locker copied:', selectedLocker.value.id)
    }
    return
  }
  
  // Ctrl/Cmd + V: 붙여넣기 (floor view only)
  if ((event.ctrlKey || event.metaKey) && event.key === 'v' && copiedLockers.value && copiedLockers.value.length > 0 && selectedZone.value) {
    // Disable paste in front view
    if (currentViewMode.value === 'front') {
      console.log('[Paste] Disabled in front view mode')
      return
    }
    event.preventDefault()
    
    selectedLockerIds.value.clear()
    copiedLockers.value.forEach((copiedLocker, index) => {
      const newLocker = {
        ...copiedLocker,
        id: `locker-${Date.now()}-${Math.random()}`,
        number: `L${currentLockers.value.length + index + 1}`,
        x: copiedLocker.x + 20,
        y: copiedLocker.y + 20,
        zoneId: selectedZone.value.id
      }
      const created = lockerStore.addLocker(newLocker)
      selectedLockerIds.value.add(created.id)
      if (index === 0) {
        selectedLocker.value = created
      }
    })
    console.log('[Multi-Select] Pasted', copiedLockers.value.length, 'lockers')
    return
  }
  
  // Delete 키: 락커 삭제 (only when not typing and modal is closed)
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // Only prevent default and delete if we have a selected locker
    if (selectedLocker.value || selectedLockerIds.value.size > 0) {
      event.preventDefault()
      deleteSelectedLockers()
    }
  }
  
  
  // G: 가이드라인 토글
  if (event.key === 'g' || event.key === 'G') {
    event.preventDefault()
    showAlignmentGuides.value = !showAlignmentGuides.value
    console.log(`[Alignment] Guides ${showAlignmentGuides.value ? 'ON' : 'OFF'}`)
  }
  
  // Ctrl+Z: 실행 취소
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault()
    lockerStore.undo()
  }
  
  // Ctrl+Y: 다시 실행
  if (event.ctrlKey && event.key === 'y') {
    event.preventDefault()
    lockerStore.redo()
  }
  
  // Escape: 선택 해제
  if (event.key === 'Escape') {
    console.log('[Canvas] ESC pressed - clearing selection')
    selectedLockerIds.value.clear()
    selectedLocker.value = null
    lockerStore.selectLocker(null)
    // Direct addition mode - no placement state to clear
  }
  
  // 화살표 키로 이동 (선택된 락커)
  if (selectedLocker.value) {
    const step = event.shiftKey ? 20 : 1
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveLocker(-step, 0)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveLocker(step, 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveLocker(0, -step)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveLocker(0, step)
    }
  }
}

// Watch for changes in locker positions to keep selectedLocker in sync
watch(() => currentLockers.value, (newLockers) => {
  if (selectedLocker.value) {
    const updated = newLockers.find(l => l.id === selectedLocker.value.id)
    if (updated) {
      selectedLocker.value = updated
    }
  }
}, { deep: true })

// Computed property for cursor style
const getCursorStyle = computed(() => {
  if (isDragging.value) return 'grabbing'
  if (isDragSelecting.value) return 'crosshair'
  if (isCopyMode.value && selectedLockerIds.value.size > 0) return 'copy'
  if (selectedLockerIds.value.size > 0) return 'move'
  return 'default'
})


// 초기화
onMounted(async () => {
  console.log('Component mounted, loading data...')
  
  // Keep loading true until all critical data is loaded
  isLoadingTypes.value = true
  isLoadingLockers.value = true
  
  try {
    // Load types first, then lockers (zones can remain parallel)
    await Promise.all([loadZones(), loadLockerTypes()])
    await loadLockers()  // Wait for types to complete first
    
    // Only set loading false when everything is ready
    await nextTick()
    isLoadingTypes.value = false
    isLoadingLockers.value = false
    
    console.log('All data loading completed')
    
    // Select first zone if available
    if (zones.value.length > 0 && !selectedZone.value) {
      selectZone(zones.value[0])
      console.log('[Data Loading] Auto-selected first zone:', zones.value[0].name)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    isLoadingTypes.value = false
    isLoadingLockers.value = false
  }
  
  // Canvas size update는 데이터 로딩 완료 후에만 실행 (깜빡임 방지)
  // setTimeout(() => {
  //   updateCanvasSize()
  // }, 100)
  
  // Add resize listener
  window.addEventListener('resize', updateCanvasSize)
  
  // Add keyboard listeners for copy mode
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  
  // Add click listener to close context menu
  document.addEventListener('click', hideContextMenu)
  
  // 데이터베이스에서 락커 로드 - use proper loadLockers to preserve actualHeight
  await loadLockers()
  
  // 첫 번째 구역 선택
  if (lockerStore.zones.length > 0) {
    selectZone(lockerStore.zones[0])
  }
  
  // 키보드 이벤트 리스너 추가
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

// 키보드 키 뗄 이벤트 처리
const handleKeyUp = (event: KeyboardEvent) => {
  // Check for copy mode release
  if (!event.ctrlKey && !event.metaKey) {
    isCopyMode.value = false
  }
  
  // R 키 뗄 때 연속 회전 중지
  if ((event.key === 'r' || event.key === 'R') && rotateInterval) {
    clearInterval(rotateInterval)
    rotateInterval = null
  }
}

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('click', hideContextMenu)
  window.removeEventListener('resize', updateCanvasSize)
  if (rotateInterval) {
    clearInterval(rotateInterval)
    rotateInterval = null
  }
})
</script>

<style scoped>
/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0768AE;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.main-content {
  width: 100%;
  height: 100%;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.locker-placement {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-main);
}

/* 헤더 */
.header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid black;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.breadcrumb {
  font-size: 14px;
  color: var(--text-secondary);
}

.divider {
  margin: 0 8px;
}

/* 컨테이너 */
.container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 사이드바 */
.sidebar {
  width: 280px;
  background: white;
  border: 1px solid black;
  border-radius: 5px;
  margin: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

/* 락커 타입 목록 */
.locker-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.locker-type-item-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.locker-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.locker-type-item:hover {
  background: #f5f5f5;
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.locker-type-item.active {
  border-color: var(--primary-color);
  background: #f0f8ff;
}

/* Pulse animation for double-click feedback */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.pulse-animation {
  animation: pulse 0.3s ease;
}

.help-text {
  padding: 10px;
  margin: 10px 0;
  background: #f0f9ff;
  border: 1px solid #0284c7;
  border-radius: 4px;
  color: #0284c7;
  font-size: 13px;
  text-align: center;
}

.delete-type-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
  z-index: 10;
  padding: 0;
}

.locker-type-item-wrapper:hover .delete-type-button {
  opacity: 1;
}

.delete-type-button:hover {
  background-color: #fee2e2;
  border-color: #ef4444;
}

.deleted-types-section {
  margin-top: 20px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.deleted-types-section .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.deleted-type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.restore-btn {
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.restore-btn:hover {
  background: #2563eb;
}

.type-visual {
  width: 80px;  /* Accommodate largest locker (60 * 1.2 = 72px) */
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.type-preview {
  display: block;
}

.type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.type-name {
  font-weight: 600;
  color: var(--text-primary);
}

.type-size {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 버튼들 */
.add-locker-btn.primary {
  width: 100%;
  padding: 10px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.add-locker-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

.add-locker-btn.primary:not(:disabled):hover {
  background: #0051D5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* Loading and Empty states */
.loading-state, .empty-state {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 8px;
  opacity: 0.7;
}

.register-locker-btn {
  width: 100%;
  padding: 10px;
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.register-locker-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.vertical-mode-btn {
  padding: 10px 16px;
  background: white;
  color: var(--text-primary);
  border: 2px solid #0768AE;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.vertical-mode-btn:hover {
  background: #f0f8ff;
}

.vertical-mode-btn.active {
  background: #0768AE;
  color: white;
  border-color: #0768AE;
}

.vertical-mode-btn.active svg path {
  stroke: white;
}

/* 자동 정렬 버튼 */
.auto-align-btn {
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px solid #0768AE;
  border-radius: 8px;
  color: #0768AE;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  transition: all 0.2s;
}

.auto-align-btn:hover {
  background: #F0F8FF;
  border-color: #2284F4;
  color: #2284F4;
}

.auto-align-btn:active {
  transform: scale(0.98);
}

.auto-align-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 캔버스 영역 */
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 792px; /* 740px + padding + 여백 */
  overflow: auto; /* 스크롤 허용으로 변경 */
}

/* 구역 탭 */
.zone-tabs {
  display: flex;
  gap: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid black;
  margin-bottom: 16px;
  align-items: center;
}

.zone-tab {
  position: relative;
  padding: 8px 4px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.zone-tab:hover {
  color: var(--text-primary);
}

.zone-tab.active {
  color: var(--text-primary);
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: -13px;
  left: 0;
  right: 0;
  height: 3px;
  background: #11AE09;
}

.zone-add-btn {
  padding: 6px 12px;
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.zone-add-btn:hover {
  background: var(--primary-color);
  color: white;
}

/* 캔버스 */
.canvas-wrapper {
  flex: 1;
  width: 100%;
  height: 720px; /* 평면배치 시 720px */
  background: white;
  overflow: auto; /* 필요시 스크롤 생성 */
  border: none; /* 경계 제거로 12px 차이 해소 */
  position: relative; /* SVG 포지셔닝용 */
  border-radius: 4px;
  position: relative;
  display: block; /* Changed from flex to block for proper SVG containment */
  padding: 0;
  box-sizing: border-box; /* 크기 계산 정확성 */
}

.canvas {
  background: white;
  cursor: crosshair;
  width: 100%;
  height: 100%;
  display: block;
}

/* 정렬 가이드라인 애니메이션 */
.alignment-guides line {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* 락커 정렬 애니메이션 */
.locker-svg:not(.no-transition) {
  transition: transform 0.2s ease-out;
}

.locker-svg.aligning {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 다중 선택 배지 */
.multi-select-badge {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #007AFF;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Stable selection button styles without scaling */
.selection-button {
  transition: opacity 0.2s ease;
  pointer-events: all;
}

.selection-button circle {
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.selection-button:hover circle:first-of-type {
  fill: #f9fafb;
  stroke: #9ca3af;
}

.selection-button.delete-button:hover circle.hover-fill {
  opacity: 0.1 !important;
}

.selection-button.rotate-cw-button:hover circle.hover-fill {
  opacity: 0.1 !important;
}

.selection-button.rotate-ccw-button:hover circle.hover-fill {
  opacity: 0.1 !important;
}

/* Remove any transform on hover to prevent shaking */
.selection-button:hover {
  /* No transform */
}

.selection-button:active {
  opacity: 0.8;
}

/* Ensure smooth path transitions */
.selection-button path {
  transition: stroke 0.2s ease;
  pointer-events: none;
}

.multi-select-indicator {
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Context Menu Styles */
.context-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 180px;
  animation: fadeIn 0.2s ease;
}

.context-menu-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
  color: #0768AE;
}

.context-menu-item i {
  width: 16px;
  text-align: center;
  color: #6b7280;
}

.context-menu-item:hover i {
  color: #0768AE;
}

/* Modal Overlay and Content */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #0768AE;
  box-shadow: 0 0 0 3px rgba(7, 104, 174, 0.1);
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: normal;
}

.radio-group input[type="radio"] {
  cursor: pointer;
}

.form-group input[type="checkbox"] {
  margin-right: 6px;
  cursor: pointer;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #0768AE;
  color: white;
}

.btn-primary:hover {
  background: #055a8a;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Zone Context Menu Styles */
.zone-context-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 4px;
  min-width: 120px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-icon {
  font-size: 16px;
}

/* Zone Controls Container */
.zone-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

/* Inline Mode Toggle */
.mode-toggle-inline {
  display: flex;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.mode-toggle-inline .mode-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.mode-toggle-inline .mode-btn:first-child {
  border-right: 1px solid #e5e7eb;
}

.mode-toggle-inline .mode-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.mode-toggle-inline .mode-btn.active {
  background: #0768AE;
  color: white;
}

.mode-toggle-inline .mode-btn.active svg {
  stroke: white;
}

.mode-toggle-inline .mode-btn svg {
  width: 18px;
  height: 18px;
  transition: stroke 0.2s ease;
}

.mode-toggle-inline .mode-btn span {
  white-space: nowrap;
  font-size: 12px;
}

/* Responsive: Hide text on small screens */
@media (max-width: 768px) {
  .mode-toggle-inline .mode-btn span {
    display: none;
  }
  
  .mode-toggle-inline .mode-btn {
    padding: 8px 10px;
  }
}
</style>
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
                  :stroke="'#9ca3af'"
                  :stroke-width="0.5 * 2.0"
                  :rx="2 * 2.0"
                  :ry="2 * 2.0"
                  shape-rendering="crispEdges"
                />
                <!-- Front indicator line - 락커 선택창 유지 -->
                <line
                  :x1="10"
                  :y1="(((type.depth || type.width) || 40) * 2.0) - 5"
                  :x2="((type.width || 40) * 2.0) - 10"
                  :y2="(((type.depth || type.width) || 40) * 2.0) - 5"
                  :stroke="type.color || '#1e40af'"
                  stroke-width="4"
                  opacity="0.9"
                  stroke-linecap="square"
                  class="front-indicator"
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
          <!-- 탭 그룹 -->
          <div class="zone-tab-group">
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
          </div>
          
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
                title="정면배치모드 (F)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="15" x2="21" y2="15" stroke-dasharray="2 2" />
                  <rect x="7" y="7" width="4" height="6" />
                  <rect x="13" y="7" width="4" height="6" />
                </svg>
                <span>정면배치</span>
              </button>
              
              <button 
                class="mode-btn"
                @click="showGroupingAnalysis"
                title="그룹핑 결과 확인"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6"/>
                  <path d="m21 12-6-3-6 3-6-3"/>
                </svg>
                <span>그룹핑 확인</span>
              </button>
              
              <!-- 줌 컨트롤 - 평면배치와 정면배치 모드에서 표시 -->
              <div v-if="currentViewMode === 'floor' || currentViewMode === 'front'" class="zoom-controls">
                <button 
                  class="zoom-btn"
                  @click="autoFitLockers"
                  title="모든 락커가 화면에 맞춤 (클릭)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01"/>
                  </svg>
                  <span>{{ Math.round(zoomLevel * 100) }}%</span>
                </button>
                <div class="zoom-hints">
                  <span class="hint">Ctrl+스크롤: 줌</span>
                  <span class="hint">휠클릭+드래그: 이동</span>
                </div>
              </div>
              
              <button 
                class="mode-btn debug-btn"
                @click="debugPopupVisible = true"
                title="락커 데이터 상세 확인"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 12 2 2 4-4"/>
                  <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                </svg>
                <span>디버그 정보</span>
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
            :viewBox="computedViewBox"
            :style="{ cursor: getCursorStyle, margin: 0, padding: 0 }"
            preserveAspectRatio="none"
            @wheel.prevent="handleWheel"
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
                :x2="ACTUAL_CANVAS_WIDTH"
                :y2="FLOOR_Y"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="10,5"
              />
              
              <!-- 바닥선 라벨 (좌측 - 뷰포트 기준 고정) -->
              <text
                :x="panOffset.x + 20 / zoomLevel"
                :y="FLOOR_Y + 20"
                fill="#64748b"
                :font-size="12 / zoomLevel"
                font-weight="500"
              >
                바닥선
              </text>
              
              <!-- 바닥선 라벨 (우측 - 뷰포트 기준 고정) -->
              <text
                :x="panOffset.x + (INITIAL_VIEWPORT_WIDTH - 80) / zoomLevel"
                :y="FLOOR_Y + 20"
                fill="#64748b"
                :font-size="12 / zoomLevel"
                font-weight="500"
                text-anchor="end"
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
              :should-hide-individual-outline="lockersNeedingUnifiedOutline.has(locker.id) && !isDragging"
              :is-dragging="isDragging && selectedLockerIds.has(locker.id)"
              :adjacent-sides="getAdjacentSides(locker.id)"
              :view-mode="currentViewMode"
              :is-transitioning-to-floor="isTransitioningToFloor"
              :show-number="true"
              :show-rotate-handle="selectedLocker?.id === locker.id"
              :zoom-level="zoomLevel"
              @click="(locker, event) => selectLocker(locker, event)"
              @contextmenu.prevent="showContextMenu"
              @select="(id) => selectedLocker = currentLockers.find(l => l.id === id)"
              @dragstart="startDragLocker"
              @rotatestart="startRotateLocker"
              @rotate="handleRotateMove"
              @rotateend="handleRotateEnd"
            />
            
            <!-- 통합 외곽선 그리기 (드래그 중에는 숨김) -->
            <g v-if="connectedGroups.length > 0 && !isDragging" class="unified-outlines">
              <rect
                v-for="(group, index) in connectedGroups.filter(g => g.length > 1)"
                :key="`group-${index}`"
                :x="(calculateUnifiedBounds(group)?.minX || 0) - 5"
                :y="(calculateUnifiedBounds(group)?.minY || 0) - 5"
                :width="(calculateUnifiedBounds(group)?.width || 0) + 10"
                :height="(calculateUnifiedBounds(group)?.height || 0) + 10"
                fill="none"
                stroke="#0768AE"
                stroke-width="2"
                stroke-dasharray="5,5"
                class="unified-selection-outline"
                pointer-events="none"
              >
                <animate 
                  attributeName="stroke-dashoffset" 
                  values="0;10" 
                  dur="0.5s" 
                  repeatCount="indefinite"
                />
              </rect>
            </g>
            
            <!-- Selection UI handles (delete, rotate) - Follow during drag and rotate with locker -->
            <g v-if="selectedLocker && !isDragging && showSelectionUI">
              <!-- Apply position and rotation transforms (all in logical coordinates) -->
              <g :transform="`translate(${getSelectionUIPosition().x}, ${getSelectionUIPosition().y}) rotate(${selectedLocker.rotation || 0}, ${selectedLocker.width / 2}, ${selectedLocker.height / 2})`">
                
                <!-- 회전 버튼 제거 - 드래그 기반 회전으로 대체됨 -->
                
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
                :x2="canvasWidth"
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
                :y2="canvasHeight"
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

  <!-- Context Menu - Visible in both floor and front view modes -->
  <div 
    v-if="contextMenuVisible" 
    :style="{ 
      position: 'fixed', 
      left: contextMenuPosition.x + 'px', 
      top: contextMenuPosition.y + 'px',
      zIndex: 1000
    }"
    class="context-menu"
    @click.stop
  >
    <!-- 락커 삭제 - 모든 모드에서 표시 -->
    <!-- 정면배치 모드에서만 표시되는 메뉴들 -->
    <template v-if="currentViewMode === 'front'">
      <div class="context-menu-item" @click="showFloorInputDialog">
        <i class="fas fa-layer-group"></i> 단수 입력
      </div>
      <div class="context-menu-item" @click="showNumberAssignDialog">
        <i class="fas fa-sort-numeric-up"></i> 번호 부여
      </div>
      <div class="context-menu-item" @click="deleteNumbers">
        <i class="fas fa-eraser"></i> 번호 삭제
      </div>
    </template>
    
    <div class="context-menu-item" @click="deleteSelectedLockersFromMenu">
      <i class="fas fa-trash"></i> 락커 삭제
    </div>
  </div>
  
  <!-- Floor Input Dialog -->
  <div v-if="floorInputVisible" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h3>단수 입력</h3>
      <div class="form-group">
        <label>단수:</label>
        <input 
          v-model.number="floorCount" 
          type="number" 
          min="1" 
          max="9"
          placeholder="1-9 사이 입력"
          class="form-control"
          @input="validateFloorCount"
        >
      </div>
      <div class="modal-buttons">
        <button class="btn btn-secondary" @click="floorInputVisible = false">취소</button>
        <button class="btn btn-primary" @click="addFloors">확인</button>
      </div>
    </div>
  </div>
  
  <!-- Number Assignment Dialog -->
  <div v-if="numberAssignVisible" class="modal-overlay">
    <div class="modal-content number-assign-modal" @click.stop>
      <h3>번호 부여</h3>
      <div class="form-group">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <label>시작번호:</label>
          <label style="margin-right: 100px;">번호생성옵션:</label>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <input 
            v-model.number="startNumber" 
            type="number" 
            :min="1" 
            placeholder="시작 번호"
            class="form-control number-input"
            style="width: 120px;"
          >
          <div class="radio-group-horizontal" style="flex: 1; margin-left: 20px;">
            <label class="radio-label">
              <input type="radio" v-model="numberGenerationType" value="all">
              <span>전체</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="numberGenerationType" value="odd">
              <span>홀수</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="numberGenerationType" value="even">
              <span>짝수</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-labels-row">
          <label class="section-label">생성방향:</label>
        </div>
        <div class="form-options-row">
          <div class="radio-group-horizontal">
            <label class="radio-label">
              <input type="radio" v-model="numberDirection" value="horizontal">
              <span>가로</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="numberDirection" value="vertical">
              <span>세로</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-section">
        <label class="section-label">추가옵션:</label>
        <div style="margin-top: 10px;">
          <span style="margin-right: 8px;">역방향</span>
          <input type="checkbox" v-model="reverseDirection" style="margin-right: 30px;">
          <span style="margin-right: 8px;">아래에서부터</span>
          <input type="checkbox" v-model="fromTop">
        </div>
      </div>
      
      <!-- Progress indicator -->
      <div v-if="isAssigningNumbers" class="progress-section">
        <div class="progress-indicator">
          <div class="loading-spinner"></div>
          <span class="progress-text">{{ assignmentProgress }}</span>
        </div>
      </div>
      
      <div class="modal-buttons">
        <button 
          class="btn btn-secondary" 
          @click="numberAssignVisible = false"
          :disabled="isAssigningNumbers"
        >
          취소
        </button>
        <button 
          class="btn btn-primary" 
          @click="assignNumbers"
          :disabled="isAssigningNumbers"
        >
          <span v-if="isAssigningNumbers">
            <i class="fas fa-spinner fa-spin"></i> 처리중...
          </span>
          <span v-else>번호 부여</span>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Grouping Analysis Popup -->
  <div v-if="showGroupingPopup" class="modal-overlay" @click="showGroupingPopup = false">
    <div class="modal-content grouping-popup" @click.stop>
      <h3>대그룹 분석 결과</h3>
      <div class="grouping-results">
        <pre>{{ groupingAnalysisResult }}</pre>
      </div>
      <div class="modal-buttons">
        <button class="btn btn-primary" @click="showGroupingPopup = false">확인</button>
      </div>
    </div>
  </div>
  
  <!-- Debug Information Popup -->
  <div v-if="debugPopupVisible" class="modal-overlay" @click="debugPopupVisible = false">
    <div class="modal-content debug-popup" @click.stop>
      <h3>🔍 락커 데이터 디버깅 정보</h3>
      
      <div class="debug-section">
        <h4>📊 전체 통계</h4>
        <div class="debug-stats">
          <div class="stat-item">
            <span class="label">Store 전체:</span>
            <span class="value">{{ lockerStore.lockers.length }}개</span>
          </div>
          <div class="stat-item">
            <span class="label">현재 구역:</span>
            <span class="value">{{ currentLockers.length }}개</span>
          </div>
          <div class="stat-item">
            <span class="label">뷰모드:</span>
            <span class="value">{{ currentViewMode }}</span>
          </div>
          <div class="stat-item">
            <span class="label">선택 구역:</span>
            <span class="value">{{ selectedZone?.name || 'None' }}</span>
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h4>🏢 Store 전체 락커 ({{ lockerStore.lockers.length }}개)</h4>
        <div class="locker-list">
          <div 
            v-for="locker in lockerStore.lockers" 
            :key="locker.id"
            class="locker-item"
            :class="{ parent: !locker.parentLockrCd, child: !!locker.parentLockrCd }"
          >
            <div class="locker-header">
              <span class="locker-name">{{ locker.number }}</span>
              <span class="locker-type">{{ !locker.parentLockrCd ? '부모' : '자식' }}</span>
            </div>
            <div class="locker-details">
              <span>ID: {{ locker.id }}</span>
              <span>Zone: {{ locker.zoneId }}</span>
              <span>Parent: {{ locker.parentLockrCd || 'None' }}</span>
              <span>Height: {{ locker.actualHeight || locker.height }}px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h4>👁️ 현재 표시 락커 ({{ currentLockers.length }}개)</h4>
        <div class="locker-list">
          <div 
            v-for="locker in currentLockers" 
            :key="locker.id"
            class="locker-item current"
            :class="{ parent: !locker.parentLockrCd, child: !!locker.parentLockrCd }"
          >
            <div class="locker-header">
              <span class="locker-name">{{ locker.number }}</span>
              <span class="locker-type">{{ !locker.parentLockrCd ? '부모' : '자식' }}</span>
              <span class="render-status">표시중</span>
            </div>
            <div class="locker-details">
              <span>위치: ({{ locker.x }}, {{ locker.y }})</span>
              <span>크기: {{ locker.width }}x{{ locker.height }}</span>
              <span>실제높이: {{ locker.actualHeight }}px</span>
              <span>회전: {{ locker.rotation }}°</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-buttons">
        <button class="btn btn-secondary" @click="loadLockers()">🔄 새로고침</button>
        <button class="btn btn-primary" @click="debugPopupVisible = false">닫기</button>
      </div>
    </div>
  </div>
    
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
import { useLockerStore, type Locker, type LockerZone } from '@/stores/lockerStore'
import LockerSVG from '@/components/locker/LockerSVG.vue'
import ZoneModal from '@/components/modals/ZoneModal.vue'
import LockerRegistrationModal from '@/components/modals/LockerRegistrationModal.vue'
import { getLockerConfig, isCodeIgniterEnvironment } from '@/config/codeigniter'
// import * as lockerApi from '@/api/lockers' // TODO: Add this when API module is created

const lockerStore = useLockerStore()

// 상태
const selectedZone = ref<LockerZone | null>(null)
const selectedType = ref<LockerTypeItem | null>(null)
const selectedLocker = ref<Locker | null>(null)
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
const frontViewSequence = ref<any[]>([]) // Store front view locker sequence
const selectionBox = ref({
  isSelecting: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// Grouping analysis popup state
const showGroupingPopup = ref(false)
const groupingAnalysisResult = ref('')

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

// 디버깅용 팝업 상태
const debugPopupVisible = ref(false)
const numberAssignVisible = ref(false)
const startNumber = ref(1)
const numberGenerationType = ref<'all' | 'odd' | 'even'>('all')  // 번호생성옵션 추가
const numberDirection = ref<'horizontal' | 'vertical'>('horizontal')
const reverseDirection = ref(false)
const fromTop = ref(false)

// Loading states for number assignment
const isAssigningNumbers = ref(false)
const assignmentProgress = ref('')

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
const FLOOR_Y = 1100  // 바닥선 Y 위치 (캔버스 높이 1440의 약 75% 위치)

// Log scale configuration removed - was causing syntax error

// 캔버스 크기 (동적으로 조정)
// 실제 캔버스 크기는 크게 설정하여 더 많은 락커 배치 가능
const ACTUAL_CANVAS_WIDTH = 3100  // 실제 캔버스 너비 (2배)
const ACTUAL_CANVAS_HEIGHT = 1440  // 실제 캔버스 높이 (2배)
const INITIAL_VIEWPORT_WIDTH = 1550  // 초기 뷰포트 너비
const INITIAL_VIEWPORT_HEIGHT = 720  // 초기 뷰포트 높이

const canvasWidth = ref(ACTUAL_CANVAS_WIDTH)  // 실제 캔버스 크기
const canvasHeight = ref(ACTUAL_CANVAS_HEIGHT)  // 실제 캔버스 크기

// 세로모드일 때 동적 viewBox 크기
const dynamicCanvasWidth = ref(1550)
const dynamicCanvasHeight = ref(700)

// 줌 및 팬 관련 상태
const zoomLevel = ref(1)  // 현재 줌 레벨 (1 = 100%)
// 최소 줌: 뷰포트가 항상 캔버스로 채워지도록 계산
const minZoom = Math.max(
  INITIAL_VIEWPORT_WIDTH / ACTUAL_CANVAS_WIDTH,
  INITIAL_VIEWPORT_HEIGHT / ACTUAL_CANVAS_HEIGHT
)  // 0.5 (50%) - 빈 공간이 보이지 않는 최소 줌
// 최대 줌은 캔버스 실제 크기까지만 (뷰포트 크기 대비)
const maxZoom = Math.min(
  ACTUAL_CANVAS_WIDTH / INITIAL_VIEWPORT_WIDTH,
  ACTUAL_CANVAS_HEIGHT / INITIAL_VIEWPORT_HEIGHT
)  // 3100/1550 = 2, 1440/720 = 2 → 최대 2배
const panOffset = ref({ x: 0, y: 0 })  // 팬 오프셋
const isPanning = ref(false)  // 팬 진행 중인지
const panStartPoint = ref({ x: 0, y: 0 })  // 팬 시작 지점

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
    
    // Canvas dimensions updated
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
interface LockerTypeItem {
  id: string
  name: string
  width: number
  height: number
  depth: number
  color?: string
  type?: string
}
const lockerTypes = ref<LockerTypeItem[]>([])

// Loading states
const isLoading = ref(false)
const isLoadingTypes = ref(true)
const isLoadingLockers = ref(true)
const hasLoadedTypes = ref(false)
const saveError = ref<string | null>(null)
const loadError = ref<string | null>(null)

// API Base URL - Use CodeIgniter config when available
const getApiBaseUrl = () => {
  if (isCodeIgniterEnvironment()) {
    const config = getLockerConfig()
    return config ? `${config.baseUrl}/api` : '/api'
  }
  return 'http://localhost:3333/api'
}
const API_BASE_URL = getApiBaseUrl()

// Data Loading Functions
const loadZones = async () => {
  try {
    
    const response = await fetch(`${API_BASE_URL}/zones`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    
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
    // Build API URL based on view mode
    const isFloorView = currentViewMode.value === 'floor'
    const apiUrl = isFloorView 
      ? `${API_BASE_URL}/lockrs?parentOnly=true` 
      : `${API_BASE_URL}/lockrs`
    
    
    
    
    
    
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    
    
    // DETAILED DEBUG: 각 락커의 parent 관계 출력
    if (data.lockers) {
      
      data.lockers.forEach(locker => {
        const isParent = locker.PARENT_LOCKR_CD === null
        const parentInfo = isParent ? 'PARENT' : `CHILD of ${locker.PARENT_LOCKR_CD}`
        // console.log(`  ${locker.LOCKR_LABEL}: ${parentInfo} (PARENT_LOCKR_CD: ${locker.PARENT_LOCKR_CD})`)
      })
    }
    
    if (data.success && data.lockers) {
      // Transform backend data to frontend format
      const transformedLockers = data.lockers.map(locker => {
        // 타입 정보에서 실제 치수 가져오기
        const lockerType = lockerTypes.value.find(t => t.id === locker.LOCKR_TYPE_CD)
        const typeWidth = lockerType?.width || 40
        const typeHeight = lockerType?.height || 60  // 실제 높이
        const typeDepth = lockerType?.depth || 40
        
        // Type mapping check removed
        
        // CRITICAL DEBUG: Parent-child relationship transformation
        const parentLockerId = locker.PARENT_LOCKR_CD ? `locker-${locker.PARENT_LOCKR_CD}` : null
        

        const transformedLocker = {
          id: `locker-${locker.LOCKR_CD}`,
          lockrCd: locker.LOCKR_CD,
          number: locker.LOCKR_LABEL || `L${locker.LOCKR_CD}`,
          x: locker.X !== null && locker.X !== undefined ? locker.X : undefined,
          y: locker.Y !== null && locker.Y !== undefined ? locker.Y : undefined,
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
          // Parent-child relationship
          parentLockerId: parentLockerId,  // THIS WAS MISSING!
          parentLockrCd: locker.PARENT_LOCKR_CD,
          tierLevel: locker.TIER_LEVEL,
          lockrStat: locker.LOCKR_STAT
        }
        
        // CRITICAL DEBUG: Verify actualHeight is in the transformed object
        
        
        return transformedLocker
      })
      
      // Update the store with transformed data
      lockerStore.lockers = transformedLockers
      
      // DETAILED DEBUG: Store에 저장된 데이터 확인
      
      lockerStore.lockers.forEach(locker => {
        const isParent = !locker.parentLockrCd
        const parentInfo = isParent ? 'PARENT' : `CHILD of ${locker.parentLockrCd}`
        // console.log(`  ${locker.number}: ${parentInfo} (parentLockrCd: ${locker.parentLockrCd})`)
      })
      
      // CRITICAL DEBUG: Verify actualHeight is preserved in store
      transformedLockers.forEach(locker => {
        if (locker.number === 'L3' || locker.number === 'L4') {
          
        } else if (locker.number === 'L1' || locker.number === 'L2' || locker.number === 'L5') {
          
        }
      })
      
      
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
    // console.log('Loading locker types from API...')
    
    const response = await fetch(`${API_BASE_URL}/types`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    // console.log('Types API response:', data)
    
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
      // console.log('Locker types loaded and transformed:', transformedTypes.length)
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
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update locker placement: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      return result
    }
  } catch (error) {
    console.error('[API] Locker placement update failed:', error)
    saveError.value = 'Failed to update locker placement'
    throw error
  }
}

// Batch update locker numbers for improved performance
const batchUpdateLockerNumbers = async (updates: Array<{lockrCd: string, LOCKR_NO: number}>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lockrs/batch-numbers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to batch update locker numbers: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      return result
    } else {
      throw new Error(`Batch update failed: ${result.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('[API] Batch locker number update failed:', error)
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
      // Round positions to avoid floating point precision issues
      const roundedX = Math.round(pos.x * 100) / 100
      const roundedY = Math.round(pos.y * 100) / 100
      if (locker && locker.lockrCd) {
        // If locker has a database ID, update its position
        return updateLockerPlacement(locker.lockrCd, { 
          X: roundedX, 
          Y: roundedY 
        })
      } else if (locker) {
        // If locker doesn't have a database ID yet, save it first
        const saveData = {
          LOCKR_KND: selectedZone.value?.id,
          LOCKR_TYPE_CD: locker.type || '1',
          X: roundedX,
          Y: roundedY,
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
    
  } catch (error) {
    console.error('[API] Failed to save some locker positions:', error)
  }
}

// Hidden/deleted locker types
const hiddenTypes = ref<string[]>([])

// ========== 통합 외곽선 계산 함수들 ==========
// 다중 선택된 락커들의 통합 경계 계산
const calculateUnifiedBounds = (selectedLockers: any[]) => {
  if (selectedLockers.length <= 1) return null
  
  const LOCKER_VISUAL_SCALE = 2.0
  
  const bounds = selectedLockers.map(locker => {
    // Front view에서는 actualHeight 사용
    const height = currentViewMode.value === 'front' 
      ? (locker.actualHeight || locker.height || 60)
      : (locker.depth || locker.height || 40)
    
    // Use front view coordinates in front view mode
    const x = currentViewMode.value === 'front' 
      ? (locker.frontViewX !== undefined ? locker.frontViewX : locker.x)
      : locker.x
    const y = currentViewMode.value === 'front'
      ? (locker.frontViewY !== undefined ? locker.frontViewY : locker.y) 
      : locker.y
    
    return {
      left: x,
      right: x + (locker.width * LOCKER_VISUAL_SCALE),
      top: y,
      bottom: y + (height * LOCKER_VISUAL_SCALE),
      locker
    }
  })
  
  const minX = Math.min(...bounds.map(b => b.left))
  const maxX = Math.max(...bounds.map(b => b.right))
  const minY = Math.min(...bounds.map(b => b.top))
  const maxY = Math.max(...bounds.map(b => b.bottom))
  
  // 논리적 좌표와 실제 크기로 반환
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

// 인접성 검사 - 면이 닿아있는지 확인
const areAdjacent = (locker1: any, locker2: any, maxGap = 5) => {
  // 락커는 논리적 좌표로 위치하고, 크기만 2배 스케일로 렌더링됨
  const LOCKER_VISUAL_SCALE = 2.0
  
  // Front view에서는 actualHeight 사용
  const height1 = currentViewMode.value === 'front' 
    ? (locker1.actualHeight || locker1.height || 60)
    : (locker1.depth || locker1.height || 40)
  const height2 = currentViewMode.value === 'front' 
    ? (locker2.actualHeight || locker2.height || 60)
    : (locker2.depth || locker2.height || 40)
  
  // Use appropriate coordinates based on view mode
  const getLockerCoords = (locker: any) => {
    if (currentViewMode.value === 'front') {
      return {
        x: locker.frontViewX !== undefined ? locker.frontViewX : locker.x,
        y: locker.frontViewY !== undefined ? locker.frontViewY : locker.y
      }
    } else {
      return { x: locker.x, y: locker.y }
    }
  }
  
  const coords1 = getLockerCoords(locker1)
  const coords2 = getLockerCoords(locker2)
  
  // 논리적 좌표 + 스케일된 크기
  const l1 = { 
    left: coords1.x, 
    right: coords1.x + (locker1.width * LOCKER_VISUAL_SCALE),
    top: coords1.y, 
    bottom: coords1.y + (height1 * LOCKER_VISUAL_SCALE)
  }
  const l2 = { 
    left: coords2.x, 
    right: coords2.x + (locker2.width * LOCKER_VISUAL_SCALE),
    top: coords2.y, 
    bottom: coords2.y + (height2 * LOCKER_VISUAL_SCALE)
  }
  
  // 최대 간격 (논리적 픽셀 단위)
  const scaledMaxGap = maxGap
  
  // 수평 거리 계산 (좌우로 인접)
  const horizontalDistance = Math.min(
    Math.abs(l1.right - l2.left),
    Math.abs(l2.right - l1.left)
  )
  
  // 수직 거리 계산 (위아래로 인접)
  const verticalDistance = Math.min(
    Math.abs(l1.bottom - l2.top),
    Math.abs(l2.bottom - l1.top)
  )
  
  // 수직 인접 체크 (위아래로 붙어있거나 가까이 있음)
  const verticallyClose = verticalDistance <= scaledMaxGap
  const horizontalOverlap = l1.left < l2.right && l2.left < l1.right
  
  // 수평 인접 체크 (좌우로 붙어있거나 가까이 있음)
  const horizontallyClose = horizontalDistance <= scaledMaxGap
  const verticalOverlap = l1.top < l2.bottom && l2.top < l1.bottom
  
  // 인접 여부: 수평 또는 수직으로 가까이 있고 겹치는 부분이 있을 때
  const isAdjacent = (verticallyClose && horizontalOverlap) || (horizontallyClose && verticalOverlap)
  
  // 디버깅 로그
  
  // console.log(`  L1 bounds: x=${l1.left}, right=${l1.right}, y=${l1.top}, bottom=${l1.bottom}`)
  // console.log(`  L2 bounds: x=${l2.left}, right=${l2.right}, y=${l2.top}, bottom=${l2.bottom}`)
  // console.log(`  Distance: horizontal=${horizontalDistance}px (max: ${scaledMaxGap}px), vertical=${verticalDistance}px`)
  // console.log(`  Horizontally close: ${horizontallyClose}, Vertically close: ${verticallyClose}`)
  // console.log(`  Horizontal overlap: ${horizontalOverlap}, Vertical overlap: ${verticalOverlap}`)
  // console.log(`  Result: ${isAdjacent ? '✅ ADJACENT' : '❌ NOT ADJACENT'}`)
  
  return isAdjacent
}

// 연결된 락커 그룹 찾기
const findConnectedGroups = (selectedLockers: any[]) => {
  const groups: any[][] = []
  const visited = new Set()
  
  const dfs = (locker: any, currentGroup: any[]) => {
    if (visited.has(locker.id)) return
    visited.add(locker.id)
    currentGroup.push(locker)
    
    // 인접한 다른 선택된 락커 찾기
    selectedLockers.forEach(other => {
      if (!visited.has(other.id) && areAdjacent(locker, other)) {
        dfs(other, currentGroup)
      }
    })
  }
  
  selectedLockers.forEach(locker => {
    if (!visited.has(locker.id)) {
      const group: any[] = []
      dfs(locker, group)
      groups.push(group)
    }
  })
  
  return groups
}

// 락커의 인접한 면 계산 (회전 고려)
const getAdjacentSides = (lockerId: string): string[] => {
  // 선택되지 않은 락커는 인접 체크 안 함
  if (!selectedLockerIds.value.has(lockerId)) {
    return []
  }
  
  const locker = currentLockers.value.find(l => l.id === lockerId)
  if (!locker) return []
  
  const adjacentSides: string[] = []
  const LOCKER_VISUAL_SCALE = 2.0
  const tolerance = 10 // 인접 판단 허용 오차
  
  // 회전된 락커의 실제 경계 구하기 - 최신 좌표 사용
  const lockerBounds = getRotatedBounds(locker)
  
  // 락커의 회전 각도에 따른 각 변의 방향 결정
  const rotation = (locker.rotation || 0) % 360
  
  // 회전에 따른 변 매핑
  // 0도: top=위, right=오른쪽, bottom=아래, left=왼쪽
  // 90도: top=왼쪽, right=위, bottom=오른쪽, left=아래
  // 180도: top=아래, right=왼쪽, bottom=위, left=오른쪽
  // 270도: top=오른쪽, right=아래, bottom=왼쪽, left=위
  const sideMap = {
    0: { top: 'top', right: 'right', bottom: 'bottom', left: 'left' },
    90: { top: 'left', right: 'top', bottom: 'right', left: 'bottom' },
    180: { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
    270: { top: 'right', right: 'bottom', bottom: 'left', left: 'top' }
  }
  
  const normalizedRotation = Math.round(rotation / 90) * 90 % 360
  const mapping = sideMap[normalizedRotation] || sideMap[0]
  
  // 선택된 다른 락커들과 비교
  selectedLockers.value.forEach(other => {
    if (other.id === lockerId) return
    
    const otherBounds = getRotatedBounds(other)
    
    // 디버깅: 드래그 중 인접 체크
    if (isDragging.value) {
      console.log(`[Adjacent Check] ${lockerId} vs ${other.id}:`, {
        locker: { id: lockerId, rotation, bounds: lockerBounds },
        other: { id: other.id, rotation: other.rotation, bounds: otherBounds },
        mapping
      })
    }
    
    // 실제 위치에서 상단 인접 체크
    if (Math.abs(lockerBounds.y - (otherBounds.y + otherBounds.height)) < tolerance &&
        lockerBounds.x < otherBounds.x + otherBounds.width && 
        lockerBounds.x + lockerBounds.width > otherBounds.x) {
      adjacentSides.push(mapping.top)
      if (isDragging.value) console.log(`  -> TOP adjacent (physical top touches other's bottom)`)
    }
    
    // 실제 위치에서 하단 인접 체크
    if (Math.abs(lockerBounds.y + lockerBounds.height - otherBounds.y) < tolerance &&
        lockerBounds.x < otherBounds.x + otherBounds.width && 
        lockerBounds.x + lockerBounds.width > otherBounds.x) {
      adjacentSides.push(mapping.bottom)
    }
    
    // 실제 위치에서 좌측 인접 체크
    if (Math.abs(lockerBounds.x - (otherBounds.x + otherBounds.width)) < tolerance &&
        lockerBounds.y < otherBounds.y + otherBounds.height && 
        lockerBounds.y + lockerBounds.height > otherBounds.y) {
      adjacentSides.push(mapping.left)
    }
    
    // 실제 위치에서 우측 인접 체크
    if (Math.abs(lockerBounds.x + lockerBounds.width - otherBounds.x) < tolerance &&
        lockerBounds.y < otherBounds.y + otherBounds.height && 
        lockerBounds.y + lockerBounds.height > otherBounds.y) {
      adjacentSides.push(mapping.right)
    }
  })
  
  return [...new Set(adjacentSides)] // 중복 제거
}

// Filter visible locker types
const visibleLockerTypes = computed(() => {
  return lockerTypes.value.filter(type => !hiddenTypes.value.includes(type.id))
})

// 현재 구역의 락커들
const currentLockers = computed(() => {
  if (!selectedZone.value) return []
  
  
  
  
  
  let filtered = lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
  
  // 평면뷰(floor)일 때는 부모 락커만 표시
  if (currentViewMode.value === 'floor') {
    filtered = filtered.filter(l => !l.parentLockrCd)
    
  }
  
  // DETAILED DEBUG: 필터링 결과 분석
  
  filtered.forEach(locker => {
    const isParent = !locker.parentLockrCd
    const parentInfo = isParent ? 'PARENT' : `CHILD of ${locker.parentLockrCd}`
    // Debug removed
  })
  
  return filtered
})

// Compute display versions of lockers with scaled dimensions
const displayLockers = computed(() => {
  // Backend should provide appropriate lockers based on view mode
  
  const filteredLockers = currentLockers.value
  
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
      // Front view: Use NEW algorithm positions if available, fallback to original
      const scale = getCurrentScale()
      
      if (locker.frontViewX !== undefined && locker.frontViewX !== null && 
          locker.frontViewY !== undefined && locker.frontViewY !== null) {
        // 새로운 알고리즘 결과 사용
        displayX = locker.frontViewX * scale
        displayY = locker.frontViewY * scale
        displayHeight = lockerActualHeight * scale
      } else {
        // FALLBACK: 정면뷰 좌표가 없을 때 평면 좌표를 임시로 사용
        // 평면배치 좌표를 임시로 사용하여 좌측 상단 몰림 방지
        if (locker.x !== undefined && locker.x !== null && 
            locker.y !== undefined && locker.y !== null) {
          // 평면 좌표를 임시 위치로 사용 (화면 중앙 근처에 배치)
          const tempX = 400 + (index * 80) // 화면 중앙부터 시작, 80px 간격
          const tempY = 200 // 화면 위쪽 200px 위치
          displayX = tempX
          displayY = tempY
          displayHeight = lockerActualHeight * scale
        } else {
          // 좌표가 전혀 없는 경우 (매우 드묾)
          displayX = 100 + (index * 100) // 겹치지 않게 임시 배치
          displayY = 100
          displayHeight = lockerActualHeight * scale
        }
      }
    }
    
    const displayWidth = locker.width * getCurrentScale() // 모든 뷰모드에서 동일한 렌더링 스케일 적용
    
    // CRITICAL DEBUG: Check actualHeight preservation
    
    
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
      const frontViewHeight = locker.actualHeight || locker.height || 60
      const targetX = locker.displayX / getCurrentScale()
      const targetY = locker.displayY / getCurrentScale()
      const targetRotation = locker.frontViewRotation !== undefined ? locker.frontViewRotation : 0
      
      // 값이 변경되지 않았으면 원본 객체 반환 (바운스 방지)
      if (locker.x === targetX && 
          locker.y === targetY && 
          locker.height === frontViewHeight &&
          locker.rotation === targetRotation) {
        return locker
      }
      
      // 값이 변경된 경우에만 새 객체 생성
      return {
        ...locker,
        x: targetX,
        y: targetY,
        height: frontViewHeight,
        actualHeight: frontViewHeight,
        rotation: targetRotation
      }
    }
    return locker
  })
  
  // 세로 모드에서는 z-index 재정렬 하지 않음 (바운스 방지)
  if (currentViewMode.value === 'front') {
    return lockers
  }
  
  // 평면 모드에서만 선택된 락커를 위로
  if (selectedLocker.value) {
    const selectedIndex = lockers.findIndex(l => l.id === selectedLocker.value.id)
    if (selectedIndex > -1) {
      // 선택된 락커를 배열 끝으로 이동
      const [selected] = lockers.splice(selectedIndex, 1)
      lockers.push(selected)
    }
  }
  return lockers
})

// 선택된 락커들 (다중 선택을 위한 준비)
// 선택된 락커들 (다중 선택 지원)
const selectedLockers = computed(() => {
  return currentLockers.value.filter(locker => selectedLockerIds.value.has(locker.id))
})

// 연결된 락커 그룹들
const connectedGroups = computed(() => {
  return findConnectedGroups(selectedLockers.value)
})

// 통합 외곽선이 필요한 락커들
const lockersNeedingUnifiedOutline = computed(() => {
  const result = new Set()
  connectedGroups.value.forEach(group => {
    if (group.length > 1) {
      group.forEach(locker => result.add(locker.id))
    }
  })
  return result
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
  
  const currentLocker = currentLockers.value.find(l => l.id === selectedLocker.value.id)
  if (currentLocker) {
    if (currentViewMode.value === 'front') {
      // Use front view coordinates in front view mode
      return {
        x: currentLocker.frontViewX !== undefined ? currentLocker.frontViewX : currentLocker.x,
        y: currentLocker.frontViewY !== undefined ? currentLocker.frontViewY : currentLocker.y
      }
    } else {
      // Use floor coordinates in floor view mode
      return {
        x: currentLocker.x,
        y: currentLocker.y
      }
    }
  }
  
  // Fallback to selected locker position
  return {
    x: selectedLocker.value.x,
    y: selectedLocker.value.y
  }
}

const getLockerDimensions = (locker) => {
  if (!locker) return { width: 0, height: 0 }
  
  // Apply visual scale to match the display
  const LOCKER_VISUAL_SCALE = 2.0
  
  if (currentViewMode.value === 'floor') {
    // Floor view (평면배치): Width x Depth
    return {
      width: (locker.width || 40) * LOCKER_VISUAL_SCALE,
      height: (locker.depth || locker.height || 40) * LOCKER_VISUAL_SCALE
    }
  } else {
    // Front view (세로배치): Width x Height
    // actualHeight를 우선적으로 사용 (장락커 등의 실제 높이)
    return {
      width: (locker.width || 40) * LOCKER_VISUAL_SCALE,
      height: (locker.actualHeight || locker.height || 60) * LOCKER_VISUAL_SCALE
    }
  }
}

// 회전 상태 관리
const isRotating = ref(false)
const rotationJustEnded = ref(false)

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
const selectZone = async (zone) => {
  selectedZone.value = zone
  selectedLocker.value = null
  
  // 정면배치 모드일 때는 락커 데이터를 새로 로드하고 그루핑 수행
  if (currentViewMode.value === 'front') {
    console.log('[Zone Change] Loading lockers for zone in front view mode...')
    await loadLockers() // 새 구역의 락커 데이터 로드
    
    nextTick(() => {
      // front_view 좌표가 없는 락커가 있는지 확인
      const hasNullCoords = currentLockers.value.some(locker => 
        locker.frontViewX == null || locker.frontViewY == null
      )
      
      if (hasNullCoords) {
        console.log('[Zone Change] Found lockers without front view coordinates, recalculating...')
        // 좌표가 없으면 그루핑하여 재계산
        transformToFrontViewNew()
      } else {
        console.log('[Zone Change] All lockers have front view coordinates')
      }
    })
  }
  
  // 구역 변경 시 모든 락커가 화면에 보이도록 자동 조정
  setTimeout(() => {
    autoFitLockers()
  }, 100)  // 약간의 지연으로 락커 데이터 로드 완료 후 실행
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
      
      
      // Refresh zones
      await loadZones()
      
      // If deleted zone was selected, select another zone or clear selection
      if (selectedZone.value?.id === zone.id) {
        if (zones.value.length > 0) {
          selectZone(zones.value[0])
        } else {
          selectedZone.value = null
        }
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
    
    
    
    // Call API
    const response = await fetch(`${API_BASE_URL}/types/${type.id}`, {
      method: 'DELETE'
    })
    
    
    
    if (!response.ok) {
      const errorData = await response.json()
      
      throw new Error(errorData.message || 'Failed to delete locker type')
    }
    
    const result = await response.json()
    
    
    if (result.success) {
      
      
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
  // Type selected
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
    // Check for collision at current position using proper collision detection
    const hasCollision = checkCollisionForLocker(x, y, width, depth, null, 0, false)
    
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
  // Add button clicked
  
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
    number: findNextAvailableLabel()  // Use label for floor mode
  }
  
  // Creating locker
  
  // Save to database first (this will also add to store via loadLockers)
  let created = null
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
      // Locker saved successfully, reload to get it from server
      await loadLockers()
      // Auto-fit zoom to show all lockers
      autoFitLockers()
      // Find the newly created locker
      created = currentLockers.value.find(l => 
        l.x === newLocker.x && 
        l.y === newLocker.y && 
        l.number === newLocker.number
      )
    }
  } catch (error) {
    console.error('[Database] Failed to save locker:', error)
    // If save fails, add locally only
    created = lockerStore.addLocker(newLocker)
  }
  
  // Select the newly added locker if created
  if (created) {
    selectedLocker.value = created
    selectedLockerIds.value.clear()
    selectedLockerIds.value.add(created.id)
    showSelectionUI.value = true
  }
  
  // Debug all locker dimensions after adding
  debugLockerDimensions()
  
  // Locker placed successfully
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
      // Skipping non-parent locker
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
      // Calculate tier level for this parent
      const existingChildren = currentLockers.value.filter(l => 
        l.parentLockrCd === locker.lockrCd || l.parentLockerId === locker.id
      )
      
      const maxExistingTier = existingChildren.reduce((max, child) => 
        Math.max(max, child.tierLevel || 0), 0
      )
      
      const startTierLevel = maxExistingTier > 0 ? maxExistingTier + 1 : 1
      
      console.log(`[AddFloors] Tier level calculation:`, {
        lockerId: locker.id,
        lockrCd: locker.lockrCd,
        existingChildrenCount: existingChildren.length,
        maxExistingTier: maxExistingTier,
        startTierLevel: startTierLevel,
        algorithm: maxExistingTier > 0 ? 
          `Children exist -> Start from tier ${startTierLevel}` : 
          `No children -> Start from tier 1`
      })
      
      // Call API to add tiers
      console.log('[AddFloors] Sending to backend:', { 
        lockrCd: locker.lockrCd,
        tierCount, 
        startTierLevel,
        parentFrontViewX: locker.frontViewX, 
        parentFrontViewY: locker.frontViewY 
      })
      
      const newTiers = await lockerApi.addTiers(
        locker.lockrCd, 
        tierCount, 
        locker.frontViewX, 
        locker.frontViewY,
        startTierLevel
      )
      
      if (newTiers && newTiers.length > 0) {
        // Add new tiers to local store
        newTiers.forEach(tier => {
          lockerStore.addLocker(tier)
        })
        
        console.log(`[AddFloors] Added ${newTiers.length} tiers to locker ${locker.lockrLabel || locker.number}`)
        addedCount++
      }
    } catch (error) {
      console.error(`[Tiers] Failed to add tiers to locker ${lockerId}:`, error)
    }
  }
  
  // Show result
  if (addedCount > 0) {
    console.log(`[AddFloors] Successfully added ${tierCount} tiers starting from level ${startTierLevel}`)
    
    // Refresh locker display - use proper loadLockers to preserve actualHeight
    if (lockerStore.isOnlineMode) {
      await loadLockers()  // Use page component's loadLockers instead of store's
    }
  }
  
  if (skippedCount > 0) {
    // Some lockers skipped
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
  // Adding new locker
  
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
    number: findNextAvailableLabel(),  // Use label for floor mode
    zoneId: selectedZone.value.id
  }
  
  // Creating locker with properties
  
  // Save to database first (this will also add to store via loadLockers)
  let created = null
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
      // Locker saved successfully, it will be loaded via loadLockers
      await loadLockers()
      // Auto-fit zoom to show all lockers
      autoFitLockers()
      // Find the newly created locker
      created = currentLockers.value.find(l => 
        l.x === newLocker.x && 
        l.y === newLocker.y && 
        l.number === newLocker.number
      )
    }
  } catch (error) {
    console.error('[Database] Failed to save locker:', error)
    // If save fails, add locally only
    created = lockerStore.addLocker(newLocker)
  }
  
  // Select the newly added locker if created
  if (created) {
    selectedLocker.value = created
    selectedLockerIds.value.clear()
    selectedLockerIds.value.add(created.id)
    showSelectionUI.value = true
  }
  
  // Debug all locker dimensions after adding
  debugLockerDimensions()
  
  // Add pulse animation feedback
  const event = window.event as MouseEvent
  if (event && event.currentTarget) {
    const card = event.currentTarget as HTMLElement
    card.classList.add('pulse-animation')
    setTimeout(() => card.classList.remove('pulse-animation'), 300)
  }
  
  // Locker added successfully
}

// Restore deleted locker type
const restoreLockerType = (typeId: string) => {
  const index = hiddenTypes.value.indexOf(typeId)
  if (index > -1) {
    hiddenTypes.value.splice(index, 1)
  }
  // Locker type restored
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
  // Removed mouse move logging to reduce console noise
  
  // SVG coordinates are already in logical space (not display space)
  // because viewBox defines the logical coordinate system
  // Round to avoid floating point precision issues
  return {
    x: Math.round(svgP.x * 100) / 100,
    y: Math.round(svgP.y * 100) / 100
  }
}

// 줌 이벤트 핸들러
const handleWheel = (event: WheelEvent) => {
  // 평면모드(floor)와 세로배치(front) 모드에서만 작동
  if (currentViewMode.value !== 'floor' && currentViewMode.value !== 'front') {
    return
  }
  
  // Ctrl 키가 눌려있을 때만 줌
  if (!event.ctrlKey) {
    return
  }
  
  event.preventDefault()
  
  // SVG 요소와 현재 뷰포트 크기 가져오기
  const svg = event.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  
  // 마우스 위치를 뷰포트 비율로 계산 (0~1)
  const mouseViewportX = (event.clientX - rect.left) / rect.width
  const mouseViewportY = (event.clientY - rect.top) / rect.height
  
  // 현재 뷰포트 크기 계산
  const currentViewportWidth = INITIAL_VIEWPORT_WIDTH / zoomLevel.value
  const currentViewportHeight = INITIAL_VIEWPORT_HEIGHT / zoomLevel.value
  
  // 마우스 위치의 캔버스 좌표 계산
  const mouseCanvasX = panOffset.value.x + mouseViewportX * currentViewportWidth
  const mouseCanvasY = panOffset.value.y + mouseViewportY * currentViewportHeight
  
  // 줌 계산
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.min(Math.max(zoomLevel.value * delta, minZoom), maxZoom)
  
  // 마우스 위치를 중심으로 줌
  if (newZoom !== zoomLevel.value) {
    // 새로운 뷰포트 크기
    const newViewportWidth = INITIAL_VIEWPORT_WIDTH / newZoom
    const newViewportHeight = INITIAL_VIEWPORT_HEIGHT / newZoom
    
    // 마우스 위치가 동일한 화면 위치에 유지되도록 pan offset 계산
    const newOffset = {
      x: mouseCanvasX - mouseViewportX * newViewportWidth,
      y: mouseCanvasY - mouseViewportY * newViewportHeight
    }
    
    // 팬 오프셋을 경계 내로 제한
    panOffset.value = clampPanOffset(newOffset, newZoom)
    zoomLevel.value = newZoom
  }
}

// 팬 오프셋을 캔버스 경계 내로 제한하는 함수
const clampPanOffset = (offset: { x: number, y: number }, zoom: number) => {
  // 현재 줌 레벨에서의 뷰포트 크기
  const viewportWidth = INITIAL_VIEWPORT_WIDTH / zoom
  const viewportHeight = INITIAL_VIEWPORT_HEIGHT / zoom
  
  // 팬 가능한 최소/최대 오프셋
  const minX = 0
  const minY = 0
  const maxX = Math.max(0, ACTUAL_CANVAS_WIDTH - viewportWidth)
  const maxY = Math.max(0, ACTUAL_CANVAS_HEIGHT - viewportHeight)
  
  return {
    x: Math.max(minX, Math.min(maxX, offset.x)),
    y: Math.max(minY, Math.min(maxY, offset.y))
  }
}

// 줌 리셋 함수
const resetZoom = () => {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
}

// 자동 줌 조정 함수 - 모든 락커가 화면에 보이도록
const autoFitLockers = () => {
  console.log('[AutoFit] Starting autoFitLockers...', {
    lockersCount: currentLockers.value.length,
    viewMode: currentViewMode.value
  })
  
  // 배치된 락커가 없으면 기본 줌으로
  if (currentLockers.value.length === 0) {
    console.log('[AutoFit] No lockers found, using default zoom')
    zoomLevel.value = 1
    panOffset.value = { x: 0, y: 0 }
    return
  }
  
  // 모든 락커의 경계 계산
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  
  // Visual scale for display
  const LOCKER_VISUAL_SCALE = 2.0
  
  let processedCount = 0
  currentLockers.value.forEach(locker => {
    // 부모 락커만 계산 (tier 락커 제외)
    if (locker.parentLockerId) return
    processedCount++
    
    let left, top, right, bottom
    
    if (currentViewMode.value === 'floor') {
      // Floor mode: use x, y, width, depth
      left = locker.x
      top = locker.y
      right = locker.x + (locker.width || 40) * LOCKER_VISUAL_SCALE
      bottom = locker.y + (locker.depth || locker.height || 40) * LOCKER_VISUAL_SCALE
    } else if (currentViewMode.value === 'front') {
      // Front mode: use frontViewX, frontViewY, width, actualHeight
      left = locker.frontViewX !== undefined ? locker.frontViewX : locker.x
      top = locker.frontViewY !== undefined ? locker.frontViewY : locker.y
      right = left + (locker.width || 40) * LOCKER_VISUAL_SCALE
      // Use actualHeight for front view (for tall lockers)
      bottom = top + (locker.actualHeight || locker.height || 60) * LOCKER_VISUAL_SCALE
    } else {
      return // Skip unsupported view modes
    }
    
    minX = Math.min(minX, left)
    minY = Math.min(minY, top)
    maxX = Math.max(maxX, right)
    maxY = Math.max(maxY, bottom)
  })
  
  // 락커가 없거나 유효하지 않은 경계인 경우
  if (minX === Infinity || minY === Infinity) {
    zoomLevel.value = 1
    panOffset.value = { x: 0, y: 0 }
    return
  }
  
  // 필요한 영역 크기
  const requiredWidth = maxX - minX
  const requiredHeight = maxY - minY
  
  // 여백 추가 (30% for better visibility and comfortable viewing)
  const margin = 0.30
  const totalWidth = requiredWidth * (1 + margin)
  const totalHeight = requiredHeight * (1 + margin)
  
  // 필요한 줌 레벨 계산
  const zoomForWidth = INITIAL_VIEWPORT_WIDTH / totalWidth
  const zoomForHeight = INITIAL_VIEWPORT_HEIGHT / totalHeight
  let newZoom = Math.min(zoomForWidth, zoomForHeight)
  
  // 뷰 모드 전환 시 세 단계 더 줌아웃 (0.9 * 0.9 * 0.9 = 0.729)
  newZoom = newZoom * 0.729
  
  // 줌 범위 제한
  newZoom = Math.max(minZoom, Math.min(newZoom, maxZoom))
  
  // 중앙 정렬을 위한 팬 오프셋 계산
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const viewCenterX = INITIAL_VIEWPORT_WIDTH / (2 * newZoom)
  const viewCenterY = INITIAL_VIEWPORT_HEIGHT / (2 * newZoom)
  
  // 줌과 팬 적용
  zoomLevel.value = newZoom
  const newOffset = {
    x: centerX - viewCenterX,
    y: centerY - viewCenterY
  }
  
  // 팬 오프셋을 경계 내로 제한
  panOffset.value = clampPanOffset(newOffset, newZoom)
  
  console.log('[AutoFit]', currentViewMode.value, 'mode - Zoom:', newZoom, 'Pan:', panOffset.value, 'Bounds:', {minX, minY, maxX, maxY})
}

// 캔버스 마우스 다운 처리
const handleCanvasMouseDown = (event) => {
  // 평면모드(floor)와 세로배치(front) 모드에서 중간 마우스 버튼 (휠 클릭) 처리
  if ((currentViewMode.value === 'floor' || currentViewMode.value === 'front') && event.button === 1) {
    event.preventDefault()
    isPanning.value = true
    panStartPoint.value = {
      x: event.clientX,
      y: event.clientY
    }
    return
  }
  
  // Get correct SVG coordinates
  const pos = getMousePosition(event)
  const x = pos.x
  const y = pos.y
  
  // console.log('[SVG Coords] Mouse down at:', { x, y })
  
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
  
  // console.log('[MouseDown] Target:', target.tagName, 'Classes:', target.className, 'IsEmpty:', isEmptySpace, 'IsLocker:', isLockerElement)
  
  // Only start drag selection on truly empty space
  if (isEmptySpace && !isDragging.value) {
    // console.log('[Rectangle Select] Starting at', x, y)
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
  // 평면모드(floor)와 세로배치(front) 모드에서 팬 처리
  if ((currentViewMode.value === 'floor' || currentViewMode.value === 'front') && isPanning.value) {
    const deltaX = (event.clientX - panStartPoint.value.x) / zoomLevel.value
    const deltaY = (event.clientY - panStartPoint.value.y) / zoomLevel.value
    
    const newOffset = {
      x: panOffset.value.x - deltaX,
      y: panOffset.value.y - deltaY
    }
    
    // 팬 오프셋을 경계 내로 제한
    panOffset.value = clampPanOffset(newOffset, zoomLevel.value)
    
    panStartPoint.value = {
      x: event.clientX,
      y: event.clientY
    }
    return
  }
  
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
  // 평면모드(floor)와 세로배치(front) 모드에서 팬 종료
  if ((currentViewMode.value === 'floor' || currentViewMode.value === 'front') && isPanning.value) {
    isPanning.value = false
    return
  }
  
  // Don't handle if rotating or just finished rotating
  if (isRotating.value || rotationJustEnded.value) {
    // console.log('[Canvas MouseUp] Ignored - rotation in progress or just ended')
    return
  }
  
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
      // console.log('[Rectangle Select] Setting dragSelectionJustFinished flag to true')
      
      // Ensure selection UI is shown after drag selection
      if (selectedLockerIds.value.size > 0) {
        showSelectionUI.value = true
      }
      
      // Clear flag after a short delay
      setTimeout(() => {
        dragSelectionJustFinished.value = false
        // console.log('[Rectangle Select] Cleared dragSelectionJustFinished flag')
      }, 100)
      
      // console.log('[Rectangle Select] Finished selection')
      // console.log('[Rectangle Select] Start:', dragSelectStart.value, 'End:', dragSelectEnd.value)
      // console.log('[Rectangle Select] Selected lockers:', Array.from(selectedLockerIds.value))
      // console.log('[Rectangle Select] Current selection count:', selectedLockerIds.value.size)
    } else {
      // Just a click, clear selection (but not if rotating)
      if (!isRotating.value) {
        selectedLockerIds.value.clear()
        selectedLocker.value = null
        // console.log('[Rectangle Select] Cancelled - not enough drag distance')
      }
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
  
  // Debug log removed
  
  selectedLockerIds.value.clear()
  
  currentLockers.value.forEach(locker => {
    let lockerLeft, lockerRight, lockerTop, lockerBottom
    
    if (currentViewMode.value === 'front') {
      // Use front view positions for hit detection (already scaled in positionLockersInFrontView)
      const frontX = locker.frontViewX !== undefined ? locker.frontViewX : locker.x
      const frontY = locker.frontViewY !== undefined ? locker.frontViewY : locker.y
      const dims = getLockerDimensions(locker)  // Use same function for consistency
      
      lockerLeft = frontX
      lockerRight = frontX + dims.width
      lockerTop = frontY
      lockerBottom = frontY + dims.height
    } else {
      // Use floor view positions
      const dims = getLockerDimensions(locker)
      lockerLeft = locker.x
      lockerRight = locker.x + dims.width
      lockerTop = locker.y
      lockerBottom = locker.y + dims.height
    }
    
    // Debug removed
    
    // Check for ANY overlap (not just complete containment)
    const overlaps = !(lockerRight < minX || lockerLeft > maxX || 
                       lockerBottom < minY || lockerTop > maxY)
    
    if (overlaps) {
      
      selectedLockerIds.value.add(locker.id)
    }
  })
  
  
  
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
// 팝업 오버레이 클릭 핸들러 - 드래그 중이거나 작업 중일 때는 닫지 않음
const handleFloorModalOverlayClick = () => {
  // 드래그 중이거나 다른 작업 중일 때는 팝업을 닫지 않음
  if (isDragging.value || selectionBox.value.isSelecting || lockerDragJustFinished.value) {
    console.log('[Modal] Floor modal close prevented - operation in progress')
    return
  }
  floorInputVisible.value = false
}

const handleNumberModalOverlayClick = () => {
  // 드래그 중이거나 다른 작업 중일 때는 팝업을 닫지 않음
  if (isDragging.value || selectionBox.value.isSelecting || lockerDragJustFinished.value) {
    console.log('[Modal] Number modal close prevented - operation in progress')
    return
  }
  numberAssignVisible.value = false
}

const handleCanvasClick = (event) => {
  // Check if any drag operation or rotation just finished - if so, ignore this click
  if (dragSelectionJustFinished.value || lockerDragJustFinished.value || rotationJustEnded.value) {
    // Debug removed
    return
  }
  
  // Debug removed
  
  // SVG 체크를 더 유연하게 수정
  const target = event.target
  const isBackgroundClick = target.tagName === 'svg' || 
                           target.classList.contains('canvas-background') ||
                           (target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)') ||
                           target.classList.contains('canvas')
  
  // 배경 클릭 시 선택 해제 (Ctrl/Shift 키가 없을 때만)
  if (isBackgroundClick && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
    
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
    // Front view drag disabled
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
          number: '', // Will be assigned after adding to store
          x: original.x + 20, // Offset to show it's a copy
          y: original.y + 20
        }
        const newLocker = lockerStore.addLocker(copy)
        // Assign unique number after adding
        lockerStore.updateLocker(newLocker.id, { lockrNo: findNextAvailableLabel() })  // Use label for duplicate
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
    // Round positions to avoid floating point precision issues
    const roundedX = Math.round(l.x * 100) / 100
    const roundedY = Math.round(l.y * 100) / 100
    const leaderX = Math.round(leaderLocker.x * 100) / 100
    const leaderY = Math.round(leaderLocker.y * 100) / 100
    const relativeX = roundedX - leaderX  // Relative position to leader
    const relativeY = roundedY - leaderY  // Relative position to leader
    return {
      id: l.id,
      initialX: roundedX,
      initialY: roundedY,
      relativeX: relativeX,  // Store relative position to leader
      relativeY: relativeY,  // Store relative position to leader
      isLeader: l.id === leaderLocker.id
    }
  })
  
  // Calculate offset between mouse and leader locker position
  // Use rounded leader position for consistency
  const leaderX = Math.round(leaderLocker.x * 100) / 100
  const leaderY = Math.round(leaderLocker.y * 100) / 100
  dragOffset.value = {
    x: mousePos.x - leaderX,
    y: mousePos.y - leaderY
  }
  
  const selectedCount = selectedLockerIds.value.size
  if (selectedCount > 1) {
    console.log('[Group Drag] Started with', selectedCount, 'lockers, leader:', leaderLocker.id)
  } else {
    console.log('[Drag] Start dragging locker:', locker.id)
  }
  event.preventDefault()
}

// 그룹 회전을 위한 상태 저장
const groupRotationState = ref(null)

// 락커 회전 시작 (드래그 기반)
const startRotateLocker = (locker, event) => {
  if (!locker) return
  
  // Don't change selection if multiple lockers are selected
  // Only update selectedLocker if it's not already part of the selection
  if (!selectedLockerIds.value.has(locker.id)) {
    selectedLocker.value = locker
    selectedLockerIds.value.add(locker.id)
  }
  isRotating.value = true
  
  // Rotation started
  
  // 다중 선택시 그룹 회전 정보 미리 계산 및 저장
  if (selectedLockerIds.value.size > 1) {
    const selectedArray = Array.from(selectedLockerIds.value)
    const selectedLockers = currentLockers.value.filter(l => selectedArray.includes(l.id))
    
    // 그룹 중심점 계산 (한 번만)
    const bounds = {
      minX: Math.min(...selectedLockers.map(l => l.x)),
      maxX: Math.max(...selectedLockers.map(l => l.x + l.width)),
      minY: Math.min(...selectedLockers.map(l => l.y)),
      maxY: Math.max(...selectedLockers.map(l => l.y + (l.height || l.depth || 40)))
    }
    
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    
    // 각 락커의 초기 상대 위치 저장
    const lockerStates = new Map()
    selectedLockers.forEach(l => {
      const dims = getLockerDimensions(l)
      const lockerCenterX = l.x + dims.width / 2
      const lockerCenterY = l.y + dims.height / 2
      
      lockerStates.set(l.id, {
        relativeX: lockerCenterX - centerX,
        relativeY: lockerCenterY - centerY,
        width: dims.width,
        height: dims.height,
        initialRotation: l.rotation || 0
      })
    })
    
    // 그룹 회전 상태 저장
    groupRotationState.value = {
      centerX,
      centerY,
      lockerStates,
      leaderId: locker.id
    }
    
    // Group rotation state initialized
  } else {
    groupRotationState.value = null
  }
  
  // 회전 중 다른 상호작용 비활성화
  isDragging.value = false
}

// 회전 중 각도 업데이트
const handleRotateMove = (lockerId: string, newRotation: number) => {
  // 회전 중에는 자유롭게 회전 (스냅 없음)
  // 다중 선택 체크
  if (selectedLockerIds.value.size > 1 && groupRotationState.value) {
    // 저장된 그룹 회전 상태 사용
    const state = groupRotationState.value
    const leaderLocker = currentLockers.value.find(l => l.id === lockerId)
    if (!leaderLocker || !state) return
    
    // 리더 락커의 이전 회전값 저장 (처음 호출 시에만)
    if (leaderLocker._lastRotation === undefined) {
      leaderLocker._lastRotation = leaderLocker.rotation || 0
      console.log('=== ROTATION INIT ===')
      console.log('  Initial rotation set to:', leaderLocker._lastRotation)
    }
    
    // Delta 계산 - 개선된 방식
    let rotationDelta = newRotation - leaderLocker._lastRotation  // 원래대로 복구
    
    console.log('=== ROTATION DEBUG ===')
    console.log('  newRotation:', newRotation)
    console.log('  lastRotation:', leaderLocker._lastRotation)
    console.log('  raw delta:', rotationDelta)
    
    // 360도 경계 처리 개선 - 더 안정적인 처리
    // 정규화: -180 ~ 180 범위로 변환
    while (rotationDelta > 180) {
      rotationDelta -= 360
      console.log('  → Adjusted delta (>180):', rotationDelta)
    }
    while (rotationDelta < -180) {
      rotationDelta += 360
      console.log('  → Adjusted delta (<-180):', rotationDelta)
    }
    
    // 방향 전환 감지 및 보정
    const prevDirection = leaderLocker._rotationDirection || 0
    const currentDirection = Math.sign(rotationDelta)
    
    if (prevDirection !== 0 && currentDirection !== 0 && prevDirection !== currentDirection) {
      console.log('  Direction change detected! prev:', prevDirection, 'current:', currentDirection)
    }
    
    leaderLocker._rotationDirection = currentDirection
    leaderLocker._lastRotation = newRotation  // 누적값 그대로 유지
    
    console.log('  Final delta:', rotationDelta)
    
    // 저장된 고정 중심점 사용
    const centerX = state.centerX
    const centerY = state.centerY
    
    // 각 선택된 락커를 고정된 중심점 기준으로 회전
    const selectedArray = Array.from(selectedLockerIds.value)
    selectedArray.forEach(lockerId => {
      const locker = currentLockers.value.find(l => l.id === lockerId)
      if (!locker) return
      
      const lockerState = state.lockerStates.get(lockerId)
      if (!lockerState) return
      
      // 초기 상대 위치에서 회전 변환 적용
      // 전체 회전각 = 초기 회전각 + 누적 delta
      const totalRotation = newRotation - (state.lockerStates.get(state.leaderId).initialRotation || 0)  // 원래대로 복구
      const radians = (totalRotation * Math.PI) / 180
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      
      // 초기 상대 위치를 회전
      const newCenterX = lockerState.relativeX * cos - lockerState.relativeY * sin + centerX
      const newCenterY = lockerState.relativeX * sin + lockerState.relativeY * cos + centerY
      
      // 왼쪽 상단 모서리 위치로 변환
      locker.x = newCenterX - lockerState.width / 2
      locker.y = newCenterY - lockerState.height / 2
      
      // 각 락커의 rotation 값도 함께 업데이트 (회전 중에는 자유롭게)
      if (locker.id === state.leaderId) {
        // 리더 락커는 newRotation 값 그대로 사용
        locker.rotation = newRotation
        console.log(`[ROTATION DIRECTION] Leader locker ${locker.id} rotation: ${locker.rotation}`)
      } else {
        // 다른 락커들은 초기 회전값 + 전체 회전량
        locker.rotation = lockerState.initialRotation + totalRotation
        console.log(`[ROTATION DIRECTION] Follower locker ${locker.id} rotation: ${locker.rotation}`)
      }
      
      // 디바운스된 저장
      saveLockerRotationDebounced(locker.id, locker.rotation)
    })
  } else {
    // 단일 락커 회전
    const locker = currentLockers.value.find(l => l.id === lockerId)
    if (locker) {
      // 회전 중에는 자유롭게 회전
      locker.rotation = newRotation
      console.log(`[ROTATION DIRECTION] Single locker ${locker.id} rotation: ${locker.rotation}`)
      
      // 디바운스된 저장
      saveLockerRotationDebounced(lockerId, locker.rotation)
    }
  }
}

// 회전 종료 - 45도 단위로 스냅
const handleRotateEnd = (lockerId: string) => {
  // Rotation ended
  
  // 45도 단위로 스냅
  const SNAP_ANGLE = 45
  
  // 다중 선택시 모든 락커를 45도 단위로 스냅
  if (selectedLockerIds.value.size > 1) {
    const selectedArray = Array.from(selectedLockerIds.value)
    selectedArray.forEach(id => {
      const locker = currentLockers.value.find(l => l.id === id)
      if (locker) {
        const snappedRotation = Math.round(locker.rotation / SNAP_ANGLE) * SNAP_ANGLE
        locker.rotation = snappedRotation
        console.log(`[ROTATION END] Snapped locker ${id} from ${locker.rotation} to ${snappedRotation}`)
      }
    })
  } else {
    // 단일 락커 스냅
    const locker = currentLockers.value.find(l => l.id === lockerId)
    if (locker) {
      const originalRotation = locker.rotation
      const snappedRotation = Math.round(originalRotation / SNAP_ANGLE) * SNAP_ANGLE
      locker.rotation = snappedRotation
      console.log(`[ROTATION END] Snapped locker ${lockerId} from ${originalRotation} to ${snappedRotation}`)
    }
  }
  
  // Set a flag to indicate rotation just ended
  rotationJustEnded.value = true
  
  // 먼저 회전 중 플래그를 false로 설정하여 DB 저장이 가능하도록 함
  isRotating.value = false
  
  // Clear rotation ended flag after a short delay
  setTimeout(() => {
    rotationJustEnded.value = false
  }, 200)
  
  // 임시 회전 값 정리
  const leaderLocker = currentLockers.value.find(l => l.id === lockerId)
  if (leaderLocker) {
    delete leaderLocker._lastRotation
    delete leaderLocker._lastRawRotation
    delete leaderLocker._rotationDirection  // 방향 플래그도 정리
    // Cleaned up temporary rotation values
  }
  
  // 그룹 회전 상태 정리
  if (groupRotationState.value) {
    // Clearing group rotation state
    groupRotationState.value = null
  }
  
  // IMPORTANT: Don't clear selection after rotation
  // Keep the current selection state
  
  // 다중 선택시 모든 락커 저장
  if (selectedLockerIds.value.size > 1) {
    const selectedArray = Array.from(selectedLockerIds.value)
    const selectedLockers = currentLockers.value.filter(l => selectedArray.includes(l.id))
    selectedLockers.forEach(locker => {
      saveLockerRotation(locker.id, locker.rotation)
    })
  } else {
    // 단일 락커 저장
    const locker = currentLockers.value.find(l => l.id === lockerId)
    if (locker) {
      saveLockerRotation(lockerId, locker.rotation)
    }
  }
}

// 회전값 저장 (디바운스)
const saveLockerRotationDebounced = (() => {
  let timeout: any = null
  return (lockerId: string, rotation: number) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      saveLockerRotation(lockerId, rotation)
    }, 200)
  }
})()

// 회전값 저장
const saveLockerRotation = async (lockerId: string, rotation: number) => {
  try {
    const locker = lockerStore.getLockerById(lockerId)
    if (locker) {
      // 저장 시 -180 ~ 180 범위로 정규화
      let normalizedRotation = rotation % 360
      if (normalizedRotation > 180) {
        normalizedRotation -= 360
      } else if (normalizedRotation < -180) {
        normalizedRotation += 360
      }
      // 회전 중일 때는 로컬만 업데이트, 종료 시에만 DB 업데이트
      const skipDB = isRotating.value
      await lockerStore.updateLocker(lockerId, { rotation: normalizedRotation }, skipDB)
      // Locker rotation saved
    }
  } catch (error) {
    console.error('[Rotation] Failed to save rotation:', error)
  }
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
  // For rotated lockers, we still snap based on visual bounds
  const snappedLeader = snapToAdjacent(
    snappedLeaderX, 
    snappedLeaderY, 
    leaderDims.width, 
    leaderDims.height, 
    leaderInfo.id,
    leaderLocker.rotation || 0  // Pass rotation for proper boundary calculation
  )
  
  // Check if position was snapped (different from grid-snapped position)
  const wasSnapped = (snappedLeader.x !== snappedLeaderX || snappedLeader.y !== snappedLeaderY)
  if (wasSnapped) {
    console.log('[SNAP DEBUG] Position was snapped from', { x: snappedLeaderX, y: snappedLeaderY }, 'to', snappedLeader)
  }
  
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
      
      // Check for collisions with non-selected lockers (considering rotation)
      // Pass wasSnapped flag to use appropriate tolerance
      const collision = checkCollisionForLocker(newX, newY, dims.width, dims.height, locker.id, locker.rotation || 0, wasSnapped)
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
  
  // Update positions - if collision, keep previous position (unless it was snapped)
  if (!hasCollision) {
    // No collision, update all positions immediately
    proposedPositions.forEach(pos => {
      // Round positions to avoid floating point precision issues
      const roundedX = Math.round(pos.x * 100) / 100
      const roundedY = Math.round(pos.y * 100) / 100
      // Skip DB update during drag - only update local store
      lockerStore.updateLocker(pos.id, { x: roundedX, y: roundedY }, true)
      
      // Update selectedLocker if it's being dragged
      if (selectedLocker.value?.id === pos.id) {
        selectedLocker.value = { ...selectedLocker.value, x: roundedX, y: roundedY }
      }
    })
    
    console.log('[Group Drag] Moving', selectedLockerIds.value.size, 'lockers. Leader:', leaderInfo.id, 'Delta:', { 
      x: deltaX.toFixed(1), 
      y: deltaY.toFixed(1) 
    })
  } else if (wasSnapped && hasCollision) {
    // Collision detected on snapped position - this might be a real overlap, not just micro-overlap
    console.log('[SNAP WARNING] Collision detected at snapped position, checking overlap amount...')
    
    // Check if it's a micro-overlap (< 1px) or real overlap
    let maxOverlap = 0
    draggedLockers.value.forEach(dragInfo => {
      const locker = currentLockers.value.find(l => l.id === dragInfo.id)
      if (locker) {
        const dims = getLockerDimensions(locker)
        let newX, newY
        if (dragInfo.isLeader) {
          newX = snappedLeader.x
          newY = snappedLeader.y
        } else {
          newX = snappedLeader.x + dragInfo.relativeX
          newY = snappedLeader.y + dragInfo.relativeY
        }
        
        // Get the actual bounds for overlap check
        const dragBounds = getRotatedBounds({
          x: newX, y: newY, 
          width: dims.width, height: dims.height,
          rotation: locker.rotation || 0
        })
        
        // Check overlap with other lockers
        currentLockers.value.forEach(other => {
          if (other.id !== locker.id && !selectedLockerIds.value.has(other.id)) {
            const otherBounds = getRotatedBounds(other)
            const overlapX = Math.min(dragBounds.x + dragBounds.width, otherBounds.x + otherBounds.width) - 
                           Math.max(dragBounds.x, otherBounds.x)
            const overlapY = Math.min(dragBounds.y + dragBounds.height, otherBounds.y + otherBounds.height) - 
                           Math.max(dragBounds.y, otherBounds.y)
            if (overlapX > 0 && overlapY > 0) {
              maxOverlap = Math.max(maxOverlap, Math.min(overlapX, overlapY))
              console.log('[SNAP OVERLAP] With', other.id, '- X:', overlapX.toFixed(1), 'Y:', overlapY.toFixed(1))
            }
          }
        })
      }
    })
    
    // Only accept if it's a micro-overlap (< 1px)
    if (maxOverlap < 1.0) {
      console.log('[SNAP] Accepting snapped position with micro-overlap:', maxOverlap.toFixed(2), 'px')
      proposedPositions.forEach(pos => {
        // Skip DB update during drag - only update local store
        lockerStore.updateLocker(pos.id, { x: pos.x, y: pos.y }, true)
        if (selectedLocker.value?.id === pos.id) {
          selectedLocker.value = { ...selectedLocker.value, x: pos.x, y: pos.y }
        }
      })
    } else {
      console.warn('[SNAP] Rejecting snapped position due to significant overlap:', maxOverlap.toFixed(1), 'px')
      // Don't update positions - keep previous
    }
  } else {
    // Collision detected and NOT snapped - try to find the closest valid position
    console.log('[COLLISION ADJUSTMENT DEBUG] Collision detected (non-snapped), finding valid position:', {
      snappedLeader,
      proposedPositions: proposedPositions.length,
      hasCollision,
      wasSnapped
    })
    
    // Try to move to the last valid position or slightly adjusted position
    let adjustedX = snappedLeader.x
    let adjustedY = snappedLeader.y
    let foundValidPosition = false
    
    // Try small adjustments in different directions
    const adjustments = [
      { dx: -20, dy: 0 },   // Left
      { dx: 20, dy: 0 },    // Right
      { dx: 0, dy: -20 },   // Up
      { dx: 0, dy: 20 },    // Down
      { dx: -20, dy: -20 }, // Diagonal
      { dx: 20, dy: -20 },
      { dx: -20, dy: 20 },
      { dx: 20, dy: 20 }
    ]
    
    // console.log('[COLLISION ADJUSTMENT DEBUG] Testing adjustments...')
    
    for (const adj of adjustments) {
      const testX = snappedLeader.x + adj.dx
      const testY = snappedLeader.y + adj.dy
      let testHasCollision = false
      
      // console.log('[COLLISION ADJUSTMENT DEBUG] Testing:', { 
      //   adjustment: adj, 
      //   testPos: { x: testX, y: testY } 
      // })
      
      // Test all lockers with this adjustment
      draggedLockers.value.forEach(dragInfo => {
        const locker = currentLockers.value.find(l => l.id === dragInfo.id)
        if (locker && !testHasCollision) {
          const dims = getLockerDimensions(locker)
          let newX, newY
          
          if (dragInfo.isLeader) {
            newX = testX
            newY = testY
          } else {
            newX = testX + dragInfo.relativeX
            newY = testY + dragInfo.relativeY
          }
          
          // Check bounds
          const maxX = canvasWidth.value - dims.width
          const maxY = canvasHeight.value - dims.height
          newX = Math.max(0, Math.min(newX, maxX))
          newY = Math.max(0, Math.min(newY, maxY))
          
          // Check collision
          if (checkCollisionForLocker(newX, newY, dims.width, dims.height, locker.id, locker.rotation || 0, false)) {
            testHasCollision = true
          }
        }
      })
      
      if (!testHasCollision) {
        adjustedX = testX
        adjustedY = testY
        foundValidPosition = true
        break
      }
    }
    
    if (foundValidPosition) {
      // Update to adjusted position
      draggedLockers.value.forEach(dragInfo => {
        const locker = currentLockers.value.find(l => l.id === dragInfo.id)
        if (locker) {
          let newX, newY
          
          if (dragInfo.isLeader) {
            newX = adjustedX
            newY = adjustedY
          } else {
            newX = adjustedX + dragInfo.relativeX
            newY = adjustedY + dragInfo.relativeY
          }
          
          const dims = getLockerDimensions(locker)
          const maxX = canvasWidth.value - dims.width
          const maxY = canvasHeight.value - dims.height
          newX = Math.max(0, Math.min(newX, maxX))
          newY = Math.max(0, Math.min(newY, maxY))
          
          // Skip DB update during drag - only update local store
          lockerStore.updateLocker(locker.id, { x: newX, y: newY }, true)
          if (selectedLocker.value?.id === locker.id) {
            selectedLocker.value = { ...selectedLocker.value, x: newX, y: newY }
          }
        }
      })
      
      console.log('[COLLISION] Adjusted to valid position:', `(${adjustedX}, ${adjustedY})`)
    } else {
      console.warn('[COLLISION] No collision-free adjustment found, keeping original positions')
    }
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
    const positions = draggedLockers.value.map(dragInfo => {
      const locker = currentLockers.value.find(l => l.id === dragInfo.id)
      return {
        id: dragInfo.id,
        x: locker?.x || dragInfo.x,
        y: locker?.y || dragInfo.y
      }
    })
    saveMultipleLockerPositions(positions)
  }
  
  isDragging.value = false
  showSelectionUI.value = true
  dragOffset.value = { x: 0, y: 0 }
  draggedLockers.value = []
  // 가이드라인 숨기기
  showAlignmentGuides.value = false
  
  // 드래그 종료 후 자동 줌 조정 제거 - 사용자가 설정한 줌 상태 유지
  // if (currentViewMode.value === 'floor') {
  //   autoFitLockers()
  // }
  horizontalGuides.value = []
  verticalGuides.value = []
  
  console.log('[Drag] End dragging - Current selection count:', selectedLockerIds.value.size)
}

// 락커 배치 검증 - 문 앞이 막혔는지 확인
const validateLockerPlacement = () => {
  const errors = []
  const problematicLockers = new Set()
  
  // 락커의 문 방향 앞에 다른 락커가 있는지 체크
  // 부모 락커만 검사 (tier 락커는 평면배치모드에서 보이지 않으므로 제외)
  const lockers = currentLockers.value.filter(locker => !locker.parentLockerId)
  
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
          const locker1FacingUp = locker1.rotation % 180 === 270
          const locker2FacingDown = locker2.rotation % 180 === 90
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

// 평면 모드로 전환 중인지 여부
const isTransitioningToFloor = ref(false)

// 뷰 모드 설정
const setViewMode = (mode: 'floor' | 'front') => {
  console.log('[setViewMode] Switching to:', mode)
  
  // 평면 모드로 전환 시 플래그 설정
  if (mode === 'floor' && currentViewMode.value === 'front') {
    isTransitioningToFloor.value = true
    // 애니메이션이 끝난 후 플래그 해제
    setTimeout(() => {
      isTransitioningToFloor.value = false
    }, 400) // 애니메이션 시간
  }
  
  // 모드 변경
  currentViewMode.value = mode
  
  // 정면 모드로 전환 시 모든 락커가 화면에 보이도록 자동 조정
  if (mode === 'front') {
    // 약간의 지연을 두어 뷰 모드가 완전히 변경된 후 autoFit 실행
    setTimeout(() => {
      autoFitLockers()
    }, 50)
  }
  
  // 평면 모드로 전환 시에도 자동 조정 (선택적)
  if (mode === 'floor') {
    setTimeout(() => {
      autoFitLockers()
    }, 50)
  }
  
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
      console.error('[Validation FAILED] Cannot switch to front view:', validation.errors)
      console.error('[Validation FAILED] Problematic lockers:', validation.problematicLockers)
      alert('세로모드 진입 불가: 락커 배치가 규칙에 맞지 않습니다.\n문제: ' + validation.errors.join('\n'))
      
      // 문제가 있는 락커를 빨간색으로 강조
      highlightProblematicLockers(validation.problematicLockers)
      
      // 플로어 뷰로 되돌리기
      currentViewMode.value = 'floor'
      return
    } else {
      console.log('[Validation PASSED] Front view validation successful')
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
    // Front view interactions disabled
    
    // Note: Front view transformation is now handled by the view mode watcher
    // after loading all lockers (including child/tier lockers)
    // Transformation handled by view mode watcher
  } else {
    // 플로어 뷰로 돌아올 때 선택 UI 복원
    showSelectionUI.value = true
    console.log('[Floor View] Interactions enabled, full editing mode')
  }
  
  const newMode = currentViewMode.value === 'floor' ? 'flat' : 'vertical'
  lockerStore.setPlacementMode(newMode)
}

// =================================
// BACKUP: 기존 transformToFrontView 로직 (2025-08-22)
// =================================
const transformToFrontView_BACKUP = () => {
  // Starting front view transformation
  
  const lockers = currentLockers.value
  
  if (lockers.length === 0) {
    // No lockers to transform
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
  
  // Store the sequence for front view positioning
  // Positions will be calculated dynamically in displayLockers
  frontViewSequence.value = unfoldedSequence
  
  console.log('[Front View] Transformation complete:', {
    totalLockers: unfoldedSequence.length,
    sequence: unfoldedSequence.map(l => l.number || l.id).join(' -> ')
  })
}

// =================================
// ==========================================
// CRITICAL GROUPING SYSTEM IMPLEMENTATION
// ⚠️ WARNING: VERIFIED WORKING - DO NOT MODIFY
// Documentation: /docs/grouping-system-final.md  
// Test Validation: L1-L6 → 1 major group, 2 minor groups
// ==========================================

// 새로운 Front View 알고리즘 구현 (2025-08-22)
// =================================

// 회전각을 0-360 범위로 정규화하는 함수
// 270°와 -90°를 같은 값으로 처리
const normalizeRotation = (rotation: number): number => {
  let normalized = rotation % 360
  if (normalized < 0) {
    normalized += 360
  }
  return normalized
}

// 두 락커 사이의 최단거리 계산
// ⚠️ CRITICAL FUNCTION - DISTANCE CALCULATION
// DO NOT MODIFY - Calculates edge-to-edge distance between lockers
// Used by both isAdjacent and isConnected functions
const getMinDistance = (locker1: any, locker2: any): number => {
  const rect1 = {
    left: locker1.x,
    right: locker1.x + locker1.width,
    top: locker1.y,
    bottom: locker1.y + (locker1.depth || locker1.height || 40)
  }
  const rect2 = {
    left: locker2.x,
    right: locker2.x + locker2.width,
    top: locker2.y,
    bottom: locker2.y + (locker2.depth || locker2.height || 40)
  }
  
  // Rectangle calculation (removed debug logging for cleaner output)
  
  // 겹치는 경우 거리는 0
  if (rect1.right >= rect2.left && rect1.left <= rect2.right &&
      rect1.bottom >= rect2.top && rect1.top <= rect2.bottom) {
    return 0
  }
  
  // 수평/수직 거리 계산
  const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right))
  const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom))
  
  return Math.sqrt(dx * dx + dy * dy)
}

// 대그룹 탐지 (10px 이내 연결 - requirement: minimum distance < 10px for group connection)
const findMajorGroups = (lockers: any[]): any[][] => {
  // Use the updated groupNearbyLockers function which implements Adjacent/Connected logic
  // Pass the filtered lockers to use them instead of currentLockers
  return groupNearbyLockers(lockers)
}

// 그룹의 가장 위-왼쪽 락커 찾기
const getTopLeftLocker = (group: any[]): any => {
  return group.reduce((topLeft, locker) => {
    if (locker.y < topLeft.y) return locker
    if (locker.y === topLeft.y && locker.x < topLeft.x) return locker
    return topLeft
  }, group[0])
}

// 대그룹 우선순위 정렬 (위→아래, 왼쪽→오른쪽)
const sortMajorGroups = (majorGroups: any[][]): any[][] => {
  return majorGroups.sort((a, b) => {
    const aTopLeft = getTopLeftLocker(a)
    const bTopLeft = getTopLeftLocker(b)
    
    // 위쪽 우선
    if (Math.abs(aTopLeft.y - bTopLeft.y) > 1) {
      return aTopLeft.y - bTopLeft.y
    }
    // 같은 높이면 왼쪽 우선
    return aTopLeft.x - bTopLeft.x
  })
}

// 두 락커가 인접한지 확인 (한 면이 붙어있는지)
// 인접: 락커간 최소 거리가 1px 미만 (붙어있음)
// 연결: 10px 이내 (대그룹 기준)
const areFullyAdjacent = (locker1: any, locker2: any): boolean => {
  // Use the same getMinDistance function as major groups
  // Adjacent means minimum distance < 1px (touching)
  const minDistance = getMinDistance(locker1, locker2)
  
  console.log(`      [Adjacent Check] ${locker1.number} vs ${locker2.number}: distance = ${minDistance.toFixed(2)}px`)
  
  // Adjacent if distance is less than 1px (touching or very close)
  const isAdjacent = minDistance < 1
  
  if (isAdjacent) {
    console.log(`        ✅ ADJACENT (distance < 1px)`)
  } else {
    console.log(`        ❌ NOT ADJACENT (distance >= 1px)`)
  }
  
  return isAdjacent
}

// 대그룹을 소그룹으로 분류
// 소그룹 조건:
// 1. 같은 문방향 + 인접(붙어있음) = 1개 소그룹
// 2. 다른 문방향 = 각각 다른 소그룹 (인접해도)
// 3. 같은 문방향이지만 인접하지 않음 = 각각 다른 소그룹 (연결만 되어있어도)
// ⚠️ CRITICAL FUNCTION - MINOR GROUP DETECTION  
// CORNER-BASED MINOR GROUP FORMATION
// Creates minor groups using ONLY Adjacent relationships
// Minor Group = Adjacent lockers (2+ corners < 43px + same direction) OR single lockers
const findMinorGroups = (majorGroup: any[]): any[][] => {
  const minorGroups: any[][] = []
  const visited = new Set<string>()
  
  // Processing major group for minor groups
  
  majorGroup.forEach(locker => {
    if (visited.has(locker.id)) return
    
    // Starting new minor group
    const minorGroup: any[] = []
    const queue = [locker]
    
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id)) continue
      
      visited.add(current.id)
      minorGroup.push(current)
      // Added to minor group
      
      // CRITICAL: Minor groups = ONLY adjacent lockers
      // Adjacent = 2+ corner pairs < 43px AND same direction
      majorGroup.forEach(other => {
        if (!visited.has(other.id)) {
          const adjacent = isAdjacent(current, other)
          
          // Only include adjacent lockers in minor group
          if (adjacent) {
            // Adding to same minor group (adjacent)
            queue.push(other)
          }
          // Connected lockers form separate minor groups
        }
      })
    }
    
    if (minorGroup.length > 0) {
      // Minor group complete
      minorGroups.push(minorGroup)
    }
  })
  
  // Minor groups analysis complete
  minorGroups.forEach((group, index) => {
    console.log(`  Minor group ${index + 1}: ${group.map(l => l.number || l.id).join(', ')}`)
  })
  
  return minorGroups
}

// Find the clockwise starting point based on structure type
const findClockwiseStart = (minorGroups: any[][]): any => {
  if (minorGroups.length <= 1) return minorGroups[0] ? minorGroups[0][0] : null
  
  // 1. Calculate connection count for each minor group
  const connectionMap = new Map()
  
  for (const group of minorGroups) {
    let connectionCount = 0
    
    for (const otherGroup of minorGroups) {
      if (group === otherGroup) continue
      
      // Check if two groups are connected
      let connected = false
      for (const locker1 of group) {
        for (const locker2 of otherGroup) {
          if (isConnected(locker1, locker2)) {
            connected = true
            break
          }
        }
        if (connected) break
      }
      
      if (connected) connectionCount++
    }
    
    connectionMap.set(group, connectionCount)
  }
  
  // 2. Find endpoints (groups with only 1 connection)
  const endpoints = minorGroups.filter(g => connectionMap.get(g) === 1)
  
  // 3. Determine start point based on structure
  if (endpoints.length === 0) {
    // Complete loop (ㅁ shape): start from leftmost group (9 o'clock)
    console.log('[Clockwise Start] Complete loop detected, finding leftmost group')
    let leftmostGroup = minorGroups[0]
    for (const group of minorGroups) {
      const center = getGroupCenter(group)
      const leftmostCenter = getGroupCenter(leftmostGroup)
      if (center.x < leftmostCenter.x) {
        leftmostGroup = group
      }
    }
    console.log('[Clockwise Start] Selected leftmost group:', leftmostGroup.map(l => l.number || l.id).join(','))
    return leftmostGroup[0]
  }
  
  if (endpoints.length >= 2) {
    // Broken chain: For ㄱ shape, select top-left endpoint for clockwise traversal
    console.log('[Clockwise Start] Broken chain detected with', endpoints.length, 'endpoints')
    let bestEndpoint = endpoints[0]
    for (const endpoint of endpoints) {
      const center = getGroupCenter(endpoint)
      const bestCenter = getGroupCenter(bestEndpoint)
      
      // For ㄱ shape (L4-L8 horizontal, L9-L11 vertical):
      // Prefer top (smaller y), then left (smaller x) to start from L4
      if (center.y < bestCenter.y) {
        bestEndpoint = endpoint
      } else if (Math.abs(center.y - bestCenter.y) < 10) { // Consider y values equal within 10px
        if (center.x < bestCenter.x) {
          bestEndpoint = endpoint
        }
      }
    }
    console.log('[Clockwise Start] Selected endpoint:', bestEndpoint.map(l => l.number || l.id).join(','))
    return bestEndpoint[0]
  }
  
  // Fallback: return first group's first locker
  console.log('[Clockwise Start] Fallback to first group')
  return minorGroups[0][0]
}

// Get the minor group containing a specific locker
const getMinorGroupContaining = (locker: any, minorGroups: any[][]): any[] | null => {
  for (const group of minorGroups) {
    if (group.some(l => l.id === locker.id)) {
      return group
    }
  }
  return null
}

// Get center position of a minor group
const getGroupCenter = (group: any[]): { x: number, y: number } => {
  const sumX = group.reduce((sum, locker) => sum + locker.x, 0)
  const sumY = group.reduce((sum, locker) => sum + locker.y, 0)
  return {
    x: sumX / group.length,
    y: sumY / group.length
  }
}

// Find next connected minor group in clockwise direction
const findNextConnectedGroup = (currentGroup: any[], visitedGroups: Set<any[]>, minorGroups: any[][]): any[] | null => {
  // Find all connected groups that haven't been visited
  const connectedGroups: { group: any[], angle: number }[] = []
  const currentCenter = getGroupCenter(currentGroup)
  
  for (const group of minorGroups) {
    if (visitedGroups.has(group)) continue
    
    // Check if this group is connected to current group
    let isConnectedToGroup = false
    for (const locker1 of currentGroup) {
      for (const locker2 of group) {
        if (isConnected(locker1, locker2)) {
          isConnectedToGroup = true
          break
        }
      }
      if (isConnectedToGroup) break
    }
    
    if (isConnectedToGroup) {
      // Calculate angle from current group center to connected group center
      const targetCenter = getGroupCenter(group)
      const dx = targetCenter.x - currentCenter.x
      const dy = targetCenter.y - currentCenter.y
      let angle = Math.atan2(dy, dx) * 180 / Math.PI
      
      // Convert to 0-360 range where 0 is right, 90 is down, 180 is left, 270 is up
      if (angle < 0) angle += 360
      
      connectedGroups.push({ group, angle })
    }
  }
  
  if (connectedGroups.length === 0) return null
  
  // Sort by angle to get clockwise order
  connectedGroups.sort((a, b) => a.angle - b.angle)
  
  return connectedGroups[0].group
}

// 소그룹 시계방향 순회 정렬
const sortMinorGroups = (minorGroups: any[][]): any[][] => {
  if (minorGroups.length <= 1) return minorGroups
  
  const sortedGroups: any[][] = []
  const visitedGroups = new Set<any[]>()
  
  // Find starting point (bottom-most locker)
  const startLocker = findClockwiseStart(minorGroups)
  const startGroup = getMinorGroupContaining(startLocker, minorGroups)
  
  if (!startGroup) {
    // Fallback to original sorting if no valid start
    return minorGroups.sort((a, b) => {
      const aTopLeft = getTopLeftLocker(a)
      const bTopLeft = getTopLeftLocker(b)
      
      if (Math.abs(aTopLeft.y - bTopLeft.y) > 1) {
        return aTopLeft.y - bTopLeft.y
      }
      return aTopLeft.x - bTopLeft.x
    })
  }
  
  // Start clockwise traversal
  let currentGroup: any[] | null = startGroup
  while (currentGroup && !visitedGroups.has(currentGroup)) {
    sortedGroups.push(currentGroup)
    visitedGroups.add(currentGroup)
    
    // Find next connected group in clockwise direction
    currentGroup = findNextConnectedGroup(currentGroup, visitedGroups, minorGroups)
  }
  
  // Add any remaining unvisited groups (isolated groups)
  for (const group of minorGroups) {
    if (!visitedGroups.has(group)) {
      sortedGroups.push(group)
    }
  }
  
  return sortedGroups
}

// 소그룹에 회전 처리 적용 및 순서 조정
const applyRotationToMinorGroup = (minorGroup: any[]): any[] => {
  if (minorGroup.length === 0) return []
  
  // 회전각을 정규화하여 0-360 범위로 변환
  const direction = normalizeRotation(minorGroup[0].rotation || 0)
  let sortedLockers = [...minorGroup]
  
  console.log(`[Rotation] Processing minor group with rotation ${direction}°:`, 
    minorGroup.map(l => `${l.number || l.id}`))
  
  switch (direction) {
    case 0:   // 아래 방향 - 변화없음
      sortedLockers.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 1) return a.y - b.y
        return a.x - b.x
      })
      break
      
    case 90:  // 왼쪽 방향 - 90도 회전 시 상하 순서 유지
      sortedLockers.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 1) return a.y - b.y
        return a.x - b.x
      })
      break
      
    case 180: // 위 방향 - 180도 회전 시 좌우 반전
      sortedLockers.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 1) return a.y - b.y
        return b.x - a.x // 좌우 반전
      })
      break
      
    case 270: // 오른쪽 방향 - 270도 회전 시 상하 반전
      sortedLockers.sort((a, b) => {
        if (Math.abs(a.x - b.x) > 1) return a.x - b.x
        return b.y - a.y // 상하 반전 (L12→L11→L10)
      })
      break
  }
  
  console.log(`[Rotation] After rotation, order:`, 
    sortedLockers.map(l => l.number || l.id))
  
  return sortedLockers
}

// 세로모드 전용: 타입 및 소그룹 기반 그룹 정보 판단
const getActualGroupForFrontView = (prevLocker: any, currentLocker: any, minorGroups: any[], lockerToMajorGroup?: Map<string, number>): any => {
  // 1) 먼저 소그룹 멤버십 확인 (타입보다 우선)
  let prevMinorGroup = null
  let currentMinorGroup = null
  
  minorGroups.forEach((group, index) => {
    if (group.some((l: any) => l.id === prevLocker.id)) {
      prevMinorGroup = index
    }
    if (group.some((l: any) => l.id === currentLocker.id)) {
      currentMinorGroup = index
    }
  })
  
  const sameMinorGroup = prevMinorGroup !== null && currentMinorGroup !== null && prevMinorGroup === currentMinorGroup
  
  // 2) 대그룹 멤버십 확인
  let sameMajorGroup = false
  if (lockerToMajorGroup) {
    const prevMajorGroup = lockerToMajorGroup.get(prevLocker.id)
    const currentMajorGroup = lockerToMajorGroup.get(currentLocker.id)
    sameMajorGroup = prevMajorGroup !== undefined && currentMajorGroup !== undefined && prevMajorGroup === currentMajorGroup
  }
  
  // 3) 타입 정보 가져오기
  const getType = (locker: any): string => {
    // 타입ID 기반 판단
    if (locker.typeId === 'custom-1755675491548') return 'normal'  // 일반 락커
    if (locker.typeId === 'custom-1755675506519') return 'tall'    // 장락커
    
    // 색상 기반 판단
    if (locker.color === '#4A90E2') return 'blue'
    if (locker.color === '#BD10E0') return 'purple'
    
    // 높이 기반 판단
    if (!locker.typeId && locker.actualHeight) {
      if (locker.actualHeight === 30) return 'normal'
      if (locker.actualHeight === 90) return 'tall'
    }
    
    return locker.typeId || 'default'
  }
  
  const prevType = getType(prevLocker)
  const currentType = getType(currentLocker)
  const sameType = prevType === currentType
  
  // 4) 같은 소그룹이면 타입과 관계없이 같은 그룹으로 처리
  if (sameMinorGroup) {
    return { 
      same: true, 
      sameType,
      sameMinorGroup: true,
      sameMajorGroup,
      prevMinorGroup,
      currentMinorGroup,
      prevType,
      currentType
    }
  }
  
  // 5) 다른 소그룹인 경우
  return { 
    same: false, 
    sameType,
    sameMinorGroup: false,
    sameMajorGroup,
    prevMinorGroup,
    currentMinorGroup,
    prevType,
    currentType
  }
}

// 세로모드 전용: 세분화된 간격 계산
const getGroupSpacingForFrontView = (prevLocker: any, currentLocker: any, minorGroups: any[], lockerToMajorGroup?: Map<string, number>): number => {
  const groupInfo = getActualGroupForFrontView(prevLocker, currentLocker, minorGroups, lockerToMajorGroup)
  
  // Checking group spacing
  console.log(`  Group spacing between ${prevLocker.number} and ${currentLocker.number}:`, groupInfo)
  
  if (groupInfo.sameMinorGroup) {
    // 같은 소그룹: 완전히 붙음 (타입과 관계없이)
    console.log('  → Same minor group: 0px gap')
    return 0
  } else if (groupInfo.sameMajorGroup) {
    // 같은 대그룹, 다른 소그룹: 10px 간격 (타입과 관계없이)
    console.log('  → Same major group, different minor group: 10px gap')
    return 10
  } else {
    // 다른 대그룹: 20px 간격
    console.log('  → Different major group: 20px gap')
    return 20
  }
}

// 새로운 Front View 변환 함수
const transformToFrontViewNew = () => {
  // === Front view transformation start ===
  // Starting NEW transformation algorithm
  // === Front view transformation start ===
  console.trace('Called from:')
  
  // Filter out child lockers - only parent lockers should participate in grouping
  const lockers = currentLockers.value.filter(locker => {
    // A locker is a parent if it has no parent references AND tierLevel is 0 or undefined
    const isParent = !locker.parentLockrCd && 
                     (!locker.tierLevel || locker.tierLevel === 0)
    return isParent
  })
  console.log(`[Transform] Processing ${lockers.length} parent lockers (${currentLockers.value.length - lockers.length} child lockers excluded from grouping)`)
  
  if (lockers.length === 0) {
    // No parent lockers to transform
    return
  }
  
  // 1. 대그룹 탐지
  const majorGroups = findMajorGroups(lockers)
  // Found major groups for transformation
  
  // 2. 대그룹 우선순위 정렬
  const sortedMajorGroups = sortMajorGroups(majorGroups)
  
  // 3. 최종 시퀀스 생성
  const finalSequence: any[] = []
  const LOCKER_VISUAL_SCALE = 2.0
  
  let currentX = 0
  const renderData: any[] = []
  
  // 모든 락커를 하나의 플랫 리스트로 만들어서 처리
  const allLockersSequence: any[] = []
  // 모든 소그룹을 저장할 배열
  const allMinorGroups: any[] = []
  // 각 락커가 속한 대그룹 인덱스를 저장하는 Map
  const lockerToMajorGroup = new Map<string, number>()
  
  sortedMajorGroups.forEach((majorGroup, majorIndex) => {
    console.log(`[Front View] Processing major group ${majorIndex + 1}:`, 
      majorGroup.map(l => `${l.number || l.id}(rot:${l.rotation || 0})`))
    
    // 이 대그룹의 모든 락커에 대그룹 인덱스 할당
    majorGroup.forEach(locker => {
      lockerToMajorGroup.set(locker.id, majorIndex)
    })
    
    // 4. 소그룹 분류 및 정렬
    const minorGroups = findMinorGroups(majorGroup)
    const sortedMinorGroups = sortMinorGroups(minorGroups)
    
    // 모든 소그룹을 전체 배열에 추가
    allMinorGroups.push(...sortedMinorGroups)
    
    console.log(`  Found ${sortedMinorGroups.length} minor groups:`)
    sortedMinorGroups.forEach((minorGroup, minorIdx) => {
      console.log(`    Minor Group ${minorIdx + 1}:`, minorGroup.map(l => `${l.number}(rot:${l.rotation || 0})`))
    })
    
    sortedMinorGroups.forEach((minorGroup, minorIndex) => {
      console.log(`  Processing minor group ${minorIndex + 1}:`, 
        minorGroup.map(l => `${l.number || l.id}(rot:${l.rotation || 0})`))
      
      // 5. 회전 처리 및 순서 조정
      const rotatedLockers = applyRotationToMinorGroup(minorGroup)
      
      // 모든 락커를 시퀀스에 추가
      rotatedLockers.forEach((locker) => {
        allLockersSequence.push(locker)
      })
    })
  })
  
  // 6. 최종 시퀀스 처리 - 동적 간격 적용
  let prevLocker: any = null
  
  allLockersSequence.forEach((locker, index) => {
    finalSequence.push(locker)
    
    // 이전 락커와의 간격 계산 - allMinorGroups와 lockerToMajorGroup을 전달
    if (prevLocker && index > 0) {
      // 자식 락커가 포함된 경우 spacing은 0
      let spacing = 0
      if (!prevLocker.parentLockrCd && !locker.parentLockrCd) {
        // 둘 다 부모 락커인 경우에만 그룹 스페이싱 적용
        spacing = getGroupSpacingForFrontView(prevLocker, locker, allMinorGroups, lockerToMajorGroup)
      }
      currentX += spacing
      
      if (spacing > 0) {
        // Adding dynamic gap
      }
    }
    
    const width = (locker.width || 40) * LOCKER_VISUAL_SCALE
    // 세로모드에서는 height 사용! (평면모드는 depth)
    const height = (locker.actualHeight || locker.height || 60) * LOCKER_VISUAL_SCALE
    
    // Positioning locker
    
    renderData.push({
      ...locker,
      frontViewX: currentX,
      frontViewY: FLOOR_Y - height, // 바닥선 정렬
      frontViewRotation: 0, // 모든 락커 아래 방향
    })
    
    // CRITICAL: 자식 락커 위치 계산 수정 - 배치 업데이트를 위해 저장만 함
    if (locker.parentLockrCd) {
      // 자식 락커는 부모 락커 위치 기반으로 계산
      const parentLocker = renderData.find(r => r.lockrCd === locker.parentLockrCd)
      if (parentLocker) {
        // 부모 락커의 타입에서 높이 정보 가져오기
        let TIER_HEIGHT = 30  // 기본값
        if (parentLocker.lockrTypeCd || parentLocker.typeId || parentLocker.type) {
          const typeId = parentLocker.lockrTypeCd || parentLocker.typeId || parentLocker.type
          const lockerType = lockerTypes.value.find(t => 
            t.id === typeId || t.type === typeId || t.LOCKR_TYPE_CD === typeId
          )
          if (lockerType && lockerType.height) {
            TIER_HEIGHT = lockerType.height
            console.log(`[TIER HEIGHT] Using type height: ${TIER_HEIGHT} for parent type: ${typeId}`)
          }
        }
        
        const TIER_GAP = 0  // 부모 락커와 바로 붙임
        const scaledTierHeight = TIER_HEIGHT * LOCKER_VISUAL_SCALE
        const scaledGap = TIER_GAP * LOCKER_VISUAL_SCALE
        const tierLevel = locker.tierLevel || 1
        
        // 자식 락커는 부모와 같은 X, 위쪽 Y 좌표 (gap 없이)
        const childX = parentLocker.frontViewX  // 부모와 동일한 X
        const childY = parentLocker.frontViewY - scaledTierHeight * tierLevel  // 위쪽으로 (gap 없이)
        
        // Positioning child locker
        
        // renderData에 위치 저장 (나중에 배치 업데이트)
        renderData[renderData.length - 1].frontViewX = childX
        renderData[renderData.length - 1].frontViewY = childY
        renderData[renderData.length - 1].frontViewRotation = 0
        
        // 자식 락커는 currentX를 증가시키지 않음 (부모 위에 스택)
      } else {
        console.error(`[CHILD POSITION] Parent not found for ${locker.number}, parentLockrCd: ${locker.parentLockrCd}`)
        
        // 부모를 찾지 못한 경우 기본 위치 사용 (나중에 배치 업데이트)
        renderData[renderData.length - 1].frontViewX = currentX
        renderData[renderData.length - 1].frontViewY = FLOOR_Y - height
        renderData[renderData.length - 1].frontViewRotation = 0
        currentX += width
      }
    } else {
      // 부모 락커도 renderData에 위치 저장 (나중에 배치 업데이트)
      renderData[renderData.length - 1].frontViewX = currentX
      renderData[renderData.length - 1].frontViewY = FLOOR_Y - height
      renderData[renderData.length - 1].frontViewRotation = 0
      
      currentX += width // 락커 너비만큼 이동
    }
    
    prevLocker = locker // 다음 반복을 위해 현재 락커 저장
  })
  
  // 7. 전체 중앙 정렬 - 자식 락커도 함께 이동
  const totalWidth = currentX
  const centerOffset = (canvasWidth.value - totalWidth) / 2
  
  // Center alignment calculation
  
  // 모든 renderData 아이템에 중앙 정렬 적용
  renderData.forEach((item) => {
    item.frontViewX += centerOffset
  })
  
  // 8. 화면 위쪽 경계를 넘어가는 락커 감지 및 삭제
  const lockersToDelete = []
  const canvasTopY = 0  // 캔버스 상단 Y 좌표
  
  // renderData를 기준으로 경계 체크 (계산된 좌표를 사용)
  renderData.forEach(renderItem => {
    const height = (renderItem.actualHeight || renderItem.height || 0) * 2.0  // LOCKER_VISUAL_SCALE 적용
    const lockerTopEdge = renderItem.frontViewY  // renderData에서 계산된 Y 좌표
    
    // 락커의 상단이 0보다 작으면 (화면 위로 넘어가면)
    if (lockerTopEdge < canvasTopY) {
      console.warn(`[Boundary Check] 락커 ${renderItem.number}이(가) 화면 위쪽 경계를 넘어갑니다:`, {
        lockerId: renderItem.id,
        number: renderItem.number,
        topEdge: lockerTopEdge,
        height: height,
        canvasTop: canvasTopY,
        isOverflowing: lockerTopEdge < canvasTopY
      })
      // currentLockers에서 해당 락커 찾기
      const locker = currentLockers.value.find(l => l.id === renderItem.id)
      if (locker) {
        lockersToDelete.push(locker)
      }
    }
  })
  
  // 화면을 넘어가는 락커들 삭제
  if (lockersToDelete.length > 0) {
    console.log(`[Boundary Check] 화면을 넘어가는 ${lockersToDelete.length}개의 락커를 삭제합니다:`,
      lockersToDelete.map(l => `${l.number}(${l.id})`))
    
    // 먼저 로컬 스토어에서 즉시 삭제 (화면에서 즉시 제거)
    lockersToDelete.forEach(locker => {
      const index = currentLockers.value.findIndex(l => l.id === locker.id)
      if (index !== -1) {
        currentLockers.value.splice(index, 1)
      }
    })
    
    // 백엔드에서 비동기로 삭제
    const deletePromises = lockersToDelete.map(async (locker) => {
      try {
        // 백엔드 API 호출
        const response = await fetch(`${API_BASE_URL}/lockrs/${locker.lockrCd}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          console.log(`[Boundary Check] 백엔드에서 락커 ${locker.number}(${locker.lockrCd}) 삭제 완료`)
        } else {
          console.error(`[Boundary Check] 백엔드에서 락커 ${locker.number} 삭제 실패:`, await response.text())
          // 삭제 실패 시 다시 추가할 수도 있지만, 화면 경계를 넘는 락커이므로 그대로 둠
        }
      } catch (error) {
        console.error(`[Boundary Check] 백엔드에서 락커 ${locker.number} 삭제 중 오류:`, error)
      }
    })
    
    // 모든 삭제 작업이 완료되면 락커 목록 다시 로드하고 위치 재계산
    Promise.all(deletePromises).then(() => {
      console.log('[Boundary Check] 모든 경계 초과 락커 삭제 완료, 락커 목록 다시 로드 및 위치 재계산')
      loadLockers().then(() => {
        // 락커 로드 완료 후 위치 재계산
        nextTick(() => {
          transformToFrontViewNew()
        })
      })
    })
  }
  
  // 8.5. 배치 업데이트 - 모든 락커를 한번에 업데이트하여 동시에 렌더링되도록 함
  console.log('[Batch Update] Starting batch update for all lockers...')
  
  // 배치 업데이트를 위한 준비
  const batchUpdates = []
  
  renderData.forEach((item) => {
    batchUpdates.push({
      id: item.id,
      updates: {
        frontViewX: item.frontViewX,
        frontViewY: item.frontViewY,
        frontViewRotation: item.frontViewRotation || 0
      }
    })
  })
  
  // 8.5.1 자식 락커는 처리하지 않음 - 이미 DB에 정확한 FRONT_VIEW 좌표를 가지고 있음
  // 번호부여가 정상 작동하는 이유: 자식 락커 위치를 전혀 건드리지 않기 때문
  console.log('[Transform] Child lockers excluded - preserving their existing FRONT_VIEW coordinates from DB')
  
  // 배치 업데이트 함수를 사용하여 모든 락커를 한 번에 업데이트
  // 이렇게 하면 Vue의 반응성 시스템이 한 번만 트리거되어
  // 모든 자식 락커가 동시에 fade-in 애니메이션을 시작합니다
  lockerStore.batchUpdateLockers(batchUpdates)
  console.log(`[Batch Update] Updated ${batchUpdates.length} lockers simultaneously`)
  
  // 8.6. DB에 front view 좌표 저장 (비동기로 처리)
  console.log('[DB Save] Saving front view coordinates to database...')
  const savePromises = batchUpdates.map(async (update) => {
    try {
      // lockerStore.updateLocker를 사용하여 DB에 저장
      // 이미 로컬 스토어는 업데이트했으므로 중복을 피하기 위해 직접 API 호출
      const locker = currentLockers.value.find(l => l.id === update.id)
      if (locker && locker.lockrCd) {
        // DB 컬럼명은 대문자 snake_case 사용 (FRONT_VIEW_X, FRONT_VIEW_Y)
        // FRONT_VIEW_ROTATION 컬럼은 DB에 없으므로 제외
        const dbUpdates: any = {}
        if (update.updates.frontViewX !== undefined) {
          dbUpdates.FRONT_VIEW_X = update.updates.frontViewX
        }
        if (update.updates.frontViewY !== undefined) {
          dbUpdates.FRONT_VIEW_Y = update.updates.frontViewY
        }
        // FRONT_VIEW_ROTATION은 DB에 컬럼이 없으므로 전송하지 않음
        
        const response = await fetch(`${API_BASE_URL}/lockrs/${locker.lockrCd}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbUpdates)
        })
        
        if (!response.ok) {
          console.error(`[DB Save] Failed to save locker ${locker.number}:`, await response.text())
        } else {
          console.log(`[DB Save] Saved locker ${locker.number} with FRONT_VIEW_X=${dbUpdates.FRONT_VIEW_X}, FRONT_VIEW_Y=${dbUpdates.FRONT_VIEW_Y}`)
        }
      }
    } catch (error) {
      console.error(`[DB Save] Failed to save locker ${update.id}:`, error)
    }
  })
  
  // 모든 저장 작업을 비동기로 처리 (UI 블로킹 방지)
  Promise.all(savePromises).then(() => {
    console.log('[DB Save] All front view coordinates saved to database')
  }).catch((error) => {
    console.error('[DB Save] Error saving some lockers:', error)
  })
  
  // 9. 시퀀스 저장
  frontViewSequence.value = finalSequence
  
  console.log('[Front View] NEW Transformation complete:', {
    totalLockers: finalSequence.length,
    majorGroups: sortedMajorGroups.length,
    sequence: finalSequence.map(l => l.number || l.id).join(' → '),
    deletedLockers: lockersToDelete.length
  })
}

// 프론트 뷰에서 락커 위치 지정 - 중앙 정렬 및 간격 없음
const positionLockersInFrontView = (lockerSequence) => {
  // Apply the same visual scale as getLockerDimensions
  const LOCKER_VISUAL_SCALE = 2.0
  
  // 전체 락커 너비 계산 (스케일 적용, 간격 없이)
  const totalLockersWidth = lockerSequence.reduce((total, locker) => {
    return total + (locker.width || 40) * LOCKER_VISUAL_SCALE;
  }, 0);
  
  // 캔버스 너비 사용 (ref 변수이므로 .value 사용)
  const availableWidth = canvasWidth.value;
  
  // 중앙 정렬을 위한 시작 X 계산
  const startX = (availableWidth - totalLockersWidth) / 2;
  
  let currentX = startX;
  
  lockerSequence.forEach((locker, index) => {
    // In front view, all lockers face forward (no rotation)
    // Apply same scale as getLockerDimensions for consistency
    const scaledHeight = (locker.actualHeight || locker.height || 60) * LOCKER_VISUAL_SCALE
    const scaledWidth = (locker.width || 40) * LOCKER_VISUAL_SCALE
    
    // CRITICAL: Check height for L3 and L4
    if (locker.number === 'L3' || locker.number === 'L4') {
      console.log(`[CRITICAL] ${locker.number} HEIGHT CHECK:`, {
        actualHeight: locker.actualHeight,
        shouldBe90: locker.actualHeight === 90,
        typeId: locker.typeId,
        scaledHeight: scaledHeight
      })
    }
    
    // Update via store to maintain reactivity and preserve actualHeight
    // Y position should place the bottom of locker on the floor line (scaled coordinates)
    lockerStore.updateLocker(locker.id, {
      frontViewX: currentX,  // Scaled X coordinate
      frontViewY: FLOOR_Y - scaledHeight,  // Floor line minus scaled height
      frontViewRotation: 0  // All lockers face forward
    })
    
    currentX += scaledWidth // Move by scaled width
    
    console.log(`[TransformToFront] ${locker.number}:`, {
      actualHeight: locker.actualHeight,
      scaledHeight: scaledHeight,
      yPosition: FLOOR_Y - scaledHeight,
      floorY: FLOOR_Y,
      calculatedY: `${FLOOR_Y} - ${scaledHeight} = ${FLOOR_Y - scaledHeight}`
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
  
  currentViewMode.value = currentViewMode.value === 'floor' ? 'front' : 'floor'
  
  
  updateViewMode()
}

// 선택된 락커 삭제
// 다중 선택된 락커 삭제
const deleteSelectedLockers = () => {
  // 세로배치 모드에서만 제약 조건 적용
  if (currentViewMode.value !== 'front') {
    // 평면배치 모드에서는 기존 로직 사용
    deleteSelectedLockersOriginal()
    return
  }
  
  const lockersToDelete = selectedLockerIds.value.size > 0 
    ? Array.from(selectedLockerIds.value)
    : selectedLocker.value ? [selectedLocker.value.id] : []
  
  if (lockersToDelete.length === 0) return
  
  // 선택된 락커들 정보 수집
  const selectedLockers = lockersToDelete.map(id => 
    currentLockers.value.find(l => l.id === id)
  ).filter(Boolean)
  
  // 1. 부모 락커 포함 여부 체크 (삭제 불가)
  const hasParentLocker = selectedLockers.some(locker => 
    !locker.parentLockrCd || locker.tierLevel === 0
  )
  
  if (hasParentLocker) {
    alert('부모 락커는 삭제할 수 없습니다. 자식 락커(상단 락커)만 삭제 가능합니다.')
    return
  }
  
  // 2. 부모별로 그룹화하여 tierLevel 연속성 확인
  const lockersByParent = new Map()

  selectedLockers.forEach(locker => {
    const parentKey = locker.parentLockrCd || 'no-parent'
    if (!lockersByParent.has(parentKey)) {
      lockersByParent.set(parentKey, [])
    }
    lockersByParent.get(parentKey).push(locker)
  })

  console.log('[DELETE] Lockers grouped by parent:', Array.from(lockersByParent.entries()).map(([parent, lockers]) => ({
    parent,
    lockers: lockers.map(l => ({ id: l.id, number: l.number, tierLevel: l.tierLevel }))
  })))

  // 3. 각 부모 그룹별로 tier 연속성 검증
  for (const [parentKey, parentLockers] of lockersByParent.entries()) {
    const tierLevels = parentLockers
      .map(locker => locker.tierLevel || 0)
      .filter((level, index, arr) => arr.indexOf(level) === index) // 중복 제거
      .sort((a, b) => b - a) // 내림차순 정렬
    
    console.log(`[DELETE] Parent ${parentKey} tier levels:`, tierLevels)
    
    // 최고 tier부터 연속적인지 확인
    const maxTier = Math.max(...tierLevels)
    const isSequential = tierLevels.every((tier, index) => {
      const expected = maxTier - index
      const isValid = tier === expected
      console.log(`[DELETE] Parent ${parentKey} tier validation:`, { tier, index, expected, isValid })
      return isValid
    })
    
    if (!isSequential) {
      alert(`삭제는 각 부모 그룹별로 가장 높은 tier부터 순서대로만 가능합니다. (부모: ${parentKey})`)
      return
    }
  }

  // 4. 각 부모 그룹별로 최상단 락커 위에 더 높은 tier가 있는지 확인
  const blockedGroups = []

  for (const [parentKey, parentLockers] of lockersByParent.entries()) {
    // 이 그룹에서 선택된 락커들 중 최고 tier 찾기
    const selectedMaxTier = Math.max(...parentLockers.map(l => l.tierLevel || 0))
    
    console.log(`[DELETE] Parent ${parentKey} selected max tier:`, selectedMaxTier)
    
    // 같은 부모의 모든 락커 중에서 선택된 최고 tier보다 높은 것이 있는지 확인
    const hasUpperTiers = currentLockers.value.some(l => 
      l.parentLockrCd === parentKey && 
      !parentLockers.find(selected => selected.id === l.id) && // 선택되지 않은 락커 중에서
      (l.tierLevel || 0) > selectedMaxTier
    )
    
    console.log(`[DELETE] Parent ${parentKey} has upper tiers:`, hasUpperTiers)
    
    if (hasUpperTiers) {
      blockedGroups.push({
        parentKey,
        selectedMaxTier,
        reason: '선택된 최상단 락커 위에 더 높은 tier 존재'
      })
    }
  }

  if (blockedGroups.length > 0) {
    console.log('[DELETE] Blocked groups:', blockedGroups)
    alert('선택된 락커들 중 일부 그룹에서 최상단 락커 위에 더 높은 tier가 있습니다. 가장 높은 tier부터 삭제해주세요.')
    return
  }
  
  // 삭제 실행 (기존 로직 유지)
  deleteSelectedLockersOriginal()
  selectedLocker.value = null
  console.log('[Delete] Deleted lockers:', lockersToDelete)
}

// ID 추출 헬퍼 함수
const extractDbId = (appId) => {
  const match = appId.match(/locker-(\d+)/)
  return match ? parseInt(match[1]) : null
}

// 기존 삭제 로직 (평면배치 모드용)
const deleteSelectedLockersOriginal = async () => {
  const lockersToDelete = selectedLockerIds.value.size > 0 
    ? Array.from(selectedLockerIds.value)
    : selectedLocker.value ? [selectedLocker.value.id] : []
  
  if (lockersToDelete.length === 0) return
  
  const parentLockersWithChildren = []
  
  // 평면배치 모드에서는 자식 락커가 로드되지 않으므로 DB에서 직접 확인
  for (const lockerId of lockersToDelete) {
    const locker = currentLockers.value.find(l => l.id === lockerId)
    
    if (locker && (locker.tierLevel === 0 || !locker.parentLockerId)) {
      // This is a parent locker - check DB for children
      const parentLockrCd = extractDbId(lockerId)
      
      if (parentLockrCd) {
        try {
          // API를 통해 자식 락커 존재 여부 확인
          const response = await fetch(`${API_BASE_URL}/lockrs/${parentLockrCd}/children`)
          if (response.ok) {
            const data = await response.json()
            const children = data.children || data
            
            if (children && children.length > 0) {
              parentLockersWithChildren.push(locker)
              
            }
          }
        } catch (error) {
          console.error('[DEBUG] Error checking children:', error)
        }
      }
    }
  }
  
  // If parent lockers have children, show blocking message
  if (parentLockersWithChildren.length > 0) {
    alert('상단 락커가 존재합니다. 정면 배치모드에서 상단 락커를 먼저 삭제해주세요.')
    return
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

// Check for gaps in numbering
const findNumberGaps = () => {
  // Get ALL lockers in the selected zone that are visible in front view (세로모드)
  const frontViewLockers = selectedZone.value 
    ? lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
    : currentLockers.value
    
  const numbers = frontViewLockers
    .map(l => parseInt(String(l.lockrNo || 0)))
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
  // Show in both floor and front view modes
  // Only show if lockers are selected
  if (selectedLockerIds.value.size === 0 && !selectedLocker.value) return
  
  event.preventDefault()
  contextMenuVisible.value = true
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
}

// Hide context menu
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// Delete selected lockers from context menu
const deleteSelectedLockersFromMenu = () => {
  deleteSelectedLockers()
  hideContextMenu()
}

// Show floor input dialog
const showFloorInputDialog = () => {
  hideContextMenu()
  floorInputVisible.value = true
  floorCount.value = 1
}

// Add floors (단수 입력)
const addFloors = async () => {
  const count = Number(floorCount.value)
  if (isNaN(count) || count < 1 || count > 9) {
    alert('단수는 1부터 9까지 숫자만 입력 가능합니다.')
    return
  }
  
  if (currentViewMode.value !== 'front') {
    alert('단수 추가는 정면배치모드(Front View)에서만 가능합니다.')
    return
  }
  
  // Load latest data from database before processing to ensure we have current children
  console.log('[AddFloors] Loading latest locker data from database...')
  await loadLockers()
  console.log('[AddFloors] Latest data loaded, processing tier addition...')
  
  const selectedLockers = Array.from(selectedLockerIds.value).map(id =>
    currentLockers.value.find(l => l.id === id)
  ).filter(Boolean)
  
  // Process each selected locker
  const addTierPromises = selectedLockers.map(async (targetLocker) => {
    // 알고리즘 개선: 선택된 락커가 자식인지 부모인지 확인
    let parentLocker = targetLocker
    let actualParentLocker = null
    
    // Case 1: 선택된 락커가 자식 락커인 경우
    if (targetLocker.parentLockerId || targetLocker.parentLockrCd) {
      // 부모 락커 찾기
      actualParentLocker = currentLockers.value.find(l => 
        l.id === targetLocker.parentLockerId || 
        l.lockrCd === targetLocker.parentLockrCd
      )
      
      if (!actualParentLocker) {
        console.error(`[AddFloors] Parent not found for child locker ${targetLocker.number}`)
        return
      }
      
      parentLocker = actualParentLocker
      console.log(`[AddFloors] Selected locker is CHILD (${targetLocker.number}), using parent (${parentLocker.number})`)
    } else {
      // Case 2: 선택된 락커가 부모 락커인 경우
      console.log(`[AddFloors] Selected locker is PARENT (${parentLocker.number})`)
    }
    
    // 부모 락커의 모든 자식들 중 최대 tier 레벨 찾기
    console.log(`[AddFloors] Finding existing children for parent:`, {
      parentId: parentLocker.id,
      parentLockrCd: parentLocker.lockrCd,
      parentNumber: parentLocker.number
    })
    
    const existingChildren = currentLockers.value.filter(l => {
      // Check both parentLockrCd (database ID) and parentLockerId (frontend ID)
      const isChild = (l.parentLockrCd && l.parentLockrCd === parentLocker.lockrCd) || 
                      (l.parentLockerId && l.parentLockerId === parentLocker.id)
      if (isChild) {
        console.log(`[AddFloors] Found existing child:`, {
          childId: l.id,
          childNumber: l.number,
          parentLockrCd: l.parentLockrCd,
          parentLockerId: l.parentLockerId,
          tierLevel: l.tierLevel || 0
        })
      }
      return isChild
    })
    
    // 모든 자식들 중 최대 tier 레벨 계산
    const maxExistingTier = existingChildren.reduce((max, child) => 
      Math.max(max, child.tierLevel || 0), 0
    )
    
    // 다음 tier 레벨부터 시작 (자식이 있으면 최대 tier + 1, 없으면 1부터)
    const startTierLevel = maxExistingTier > 0 ? maxExistingTier + 1 : 1
    
    console.log(`[AddFloors] Tier level calculation:`, {
      existingChildrenCount: existingChildren.length,
      maxExistingTier: maxExistingTier,
      startTierLevel: startTierLevel,
      algorithm: maxExistingTier > 0 ? 
        `Children exist -> Start from tier ${startTierLevel}` : 
        `No children -> Start from tier 1`
    })
    
    console.log(`[AddFloors] Adding ${count} tiers to parent locker:`, {
      number: parentLocker.number,
      parentLockrCd: parentLocker.lockrCd,
      existingChildren: existingChildren.length,
      existingChildrenDetails: existingChildren.map(c => ({
        number: c.number,
        tierLevel: c.tierLevel
      })),
      maxExistingTier: maxExistingTier,
      startTierLevel: startTierLevel,
      frontViewX: parentLocker.frontViewX,
      frontViewY: parentLocker.frontViewY
    })
    
    // Use the backend API to add tiers
    try {
      const requestData = { 
        tierCount: count,
        startTierLevel: startTierLevel,  // 시작 tier 레벨 전달
        parentFrontViewX: parentLocker.frontViewX,
        parentFrontViewY: parentLocker.frontViewY 
      }
      
      console.log(`[AddFloors] Sending to backend:`, requestData)
      
      const response = await fetch(`${API_BASE_URL}/lockrs/${parentLocker.lockrCd}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      if (result.success) {
        console.log(`[AddFloors] Successfully added ${result.count} tiers starting from level ${startTierLevel}`)
      } else {
        console.error('[AddFloors] Failed to add tiers:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('[AddFloors] Error adding tiers:', error)
      throw error
    }
  })
  
  // Wait for all tier additions to complete
  try {
    await Promise.all(addTierPromises)
    console.log('[AddFloors] All tiers added successfully')
  } catch (error) {
    console.error('[AddFloors] Some tiers failed to add:', error)
    alert('티어 추가 중 오류가 발생했습니다: ' + error.message)
    return
  }
  
  floorInputVisible.value = false
  console.log(`[Context Menu] Added ${count} tiers to ${selectedLockers.length} lockers`)
  
  // Reload all lockers to include newly created tiers, then apply front view transformation
  loadLockers().then(() => {
    nextTick(() => {
      console.log('[AddFloors] Applying front view transformation for new tiers...')
      try {
        transformToFrontViewNew()
        console.log('[AddFloors] Front view transformation completed for new tiers')
      } catch (error) {
        console.error('[AddFloors] Front view transformation failed:', error)
        transformToFrontView_BACKUP()
      }
    })
  })
  updateViewMode()
}

// Validate floor count input - only allow numbers 1-9
const validateFloorCount = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Remove non-numeric characters
  const numericValue = value.replace(/[^0-9]/g, '')
  
  // Limit to max 9
  if (numericValue !== '') {
    const num = parseInt(numericValue)
    if (num > 9) {
      target.value = '9'
      floorCount.value = 9
    } else if (num < 1) {
      target.value = '1'
      floorCount.value = 1
    } else {
      target.value = numericValue
      floorCount.value = num
    }
  } else {
    target.value = ''
    floorCount.value = 1
  }
}

// Show number assignment dialog
const showNumberAssignDialog = () => {
  hideContextMenu()
  
  // 자동으로 첫 번째 빈 번호 찾기
  const allLockersInZone = selectedZone.value 
    ? lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
    : currentLockers.value
  
  // 이미 부여된 번호들 수집
  const existingNumbers = new Set(
    allLockersInZone
      .map(l => l.lockrNo)
      .filter(n => n && n > 0)
  )
  
  // 첫 번째 빈 번호 찾기
  let firstEmpty = 1
  while (existingNumbers.has(firstEmpty)) {
    firstEmpty++
  }
  
  console.log(`[Number Dialog] 기존 번호:`, Array.from(existingNumbers).sort((a, b) => a - b))
  console.log(`[Number Dialog] 첫 번째 빈 번호: ${firstEmpty}`)
  
  // 다이얼로그 초기값 설정
  numberAssignVisible.value = true
  startNumber.value = firstEmpty  // 자동으로 첫 번째 빈 번호로 설정
  numberDirection.value = 'horizontal'
  reverseDirection.value = false
  fromTop.value = false
}

// Clean up duplicate tier lockers
const cleanupDuplicateTiers = async () => {
  console.log('[Cleanup] Starting duplicate tier cleanup...')
  
  if (!confirm('중복된 상단 락커를 제거하시겠습니까? 각 단수에서 첫 번째 락커만 유지됩니다.')) {
    return
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/lockrs/cleanup-duplicates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('[Cleanup] Cleanup result:', result)
    
    if (result.success) {
      alert(`중복 제거 완료!\n${result.totalDeleted}개의 중복 상단 락커가 제거되었습니다.`)
      
      // Reload lockers to reflect changes
      await loadLockers()
      
      // If in front view, re-transform
      if (currentViewMode.value === 'front') {
        transformToFrontViewNew()
      }
    } else {
      alert('중복 제거 실패: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    alert('중복 제거 중 오류가 발생했습니다.')
  }
}

// Show grouping analysis popup (그룹핑 확인)
const showGroupingAnalysis = () => {
  console.log('[Grouping Analysis] Starting analysis...')
  
  // First, run test with known data
  console.log('[TEST] Running test with known data first...')
  testGroupingWithKnownData()
  
  // Filter out child lockers - only analyze parent lockers
  const lockers = currentLockers.value.filter(locker => !locker.parentLockrCd)
  
  if (lockers.length === 0) {
    groupingAnalysisResult.value = '분석할 락커가 없습니다.'
    showGroupingPopup.value = true
    return
  }
  
  console.log('[REAL DATA] Now analyzing actual lockers...')
  
  let result = '세로배치 순서별 그룹 분석\n'
  result += '━━━━━━━━━━━━━━━━━━━━━\n'
  
  try {
    // 1. Find major groups using new Adjacent/Connected logic
    const majorGroups = findMajorGroups(lockers)
    
    // 2. Sort major groups by front view order (same as 세로배치)
    const sortedMajorGroups = sortMajorGroups(majorGroups)
    
    // 3. Display in front view order with distance information
    sortedMajorGroups.forEach((majorGroup, majorIndex) => {
      result += `대그룹 ${majorIndex + 1} (${majorGroup.length}개 락커):\n`
      result += '━━━━━━━━━━━━━━━━━━━━━\n'
      
      // Find and sort minor groups within each major group
      const minorGroups = findMinorGroups(majorGroup)
      const sortedMinorGroups = sortMinorGroups(minorGroups)
      
      sortedMinorGroups.forEach((minorGroup, minorIndex) => {
        // Apply same rotation processing as front view
        const rotatedLockers = applyRotationToMinorGroup(minorGroup)
        
        const lockerDescs = rotatedLockers.map(l => {
          const originalLocker = lockers.find(orig => orig.id === l.id)
          return `${originalLocker?.number || l.id}(${originalLocker?.rotation || 0}°)`
        }).join(', ')
        
        // Determine grouping reason
        let reason = ''
        if (minorGroup.length === 1) {
          reason = '단독'
        } else {
          reason = '인접 (같은방향)'
        }
        
        result += `  소그룹 ${majorIndex + 1}-${minorIndex + 1}: ${lockerDescs} - ${reason}\n`
        
        // Show distances within minor group (adjacent lockers)
        if (minorGroup.length > 1) {
          result += '    소그룹 내 거리:\n'
          for (let i = 0; i < minorGroup.length - 1; i++) {
            for (let j = i + 1; j < minorGroup.length; j++) {
              if (isAdjacent(minorGroup[i], minorGroup[j])) {
                const distance = getMinCornerDistance(minorGroup[i], minorGroup[j])
                const l1 = minorGroup[i].number || minorGroup[i].id
                const l2 = minorGroup[j].number || minorGroup[j].id
                result += `      ${l1} ↔ ${l2}: ${distance.toFixed(2)}px\n`
              }
            }
          }
        }
      })
      
      // Show distances between minor groups within this major group
      if (sortedMinorGroups.length > 1) {
        result += '  소그룹 간 거리:\n'
        for (let i = 0; i < sortedMinorGroups.length - 1; i++) {
          for (let j = i + 1; j < sortedMinorGroups.length; j++) {
            // Find minimum distance between any two lockers from different minor groups
            let minDist = Infinity
            let closestPair = { l1: '', l2: '' }
            
            for (const locker1 of sortedMinorGroups[i]) {
              for (const locker2 of sortedMinorGroups[j]) {
                const dist = getMinCornerDistance(locker1, locker2)
                if (dist < minDist) {
                  minDist = dist
                  closestPair.l1 = locker1.number || locker1.id
                  closestPair.l2 = locker2.number || locker2.id
                }
              }
            }
            
            result += `    소그룹 ${majorIndex + 1}-${i + 1} ↔ 소그룹 ${majorIndex + 1}-${j + 1}: ${minDist.toFixed(2)}px (${closestPair.l1} - ${closestPair.l2})\n`
          }
        }
      }
      
      result += '\n'
    })
    
    // 4. Show distances between major groups
    if (sortedMajorGroups.length > 1) {
      result += '대그룹 간 거리:\n'
      result += '━━━━━━━━━━━━━━━━━━━━━\n'
      
      for (let i = 0; i < sortedMajorGroups.length - 1; i++) {
        for (let j = i + 1; j < sortedMajorGroups.length; j++) {
          // Find minimum distance between any two lockers from different major groups
          let minDist = Infinity
          let closestPair = { l1: '', l2: '' }
          
          for (const locker1 of sortedMajorGroups[i]) {
            for (const locker2 of sortedMajorGroups[j]) {
              const dist = getMinCornerDistance(locker1, locker2)
              if (dist < minDist) {
                minDist = dist
                closestPair.l1 = locker1.number || locker1.id
                closestPair.l2 = locker2.number || locker2.id
              }
            }
          }
          
          result += `  대그룹 ${i + 1} ↔ 대그룹 ${j + 1}: ${minDist.toFixed(2)}px (${closestPair.l1} - ${closestPair.l2})\n`
        }
      }
      result += '\n'
    }
    
    result += '요약:\n'
    result += '━━━━━━━━━━━━━━━━━━━━━\n'
    result += `총 대그룹: ${majorGroups.length}개\n`
    result += `총 소그룹: ${sortedMajorGroups.reduce((sum, major) => sum + findMinorGroups(major).length, 0)}개\n`
    result += '\n💡 이 순서는 세로배치 시 실제 표시 순서와 동일합니다.'
    
  } catch (error) {
    console.error('[Grouping Analysis] Error:', error)
    result += '분석 중 오류가 발생했습니다.\n'
    result += error.message
  }
  
  groupingAnalysisResult.value = result
  showGroupingPopup.value = true
}

// Find next available number for front view mode (정면배치모드)
// This returns a number (1, 2, 3...) for LOCKR_NO field
const findNextAvailableNumber = () => {
  // Get ALL lockers in the selected zone that are visible in front view (세로모드)
  const frontViewLockers = selectedZone.value 
    ? lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
    : currentLockers.value
    
  const assignedNumbers = frontViewLockers
    .map(l => parseInt(String(l.lockrNo || 0)))
    .filter(n => n > 0)
    .sort((a, b) => a - b)
  
  if (assignedNumbers.length === 0) return 1
  
  // Look for gaps first
  for (let i = 1; i < assignedNumbers[assignedNumbers.length - 1]; i++) {
    if (!assignedNumbers.includes(i)) {
      return i
    }
  }
  
  // No gaps found, return next number
  return assignedNumbers[assignedNumbers.length - 1] + 1
}

// Find next available label for floor view mode (평면배치모드)
// This returns a label (L1, L2, L3...) for LOCKR_LABEL field
const findNextAvailableLabel = () => {
  const floorViewLockers = selectedZone.value 
    ? lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
    : currentLockers.value
    
  console.log('[findNextAvailableLabel] Total lockers in zone:', floorViewLockers.length)
  
  // Extract numbers from labels (L1 -> 1, L2 -> 2, etc.)
  // Note: LOCKR_LABEL is stored in the 'number' field when loaded from DB
  const assignedLabelNumbers = floorViewLockers
    .map(l => {
      // Check both number and lockrLabel fields as LOCKR_LABEL might be in either
      const label = l.number || l.lockrLabel || ''
      const match = label.toString().match(/^L(\d+)$/)
      const extractedNumber = match ? parseInt(match[1]) : 0
      if (extractedNumber > 0) {
        console.log(`[findNextAvailableLabel] Found label ${label} -> number ${extractedNumber}`)
      }
      return extractedNumber
    })
    .filter(n => n > 0)
    .sort((a, b) => a - b)
  
  console.log('[findNextAvailableLabel] Assigned numbers:', assignedLabelNumbers)
  
  if (assignedLabelNumbers.length === 0) {
    console.log('[findNextAvailableLabel] No existing labels, returning L1')
    return 'L1'
  }
  
  // Look for gaps first
  for (let i = 1; i < assignedLabelNumbers[assignedLabelNumbers.length - 1]; i++) {
    if (!assignedLabelNumbers.includes(i)) {
      console.log(`[findNextAvailableLabel] Found gap at ${i}, returning L${i}`)
      return `L${i}`
    }
  }
  
  // No gaps found, return next label
  const nextNumber = assignedLabelNumbers[assignedLabelNumbers.length - 1] + 1
  console.log(`[findNextAvailableLabel] No gaps found, returning L${nextNumber}`)
  return `L${nextNumber}`
}

// Create 2D grid from selected lockers
const createLockerGrid = (lockers, isHorizontal) => {
  if (lockers.length === 0) return []
  
  const TOLERANCE = 20 // pixels tolerance for grouping
  
  if (isHorizontal) {
    // Group by Y coordinate (rows)
    const rows = new Map()
    
    lockers.forEach(locker => {
      const y = locker.frontViewY || locker.y
      let foundRow = null
      
      // Find existing row within tolerance
      for (let [rowY] of rows) {
        if (Math.abs(y - rowY) <= TOLERANCE) {
          foundRow = rowY
          break
        }
      }
      
      if (foundRow !== null) {
        rows.get(foundRow).push(locker)
      } else {
        rows.set(y, [locker])
      }
    })
    
    // Sort rows by Y coordinate and sort lockers within each row by X
    return Array.from(rows.entries())
      .sort((a, b) => a[0] - b[0]) // Sort rows by Y
      .map(([, rowLockers]) => 
        rowLockers.sort((a, b) => (a.frontViewX || a.x) - (b.frontViewX || b.x)) // Sort within row by X
      )
  } else {
    // Group by X coordinate (columns)  
    const cols = new Map()
    
    lockers.forEach(locker => {
      const x = locker.frontViewX || locker.x
      let foundCol = null
      
      // Find existing column within tolerance
      for (let [colX] of cols) {
        if (Math.abs(x - colX) <= TOLERANCE) {
          foundCol = colX
          break
        }
      }
      
      if (foundCol !== null) {
        cols.get(foundCol).push(locker)
      } else {
        cols.set(x, [locker])
      }
    })
    
    // Sort columns by X coordinate and sort lockers within each column by Y
    return Array.from(cols.entries())
      .sort((a, b) => a[0] - b[0]) // Sort columns by X
      .map(([, colLockers]) => 
        colLockers.sort((a, b) => (a.frontViewY || a.y) - (b.frontViewY || b.y)) // Sort within column by Y
      )
  }
}

// Assign numbers (번호 부여)
const assignNumbers = async () => {
  // Start loading state
  isAssigningNumbers.value = true
  assignmentProgress.value = '번호 할당을 준비중입니다...'
  
  try {
    // ===== STEP 1: 전체 락커 중 부여된 번호들 체크하고 임시 저장 =====
    const allLockersInZone = selectedZone.value 
      ? lockerStore.lockers.filter(l => l.zoneId === selectedZone.value.id)
      : currentLockers.value
    
    // 이미 부여된 모든 번호들을 Set으로 수집
    const existingNumbers = new Set(
      allLockersInZone
        .map(l => l.lockrNo)
        .filter(n => n && n > 0)
    )
    
    console.log(`[Number Assignment] Step 1 - 기존 번호들:`, Array.from(existingNumbers).sort((a, b) => a - b))
    
    // ===== STEP 2: 선택된 락커 분류 및 정렬 =====
    const allSelectedLockers = Array.from(selectedLockerIds.value).map(id =>
      currentLockers.value.find(l => l.id === id)
    ).filter(Boolean)
    
    // 디버그: 첫 번째 락커의 데이터 구조 확인
    if (allSelectedLockers.length > 0) {
      console.log('[Number Assignment] 샘플 락커 전체 데이터:', allSelectedLockers[0])
      console.log('[Number Assignment] 샘플 락커 주요 필드:', {
        id: allSelectedLockers[0].id,
        lockrNo: allSelectedLockers[0].lockrNo,
        lockrNoType: typeof allSelectedLockers[0].lockrNo,
        number: allSelectedLockers[0].number,
        numberType: typeof allSelectedLockers[0].number,
        lockrCd: allSelectedLockers[0].lockrCd,
        LOCKR_NO: allSelectedLockers[0].LOCKR_NO,
        LOCKR_NO_Type: typeof allSelectedLockers[0].LOCKR_NO
      })
    }
    
    // 번호가 있는 락커와 없는 락커 분리 (lockrNo만 체크)
    const lockersWithNumbers = []
    const lockersWithoutNumbers = []
    
    allSelectedLockers.forEach((locker, idx) => {
      // lockrNo가 숫자이고 0보다 큰 경우에만 번호가 있는 것으로 간주
      // 문자열일 수도 있으므로 Number로 변환 시도
      const lockrNoValue = locker.lockrNo || locker.LOCKR_NO || locker.number
      const lockrNoNumber = Number(lockrNoValue)
      const hasNumber = !isNaN(lockrNoNumber) && lockrNoNumber > 0
      
      if (idx < 3) {  // 처음 3개만 상세 로그
        console.log(`[Number Assignment] 락커 ${idx+1} 상세:`, {
          id: locker.id.slice(-4),
          lockrNo: locker.lockrNo,
          LOCKR_NO: locker.LOCKR_NO,
          number: locker.number,
          converted: lockrNoNumber,
          hasNumber: hasNumber
        })
      }
      
      if (hasNumber) {
        locker.lockrNo = lockrNoNumber  // 숫자로 정규화
        lockersWithNumbers.push(locker)
      } else {
        lockersWithoutNumbers.push(locker)
      }
    })
    
    console.log(`[Number Assignment] Step 2 - 선택된 락커: 총 ${allSelectedLockers.length}개`)
    console.log(`  - 번호 있음: ${lockersWithNumbers.length}개`, lockersWithNumbers.map(l => `L${l.lockrNo}`))
    console.log(`  - 번호 없음: ${lockersWithoutNumbers.length}개`)
    
    // 번호를 부여할 락커가 없으면 종료
    if (lockersWithoutNumbers.length === 0) {
      alert('선택한 모든 락커에 이미 번호가 부여되어 있습니다.')
      isAssigningNumbers.value = false
      return
    }
    
    // 번호 부여할 락커들을 방향에 따라 정렬
    const isHorizontal = numberDirection.value === 'horizontal'
    let grid = createLockerGrid(lockersWithoutNumbers, isHorizontal)
    
    // 방향 옵션 적용
    if (fromTop.value) {
      grid.reverse()
    }
    
    if (reverseDirection.value) {
      grid.forEach(group => group.reverse())
    }
    
    // 최종 순서로 평탄화
    const sortedLockers = grid.flat()
    
    console.log(`[Number Assignment] Step 2 - 정렬 완료:`, sortedLockers.map((l, i) => `${i+1}번째: ${l.id.slice(-4)}`))
    
    // ===== STEP 3: 시작번호부터 번호 할당 =====
    const start = startNumber.value || 1  // 사용자가 입력한 시작번호
    let currentNum = start
    const batchUpdates = []
    const assignments = []
    
    // 홀수/짝수 옵션에 따른 시작번호 조정
    if (numberGenerationType.value === 'odd' && currentNum % 2 === 0) {
      currentNum++  // 짝수면 홀수로 조정
      console.log(`[Number Assignment] 홀수 모드: 시작번호를 ${start}에서 ${currentNum}로 조정`)
    } else if (numberGenerationType.value === 'even' && currentNum % 2 === 1) {
      currentNum++  // 홀수면 짝수로 조정
      console.log(`[Number Assignment] 짝수 모드: 시작번호를 ${start}에서 ${currentNum}로 조정`)
    }
    
    console.log(`[Number Assignment] Step 3 - 시작번호: ${currentNum}, 할당할 락커 수: ${sortedLockers.length}, 모드: ${numberGenerationType.value}`)
    
    assignmentProgress.value = `락커 번호를 할당중입니다... (0/${sortedLockers.length})`
    
    let processedCount = 0
    for (const locker of sortedLockers) {
      // 사용 가능한 다음 번호 찾기
      while (existingNumbers.has(currentNum)) {
        console.log(`  - ${currentNum}번은 이미 사용중, 다음 번호 확인`)
        if (numberGenerationType.value === 'all') {
          currentNum++
        } else {
          currentNum += 2  // 홀수/짝수 모드에서는 2씩 증가
        }
      }
      
      console.log(`  - ${locker.id.slice(-4)} 락커에 ${currentNum}번 할당`)
      
      // 로컬 스토어 즉시 업데이트 (UI 반영)
      lockerStore.updateLocker(locker.id, { lockrNo: currentNum })
      
      // DB 업데이트용 배치 수집
      if (locker.lockrCd) {
        batchUpdates.push({
          lockrCd: locker.lockrCd,
          LOCKR_NO: currentNum
        })
      }
      
      assignments.push(`${processedCount + 1}. ${locker.id.slice(-4)} → L${currentNum}`)
      
      // 현재 배치에서 중복 방지를 위해 Set에 추가
      existingNumbers.add(currentNum)
      
      // 다음 번호로 증가
      if (numberGenerationType.value === 'all') {
        currentNum++
      } else {
        currentNum += 2  // 홀수/짝수 모드에서는 2씩 증가
      }
      processedCount++
      
      // 진행 상황 업데이트
      assignmentProgress.value = `락커 번호를 할당중입니다... (${processedCount}/${sortedLockers.length})`
    }
    
    console.log(`[Number Assignment] Step 3 완료 - 할당 내역:`, assignments)
    
    // ===== STEP 4: 데이터베이스에 배치 업데이트 =====
    if (batchUpdates.length > 0) {
      try {
        assignmentProgress.value = `데이터베이스에 ${batchUpdates.length}개 락커 번호를 저장중입니다...`
        console.log(`[Number Assignment] Step 4 - DB 배치 업데이트 시작: ${batchUpdates.length}개`)
        
        await batchUpdateLockerNumbers(batchUpdates)
        
        console.log(`[Number Assignment] Step 4 완료 - DB 업데이트 성공`)
        assignmentProgress.value = '번호 할당이 완료되었습니다!'
      } catch (error) {
        console.error(`[Number Assignment] DB 업데이트 실패:`, error)
        assignmentProgress.value = '데이터베이스 저장에 실패했습니다.'
        alert('데이터베이스 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }
    }
    
    // ===== 완료 처리 =====
    console.log(`[Number Assignment] 전체 프로세스 완료`)
    console.log(`  - 총 ${lockersWithoutNumbers.length}개 락커에 번호 할당 완료`)
    console.log(`  - ${lockersWithNumbers.length}개 락커는 기존 번호 유지`)
    
    // 갭 체크
    const gaps = findNumberGaps()
    if (gaps.length > 0) {
      console.log(`[Number Assignment] 번호 갭 발견:`, gaps)
    }
    
    // 모달 닫기
    setTimeout(() => {
      numberAssignVisible.value = false
    }, 500)
    
  } catch (error) {
    console.error('[Number Assignment] Assignment failed:', error)
    assignmentProgress.value = '번호 할당 중 오류가 발생했습니다.'
    alert('번호 할당 중 오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    // Reset loading state
    isAssigningNumbers.value = false
  }
}

// Delete numbers (번호 삭제)
const deleteNumbers = async () => {
  hideContextMenu()
  
  if (confirm('선택된 락커의 번호를 삭제하시겠습니까?')) {
    const deletePromises = Array.from(selectedLockerIds.value).map(async (id) => {
      try {
        // Update local store first for immediate UI feedback (set to undefined)
        lockerStore.updateLocker(id, { lockrNo: undefined })
        
        // Save to database if locker has database ID
        const locker = currentLockers.value.find(l => l.id === id)
        if (locker && locker.lockrCd) {
          await updateLockerPlacement(locker.lockrCd, { LOCKR_NO: 0 })
        }
      } catch (error) {
        console.error(`[Number Deletion] Failed to delete number for locker ${id}:`, error)
        // Keep local update even if database save fails
      }
    })
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises)
  }
}

// 모든 락커의 겹침을 검사하고 수정하는 함수
const detectAndFixOverlaps = () => {
  console.log('[Overlap Fix] Starting overlap detection and fix...')
  let fixedCount = 0
  
  // 모든 락커 쌍을 검사
  for (let i = 0; i < currentLockers.value.length; i++) {
    const locker1 = currentLockers.value[i]
    const bounds1 = getRotatedBounds(locker1)
    
    for (let j = i + 1; j < currentLockers.value.length; j++) {
      const locker2 = currentLockers.value[j]
      const bounds2 = getRotatedBounds(locker2)
      
      // 겹침 검사
      const overlapX = Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width) - 
                       Math.max(bounds1.x, bounds2.x)
      const overlapY = Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height) - 
                       Math.max(bounds1.y, bounds2.y)
      
      // CRITICAL FIX: Use tolerance for floating point errors
      const COLLISION_TOLERANCE = 0.5 // 0.5px tolerance for floating point errors
      if (overlapX > COLLISION_TOLERANCE && overlapY > COLLISION_TOLERANCE) {
        // Found overlap - need to fix
        
        // locker2를 이동시켜 겹침 해결
        let newX = locker2.x
        let newY = locker2.y
        
        // X축 이동이 더 작으면 X축으로, 아니면 Y축으로 이동
        if (Math.abs(overlapX) < Math.abs(overlapY)) {
          // X축으로 이동 (최소 4px 간격 보장)
          if (bounds2.x < bounds1.x + bounds1.width / 2) {
            // 왼쪽으로 이동
            const moveDistance = Math.max(Math.abs(overlapX) + 4, 4)
            newX = locker2.x - moveDistance
          } else {
            // 오른쪽으로 이동
            const moveDistance = Math.max(Math.abs(overlapX) + 4, 4)
            newX = locker2.x + moveDistance
          }
        } else {
          // Y축으로 이동 (최소 4px 간격 보장)
          if (bounds2.y < bounds1.y + bounds1.height / 2) {
            // 위로 이동
            const moveDistance = Math.max(Math.abs(overlapY) + 4, 4)
            newY = locker2.y - moveDistance
          } else {
            // 아래로 이동
            const moveDistance = Math.max(Math.abs(overlapY) + 4, 4)
            newY = locker2.y + moveDistance
          }
        }
        
        // 그리드에 스냅
        newX = snapToGrid(newX)
        newY = snapToGrid(newY)
        
        // 경계 체크
        const dims = getLockerDimensions(locker2)
        newX = Math.max(0, Math.min(newX, canvasWidth.value - dims.width))
        newY = Math.max(0, Math.min(newY, canvasHeight.value - dims.height))
        
        // 이동 전 위치 저장
        const oldX = locker2.x
        const oldY = locker2.y
        
        // 업데이트
        lockerStore.updateLocker(locker2.id, { x: newX, y: newY })
        fixedCount++
        
        console.log(`[Overlap Fix] Moved ${locker2.id} from (${oldX}, ${oldY}) to (${newX}, ${newY})`)
      }
    }
  }
  
  if (fixedCount > 0) {
    console.log(`[Overlap Fix] Fixed ${fixedCount} overlapping lockers`)
  } else {
    console.log('[Overlap Fix] No overlaps detected')
  }
  
  return fixedCount
}

// 회전된 락커의 실제 경계 박스 계산
const getRotatedBounds = (locker: any) => {
  // CRITICAL: Check if this is a simple object or a full locker
  let width, height
  
  // If locker has type/id, use getLockerDimensions for scaling
  if (locker.type || locker.id) {
    const dims = getLockerDimensions(locker)
    width = dims.width
    height = dims.height
  } else {
    // Otherwise use the provided width/height directly (already scaled)
    width = locker.width
    height = locker.height
  }
  
  const rotation = (locker.rotation || 0) * Math.PI / 180
  
  // 회전이 없으면 간단히 반환
  if (rotation === 0) {
    return {
      x: locker.x,
      y: locker.y,
      width: width,
      height: height,
      originalX: locker.x,
      originalY: locker.y,
      originalWidth: width,
      originalHeight: height
    }
  }
  
  // 중심점 계산 (로컬 좌표계)
  const centerX = width / 2
  const centerY = height / 2
  
  // 회전 매트릭스
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  
  // 네 모서리 좌표 (로컬 좌표계, 왼쪽 상단이 0,0)
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ]
  
  // 각 모서리를 중심점 기준으로 회전
  const rotatedCorners = corners.map(corner => {
    // 중심점으로 이동
    const relX = corner.x - centerX
    const relY = corner.y - centerY
    
    // 회전 적용
    const rotX = relX * cos - relY * sin
    const rotY = relX * sin + relY * cos
    
    // 월드 좌표계로 변환
    return {
      x: locker.x + centerX + rotX,
      y: locker.y + centerY + rotY
    }
  })
  
  // 회전된 경계 박스 계산
  const minX = Math.min(...rotatedCorners.map(c => c.x))
  const maxX = Math.max(...rotatedCorners.map(c => c.x))
  const minY = Math.min(...rotatedCorners.map(c => c.y))
  const maxY = Math.max(...rotatedCorners.map(c => c.y))
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    originalX: locker.x,
    originalY: locker.y,
    originalWidth: width,
    originalHeight: height
  }
}

// 그리드에 스냅
const snapToGrid = (value: number, gridSize: number = 20): number => {
  return Math.round(value / gridSize) * gridSize
}

// 두 락커가 같은 그룹인지 판단 (인접한 락커들의 연결 체인)
const areInSameGroup = (locker1Id: string, locker2Id: string): boolean => {
  // BFS를 사용하여 locker1에서 locker2로 인접한 락커들을 통해 도달 가능한지 확인
  const visited = new Set<string>()
  const queue = [locker1Id]
  visited.add(locker1Id)
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    
    // 목표 락커에 도달했으면 같은 그룹
    if (currentId === locker2Id) {
      return true
    }
    
    // 현재 락커와 인접한 모든 락커 찾기
    const currentLocker = currentLockers.value.find(l => l.id === currentId)
    if (!currentLocker) continue
    
    for (const other of currentLockers.value) {
      if (!visited.has(other.id) && areAdjacent(currentLocker, other, 10)) {
        visited.add(other.id)
        queue.push(other.id)
      }
    }
  }
  
  return false
}

// 인접 락커에 스냅 - 회전을 고려한 정확한 정렬
const snapToAdjacent = (x: number, y: number, width: number, height: number, excludeId?: string, dragRotation: number = 0) => {
  // Simple constants for basic snapping
  const SNAP_THRESHOLD = 20  // Distance to trigger snapping
  const EDGE_ALIGN_THRESHOLD = 20  // Edge alignment threshold
  
  // Get rotated bounds for dragging locker
  const dragBounds = getRotatedBounds({
    x, y, 
    width, height,
    rotation: dragRotation
  })
  
  let snappedX = x
  let snappedY = y
  let snapped = false
  
  console.log('=== SNAP PRIORITY DEBUG ===')
  console.log('Checking corner snap first (priority 1)')
  
  // Check each existing locker for snapping
  for (const locker of currentLockers.value) {
    if (locker.id === excludeId) continue
    
    // Get rotated bounds for existing locker
    const bounds = getRotatedBounds(locker)
    const lockerX = bounds.x
    const lockerY = bounds.y
    const lockerWidth = bounds.width
    const lockerHeight = bounds.height
    
    // ===== PRIORITY 1: Corner snapping (꼭지점 스냅핑) =====
    const corners = [
      // Bottom-right corner: existing locker BR → dragging locker TL
      {
        existingX: lockerX + lockerWidth,
        existingY: lockerY + lockerHeight,
        dragX: dragBounds.x,
        dragY: dragBounds.y,
        type: 'corner-bottom-right-to-top-left'
      },
      // Bottom-left corner: existing locker BL → dragging locker TR
      {
        existingX: lockerX,
        existingY: lockerY + lockerHeight,
        dragX: dragBounds.x + dragBounds.width,
        dragY: dragBounds.y,
        type: 'corner-bottom-left-to-top-right'
      },
      // Top-right corner: existing locker TR → dragging locker BL
      {
        existingX: lockerX + lockerWidth,
        existingY: lockerY,
        dragX: dragBounds.x,
        dragY: dragBounds.y + dragBounds.height,
        type: 'corner-top-right-to-bottom-left'
      },
      // Top-left corner: existing locker TL → dragging locker BR
      {
        existingX: lockerX,
        existingY: lockerY,
        dragX: dragBounds.x + dragBounds.width,
        dragY: dragBounds.y + dragBounds.height,
        type: 'corner-top-left-to-bottom-right'
      }
    ]
    
    for (const corner of corners) {
      const cornerDistance = Math.sqrt(
        Math.pow(corner.existingX - corner.dragX, 2) + 
        Math.pow(corner.existingY - corner.dragY, 2)
      )
      
      if (cornerDistance < SNAP_THRESHOLD) {
        console.log(`[CORNER SNAP] ${corner.type}, distance: ${cornerDistance.toFixed(1)}`)
        
        // Snap to corner position
        snappedX = x + (corner.existingX - corner.dragX)
        snappedY = y + (corner.existingY - corner.dragY)
        snapped = true
        break // Exit corner check loop
      }
    }
    
    // If corner snap succeeded, skip face-to-face snapping for this locker
    if (snapped) {
      console.log('Corner snap succeeded - skipping face-to-face snap')
      break
    }
    
    // ===== PRIORITY 2: Face-to-face snapping (면과면 스냅핑) =====
    console.log('No corner snap - checking face-to-face snap (priority 2)')
    
    // Right snap: dragging locker to the right of existing locker
    const rightGap = Math.abs((lockerX + lockerWidth) - dragBounds.x)
    if (rightGap < SNAP_THRESHOLD && !snapped) {
      // Snap horizontally
      snappedX = x + ((lockerX + lockerWidth) - dragBounds.x)
      
      // Check vertical alignment
      const topDiff = Math.abs(dragBounds.y - lockerY)
      const bottomDiff = Math.abs((dragBounds.y + dragBounds.height) - (lockerY + lockerHeight))
      
      if (topDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = y + (lockerY - dragBounds.y)
      } else if (bottomDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = y + ((lockerY + lockerHeight) - (dragBounds.y + dragBounds.height))
      }
      snapped = true
      console.log('[FACE SNAP] Right snap applied')
      continue
    }
    
    // Left snap: dragging locker to the left of existing locker
    const leftGap = Math.abs(lockerX - (dragBounds.x + dragBounds.width))
    if (leftGap < SNAP_THRESHOLD && !snapped) {
      // Snap horizontally
      snappedX = x + (lockerX - (dragBounds.x + dragBounds.width))
      
      // Check vertical alignment
      const topDiff = Math.abs(dragBounds.y - lockerY)
      const bottomDiff = Math.abs((dragBounds.y + dragBounds.height) - (lockerY + lockerHeight))
      
      if (topDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = y + (lockerY - dragBounds.y)
      } else if (bottomDiff < EDGE_ALIGN_THRESHOLD) {
        snappedY = y + ((lockerY + lockerHeight) - (dragBounds.y + dragBounds.height))
      }
      snapped = true
      console.log('[FACE SNAP] Left snap applied')
      continue
    }
    
    // Bottom snap: dragging locker below existing locker
    const bottomGap = Math.abs((lockerY + lockerHeight) - dragBounds.y)
    if (bottomGap < SNAP_THRESHOLD && !snapped) {
      // Snap vertically
      snappedY = y + ((lockerY + lockerHeight) - dragBounds.y)
      
      // Check horizontal alignment
      const leftDiff = Math.abs(dragBounds.x - lockerX)
      const rightDiff = Math.abs((dragBounds.x + dragBounds.width) - (lockerX + lockerWidth))
      
      if (leftDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = x + (lockerX - dragBounds.x)
      } else if (rightDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = x + ((lockerX + lockerWidth) - (dragBounds.x + dragBounds.width))
      }
      snapped = true
      console.log('[FACE SNAP] Bottom snap applied')
      continue
    }
    
    // Top snap: dragging locker above existing locker
    const topGap = Math.abs(lockerY - (dragBounds.y + dragBounds.height))
    if (topGap < SNAP_THRESHOLD && !snapped) {
      // Snap vertically
      snappedY = y + (lockerY - (dragBounds.y + dragBounds.height))
      
      // Check horizontal alignment
      const leftDiff = Math.abs(dragBounds.x - lockerX)
      const rightDiff = Math.abs((dragBounds.x + dragBounds.width) - (lockerX + lockerWidth))
      
      if (leftDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = x + (lockerX - dragBounds.x)
      } else if (rightDiff < EDGE_ALIGN_THRESHOLD) {
        snappedX = x + ((lockerX + lockerWidth) - (dragBounds.x + dragBounds.width))
      }
      snapped = true
      console.log('[FACE SNAP] Top snap applied')
      continue
    }
  }
  
  console.log('Final result: snapped =', snapped)
  
  return { x: snappedX, y: snappedY }
}

// 락커 충돌 체크 - 회전된 경계 고려
const checkCollisionForLocker = (x: number, y: number, width: number, height: number, excludeId: string | null = null, rotation: number = 0, isSnapped: boolean = false): boolean => {
  // 체크하려는 락커의 실제 경계
  const checkBounds = getRotatedBounds({ x, y, width, height, rotation })
  
  // DEBUG: Collision check details
  const collisionDebug = {
    checking: { x, y, width, height, rotation },
    bounds: checkBounds,
    excludeId,
    collisions: []
  }
  
  return currentLockers.value.some(other => {
    // Exclude the dragged locker
    if (other.id === excludeId) return false
    
    // During group drag, exclude all selected lockers from collision check
    if (isDragging.value && selectedLockerIds.value.has(other.id)) return false
    
    // 다른 락커의 실제 경계 (회전 고려)
    const otherBounds = getRotatedBounds(other)
    
    // Calculate overlap using rotated bounds
    const overlapX = Math.min(checkBounds.x + checkBounds.width, otherBounds.x + otherBounds.width) - 
                     Math.max(checkBounds.x, otherBounds.x)
    const overlapY = Math.min(checkBounds.y + checkBounds.height, otherBounds.y + otherBounds.height) - 
                     Math.max(checkBounds.y, otherBounds.y)
    
    // CRITICAL FIX: Collision detection for locker BODIES (not selection outlines)
    // Allow 0px gap for visual adjacency between locker bodies
    // Use consistent small tolerance for all positions to prevent overlaps
    const COLLISION_TOLERANCE = 0.5 // Small tolerance for floating point errors
    const hasOverlap = overlapX > COLLISION_TOLERANCE && overlapY > COLLISION_TOLERANCE
    
    // DEBUG: Log collision details if overlap detected
    if (hasOverlap) {
      // Collision detected - log only essential info
      console.log('[COLLISION] Detected with', other.id, '- overlap:', `(${overlapX.toFixed(1)}, ${overlapY.toFixed(1)})`, 'tolerance:', COLLISION_TOLERANCE)
    }
    
    // Return true if overlap detected, false otherwise
    return hasOverlap
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

// 테스트용 락커 데이터 생성
// ⚠️ CRITICAL TEST DATA - DO NOT MODIFY
// Verification test case: Must produce 1 major group, 2 minor groups
// L1-L2-L3 (adjacent, 0°) connected to L4-L5-L6 (adjacent, 90°) via 42px connection
const createTestLockers = () => {
  console.log('[TEST] Creating test locker data with Adjacent/Connected thresholds...')
  console.log('[TEST] ADJACENT: ≤30px + same direction, CONNECTED: 40-43px (any direction)')
  
  const testLockers = [
    // Group 1: Adjacent lockers (≤30px, same direction 0°)
    { id: 'test-L1', number: 'L1', x: 100, y: 100, width: 40, height: 60, rotation: 0, color: '#4A90E2' },
    { id: 'test-L2', number: 'L2', x: 165, y: 100, width: 40, height: 60, rotation: 0, color: '#4A90E2' }, // 25px gap (165-140=25) - adjacent
    { id: 'test-L3', number: 'L3', x: 230, y: 100, width: 40, height: 60, rotation: 0, color: '#4A90E2' }, // 25px gap (230-205=25) - adjacent
    
    // Connected to Group 1: Different direction but within connection range
    { id: 'test-L4', number: 'L4', x: 312, y: 100, width: 40, height: 60, rotation: 90, color: '#BD10E0' }, // 42px gap (312-270=42) - connected
    { id: 'test-L5', number: 'L5', x: 377, y: 100, width: 40, height: 60, rotation: 90, color: '#BD10E0' }, // 25px gap - adjacent (same direction 90°)
    { id: 'test-L6', number: 'L6', x: 442, y: 100, width: 40, height: 60, rotation: 90, color: '#BD10E0' }  // 25px gap - adjacent (same direction 90°)
  ]
  
  console.log('[TEST] Expected result: ALL in 1 major group (connected through L3↔L4)')
  console.log('[TEST] Expected minor groups: [L1,L2,L3] (adjacent, 0°), [L4,L5,L6] (adjacent, 90°)')
  console.log('[TEST] Key distances:')
  console.log('[TEST]   L1↔L2: 25px (adjacent, same dir)')
  console.log('[TEST]   L2↔L3: 25px (adjacent, same dir)') 
  console.log('[TEST]   L3↔L4: 42px (connected, diff dir)')
  console.log('[TEST]   L4↔L5: 25px (adjacent, same dir)')
  console.log('[TEST]   L5↔L6: 25px (adjacent, same dir)')
  
  return testLockers
}

const testGroupingWithKnownData = () => {
  console.log('=== TESTING WITH KNOWN DATA ===')
  
  // Save current lockers
  const originalLockers = [...currentLockers.value]
  
  // Replace with test data
  currentLockers.value = createTestLockers()
  
  // Run grouping
  const groups = groupNearbyLockers()
  
  // Restore original lockers
  currentLockers.value = originalLockers
  
  console.log('=== TEST COMPLETE ===')
  return groups
}

// ==========================================
// CRITICAL: CORNER-BASED GROUPING SYSTEM V2.0
// ⚠️ DO NOT MODIFY WITHOUT APPROVAL
// Last verified working: 2025-08-29
// Uses corner-to-corner distance calculations (16 combinations)
// Documentation: /docs/grouping-system-final.md
// ==========================================

// ✅ CORNER-BASED THRESHOLD - New grouping definition
const CORNER_THRESHOLD = 55 // pixels - threshold for corner proximity (updated from 43px)

// Type definition for points
interface Point {
  x: number
  y: number
}

// Get all 4 corners of a locker considering rotation
const getLockerCorners = (locker: any): Point[] => {
  const x = locker.x || locker.left || 0
  const y = locker.y || locker.top || 0
  const width = locker.width || 60
  const height = locker.height || locker.depth || 40
  const rotation = (locker.rotation || 0) * Math.PI / 180
  const cx = x + width / 2
  const cy = y + height / 2
  
  // Define corners relative to center
  const corners = [
    { x: -width/2, y: -height/2 }, // Top-left
    { x: width/2, y: -height/2 },  // Top-right
    { x: width/2, y: height/2 },   // Bottom-right
    { x: -width/2, y: height/2 }   // Bottom-left
  ]
  
  // Apply rotation and translate to world coordinates
  return corners.map(corner => ({
    x: cx + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation),
    y: cy + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation)
  }))
}

// Calculate minimum distance between two lockers using corner points
const getMinCornerDistance = (locker1: any, locker2: any): number => {
  const corners1 = getLockerCorners(locker1)
  const corners2 = getLockerCorners(locker2)
  let minDistance = Infinity
  
  // Check all 16 corner combinations
  for (const c1 of corners1) {
    for (const c2 of corners2) {
      const distance = Math.sqrt(
        Math.pow(c1.x - c2.x, 2) + 
        Math.pow(c1.y - c2.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
    }
  }
  
  return minDistance
}

// Count corner pairs within threshold distance
const countCloseCornerPairs = (locker1: any, locker2: any, threshold: number): number => {
  const corners1 = getLockerCorners(locker1)
  const corners2 = getLockerCorners(locker2)
  let count = 0
  
  for (const c1 of corners1) {
    for (const c2 of corners2) {
      const distance = Math.sqrt(
        Math.pow(c1.x - c2.x, 2) + 
        Math.pow(c1.y - c2.y, 2)
      )
      if (distance < threshold) {
        count++
      }
    }
  }
  
  return count
}

// ⚠️ CRITICAL FUNCTION - CORNER-BASED ADJACENT CHECK
// Adjacent = 2+ corner pairs < 43px AND same door direction
const isAdjacent = (locker1: any, locker2: any): boolean => {
  const closeCornerPairs = countCloseCornerPairs(locker1, locker2, CORNER_THRESHOLD)
  const rotation1 = normalizeRotation(locker1.rotation || 0)
  const rotation2 = normalizeRotation(locker2.rotation || 0)
  const sameDirection = rotation1 === rotation2
  
  // Adjacent: 2+ close corner pairs AND same direction
  return closeCornerPairs >= 2 && sameDirection
}

// ⚠️ CRITICAL FUNCTION - CORNER-BASED CONNECTED CHECK
// Connected = 1+ corner pair < 43px OR (2+ corner pairs < 43px AND different direction)
const isConnected = (locker1: any, locker2: any): boolean => {
  const closeCornerPairs = countCloseCornerPairs(locker1, locker2, CORNER_THRESHOLD)
  
  if (closeCornerPairs >= 1) {
    // Connected if at least 1 corner pair is close
    return true
  }
  
  // Also connected if 2+ corner pairs are close with different directions
  if (closeCornerPairs >= 2) {
    const rotation1 = normalizeRotation(locker1.rotation || 0)
    const rotation2 = normalizeRotation(locker2.rotation || 0)
    const differentDirection = rotation1 !== rotation2
    return differentDirection
  }
  
  return false
}

// ⚠️ CRITICAL FUNCTION - MAJOR GROUP DETECTION
// DO NOT MODIFY - Verified working BFS algorithm
// Creates major groups using Adjacent OR Connected relationships
const groupNearbyLockers = (lockersToGroup?: any[]) => {
  const groups: any[][] = []
  const visited = new Set<string>()
  
  // === Front view transformation start ===
  
  // Use provided lockers or fallback to currentLockers.value
  const targetLockers = lockersToGroup || currentLockers.value

  targetLockers.forEach(locker => {
    if (visited.has(locker.id)) return
    
    // Starting new major group
    const group = [locker]
    visited.add(locker.id)
    
    // BFS로 인접하거나 연결된 락커 찾기 (Major Group = Adjacent OR Connected)
    const queue = [locker]
    while (queue.length > 0) {
      const current = queue.shift()!
      // Processing locker from queue
      
      targetLockers.forEach(other => {
        if (visited.has(other.id)) return
        
        // Check if adjacent OR connected
        const adjacent = isAdjacent(current, other)
        const connected = isConnected(current, other)
        const shouldGroup = adjacent || connected
        
        // Checking if lockers should group
        
        if (shouldGroup) {
          // Adding to major group
          group.push(other)
          visited.add(other.id)
          queue.push(other)
        }
      })
    }
    
    // Major group complete
    groups.push(group)
  })
  
  
  groups.forEach((group, index) => {
    console.log(`  Group ${index + 1}: ${group.map(l => l.number || l.id).join(', ')}`)
  })
  // === Front view transformation start ===
  
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


// 선택된 락커 회전 (드래그 기반 회전으로 대체됨)
/* const rotateSelectedLocker = (angle = 45) => {
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
} */

// 다중 선택된 락커 회전 (드래그 기반으로 대체 예정)
/* const rotateSelectedLockers = (direction: 'cw' | 'ccw' = 'cw') => {
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
/* const rotateMultipleLockers = (angle: number) => {
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
} */

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
      selectZone(newZone)
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
  
  // Fix Overlaps (Ctrl/Cmd + Shift + F)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
    event.preventDefault()
    const overlaps = detectAndFixOverlaps()
    if (overlaps > 0) {
      console.log(`[Keyboard] Fixed ${overlaps} overlapping lockers`)
      alert(`Fixed ${overlaps} overlapping lockers`)
    } else {
      console.log('[Keyboard] No overlaps detected')
      alert('No overlapping lockers found')
    }
    return
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
  
  // R 키: 회전 모드 활성화 (드래그 회전을 위한 힌트)
  if ((event.key === 'r' || event.key === 'R')) {
    event.preventDefault()
    
    if (selectedLocker.value) {
      // console.log('[Rotation] Press R - Use mouse to drag rotation handle')
      // 회전 핸들을 강조 표시하거나 힌트를 보여줄 수 있습니다
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
        number: findNextAvailableLabel(),  // Use label for paste
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

// Watch for view mode changes and reload lockers accordingly
watch(() => currentViewMode.value, async (newViewMode, oldViewMode) => {
  // Only react to actual view mode changes (not initial mount)
  if (oldViewMode && newViewMode !== oldViewMode) {
    console.log(`[ViewMode Change] ${oldViewMode} → ${newViewMode}, reloading lockers...`)
    await loadLockers()
    
    // After loading lockers, apply front view transformation ONLY when transitioning from floor to front
    // When staying in front mode (zone change), use saved positions from DB
    if (newViewMode === 'front' && oldViewMode === 'floor') {
      console.log('[ViewMode Change] Transitioning from floor to front - recalculating positions...')
      nextTick(() => {
        try {
          transformToFrontViewNew()
          console.log('[ViewMode Change] Front view transformation completed')
        } catch (error) {
          console.error('[ViewMode Change] Front view transformation failed:', error)
          transformToFrontView_BACKUP()
        }
      })
    } else if (newViewMode === 'front' && oldViewMode === 'front') {
      console.log('[ViewMode Change] Zone change in front view - checking for missing coordinates...')
      
      // Check if any locker has missing front view coordinates
      const lockersWithMissingCoords = currentLockers.value.filter(locker => 
        locker.frontViewX === null || locker.frontViewX === undefined ||
        locker.frontViewY === null || locker.frontViewY === undefined
      )
      
      if (lockersWithMissingCoords.length > 0) {
        console.log(`[ViewMode Change] Found ${lockersWithMissingCoords.length} lockers with missing front view coordinates`)
        console.log('[ViewMode Change] Missing coordinates for lockers:', 
          lockersWithMissingCoords.map(l => l.number).join(', '))
        console.log('[ViewMode Change] Recalculating positions for ALL lockers in zone using grouping logic')
        
        // Recalculate positions for ALL lockers in the zone using full grouping logic
        nextTick(() => {
          try {
            transformToFrontViewNew()
            console.log('[ViewMode Change] Zone-wide recalculation completed')
          } catch (error) {
            console.error('[ViewMode Change] Zone-wide recalculation failed:', error)
          }
        })
      } else {
        console.log('[ViewMode Change] All lockers have saved positions - using DB coordinates')
      }
    }
  } else if (!oldViewMode) {
    console.log('[ViewMode Watcher] Initial mount - skipping reload (onMounted will handle it)')
  }
})

// Computed property for cursor style
const getCursorStyle = computed(() => {
  if (isPanning.value) return 'grabbing'
  if (isDragging.value) return 'grabbing'
  if (isDragSelecting.value) return 'crosshair'
  if (isCopyMode.value && selectedLockerIds.value.size > 0) return 'copy'
  if (selectedLockerIds.value.size > 0) return 'move'
  return 'default'
})

// Computed property for viewBox with zoom and pan
const computedViewBox = computed(() => {
  // 평면모드(floor)와 세로모드(front) 모두에서 줌과 팬 적용
  // 초기 뷰포트는 1550x720으로 설정
  const effectiveWidth = INITIAL_VIEWPORT_WIDTH / zoomLevel.value
  const effectiveHeight = INITIAL_VIEWPORT_HEIGHT / zoomLevel.value
  const x = panOffset.value.x
  const y = panOffset.value.y
  
  return `${x} ${y} ${effectiveWidth} ${effectiveHeight}`
})


// ========== 디버깅 로그 ==========
watch(selectedLockerIds, (newIds) => {
  
  
  
  
}, { immediate: true, deep: true })

watch(connectedGroups, (newGroups) => {
  
  
}, { deep: true })

// 초기화
onMounted(async () => {
  console.log('Component mounted, loading data...')
  
  // Ensure initial view mode is set to floor (default)
  currentViewMode.value = 'floor'
  console.log('[onMounted] Initial view mode set to:', currentViewMode.value)
  
  // Keep loading true until all critical data is loaded
  isLoadingTypes.value = true
  isLoadingLockers.value = true
  
  try {
    // Load types first, then lockers (zones can remain parallel)
    await Promise.all([loadZones(), loadLockerTypes()])
    console.log('[onMounted] About to load lockers with view mode:', currentViewMode.value)
    await loadLockers()  // Will now respect currentViewMode (floor = parent only)
    
    // Only set loading false when everything is ready
    await nextTick()
    isLoadingTypes.value = false
    isLoadingLockers.value = false
    
    console.log('All data loading completed')
    
    // Auto-fit zoom to show all lockers after initial load
    if (currentViewMode.value === 'floor' && currentLockers.value.length > 0) {
      // 약간의 지연 후 자동 줌 (DOM 업데이트 대기)
      setTimeout(() => {
        autoFitLockers()
      }, 100)
    }
    
    // Check for missing front view coordinates if in front view mode
    if (currentViewMode.value === 'front') {
      const lockersWithMissingCoords = currentLockers.value.filter(locker => 
        locker.frontViewX === null || locker.frontViewX === undefined ||
        locker.frontViewY === null || locker.frontViewY === undefined
      )
      
      if (lockersWithMissingCoords.length > 0) {
        console.log(`[onMounted] Found ${lockersWithMissingCoords.length} lockers with missing front view coordinates`)
        console.log('[onMounted] Auto-calculating positions for lockers:', 
          lockersWithMissingCoords.map(l => l.number).join(', '))
        
        // Calculate positions for lockers with missing coordinates
        nextTick(() => {
          try {
            transformToFrontViewNew()
            console.log('[onMounted] Auto-calculation completed')
          } catch (error) {
            console.error('[onMounted] Auto-calculation failed:', error)
          }
        })
      }
    }
    
    // Check and fix any overlapping lockers
    // 주석 처리: 초기 로드 시 자동으로 락커 위치를 변경하지 않도록 함
    // await nextTick()
    // setTimeout(() => {
    //   const overlaps = detectAndFixOverlaps()
    //   if (overlaps > 0) {
    //     console.log(`[Init] Fixed ${overlaps} overlapping lockers on load`)
    //   }
    // }, 100)
    
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
  
  // 락커는 이미 위의 onMounted에서 로드되었으므로 중복 로드 제거
  // await loadLockers() // REMOVED: 중복 호출 제거
  
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
  
  // R 키 뗄 때 (더 이상 연속 회전이 없으므로 제거)
  // if ((event.key === 'r' || event.key === 'R')) {
  //   // 드래그 기반 회전으로 변경됨
  // }
}

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('click', hideContextMenu)
  window.removeEventListener('resize', updateCanvasSize)
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

/* Progress indicator styles */
.progress-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border-left: 4px solid #0768AE;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-indicator .loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #0768AE;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.progress-text {
  color: #495057;
  font-size: 14px;
  font-weight: 500;
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
  margin-left: -10px !important;
  padding-left: 0 !important;
}

.locker-placement {
  width: 100%;
  height: 100%; /* Changed from 100vh to 100% to fit within panel */
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: var(--background-main);
  min-width: 1890px; /* 사이드바(280+32) + 캔버스(1550+32) = 1890px 최소 너비 */
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
  overflow: visible; /* 윈도우 레벨 스크롤 허용 */
  min-width: 1890px; /* 컨테이너도 최소 너비 보장 */
  margin-left: -10px !important;
  margin-top: 0 !important;
  padding-left: 0 !important;
  padding-top: 0 !important;
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
  flex-shrink: 0; /* 사이드바 크기 고정 */
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
  overflow: visible; /* 스크롤 제거 - 윈도우 레벨 스크롤만 사용 */
}

/* 구역 탭 */
.zone-tabs {
  display: flex;
  padding-bottom: 12px;
  border-bottom: 1px solid black;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
}

.zone-tab-group {
  display: flex;
  gap: 24px;
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
  width: 1550px; /* 뷰포트 너비 (실제 캔버스는 3100px) */
  height: 720px; /* 뷰포트 높이 (실제 캔버스는 1440px) */
  background: white;
  overflow: hidden; /* 캔버스 내부 스크롤 비활성화 - 줌/팬으로 탐색 */
  border: none; /* 경계 제거로 12px 차이 해소 */
  position: relative; /* SVG 포지셔닝용 */
  border-radius: 4px;
  display: block;
  padding: 0 !important;
  margin: 0; /* 마진도 제거 */
  box-sizing: border-box;
  flex-shrink: 0; /* 캔버스 크기 고정 */
}

.canvas {
  background: white;
  cursor: crosshair;
  width: 100%; /* 부모 컨테이너에 맞춤 - 스크롤 방지 */
  height: 100%; /* 부모 컨테이너에 맞춤 */
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

/* Grouping popup specific styles */
.grouping-popup {
  min-width: 600px;
  max-width: 800px;
}

/* Debug popup specific styles */
.debug-popup {
  min-width: 900px;
  max-width: 1200px;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.debug-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.debug-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.stat-item .label {
  font-weight: 500;
  color: #666;
}

.stat-item .value {
  font-weight: 600;
  color: #333;
}

.locker-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.locker-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.locker-item:hover {
  background-color: #f8f9fa;
}

.locker-item:last-child {
  border-bottom: none;
}

.locker-item.parent {
  border-left: 4px solid #28a745;
}

.locker-item.child {
  border-left: 4px solid #fd7e14;
  background-color: #fff8f0;
}

.locker-item.current {
  background-color: #e8f5e8;
}

.locker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.locker-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.locker-type {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
}

.locker-item.parent .locker-type {
  background: #d4edda;
  color: #155724;
}

.locker-item.child .locker-type {
  background: #ffeeba;
  color: #856404;
}

.render-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #d1ecf1;
  color: #0c5460;
}

.locker-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.locker-details span {
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.debug-btn {
  background: #17a2b8;
  color: white;
}

.debug-btn:hover {
  background: #138496;
}

.grouping-results {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.grouping-results pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
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

/* Number assignment modal specific styles */
.number-assign-modal .number-input {
  width: 150px !important;  /* Make input smaller */
}

.form-section {
  margin-bottom: 16px;
}

.form-labels-row {
  display: flex;
  gap: 140px;
  margin-bottom: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0;
  white-space: nowrap;
}

.form-options-row {
  display: flex;
  gap: 110px;
  align-items: center;
}

.radio-group-horizontal {
  display: flex;
  align-items: center;
  gap: 30px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
  white-space: nowrap;
}

.radio-label input[type="radio"] {
  cursor: pointer;
  margin: 0;
  margin-right: -5px;
  flex-shrink: 0;
}

.radio-label span {
  white-space: nowrap;
}


.checkbox-container {
  display: flex;
  align-items: center;
}

.checkbox-container input[type="checkbox"] {
  cursor: pointer;
  margin: 0;
}

.checkbox-label-left {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

.checkbox-label-left input[type="checkbox"] {
  cursor: pointer;
  margin: 0;
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
  margin-right: 20px;
}

/* Inline Mode Toggle */
.mode-toggle-inline {
  display: flex;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Zoom Controls */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
  padding: 6px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.zoom-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.zoom-btn svg {
  width: 16px;
  height: 16px;
}

.zoom-level {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  min-width: 50px;
  text-align: center;
}

.zoom-hints {
  display: flex;
  gap: 12px;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.zoom-hints .hint {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
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

/* 통합 선택 외곽선 - 단일 선택과 동일한 스타일 */
.unified-selection-outline {
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
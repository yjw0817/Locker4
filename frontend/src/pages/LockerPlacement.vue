<template>
  <div class="locker-placement">
    <header class="placement-header">
      <div class="header-left">
        <h1 class="page-title">락커 배치 관리</h1>
        <div class="breadcrumb">
          <span>관리자</span>
          <span class="separator">/</span>
          <span class="current">락커 배치</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showZoneModal = true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          구역 추가
        </button>
        <button class="btn-secondary" @click="showTypeModal = true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="9" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="2" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="9" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          락커 타입 관리
        </button>
      </div>
    </header>
    
    <main class="placement-main">
      <aside class="sidebar">
        <div class="view-toggle">
          <button 
            class="toggle-btn"
            :class="{ active: viewMode === 'floor' }" 
            @click="changeViewMode('floor')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="2" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="5" y="5" width="4" height="4" fill="currentColor"/>
              <rect x="11" y="5" width="4" height="4" fill="currentColor"/>
              <rect x="5" y="11" width="4" height="4" fill="currentColor"/>
              <rect x="11" y="11" width="4" height="4" fill="currentColor"/>
            </svg>
            평면 배치
          </button>
          <button 
            class="toggle-btn"
            :class="{ active: viewMode === 'front' }" 
            @click="changeViewMode('front')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="4" width="16" height="12" stroke="currentColor" stroke-width="2" fill="none"/>
              <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" stroke-width="1"/>
              <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1"/>
            </svg>
            정면 배치
          </button>
        </div>
        
        <div class="sidebar-section">
          <h3 class="section-title">락커 상태</h3>
          <div class="status-list">
            <div class="status-item">
              <span class="status-indicator available"></span>
              <span class="status-label">사용가능</span>
              <span class="status-count">{{ lockerStats.available }}</span>
            </div>
            <div class="status-item">
              <span class="status-indicator occupied"></span>
              <span class="status-label">사용중</span>
              <span class="status-count">{{ lockerStats.occupied }}</span>
            </div>
            <div class="status-item">
              <span class="status-indicator expired"></span>
              <span class="status-label">만료</span>
              <span class="status-count">{{ lockerStats.expired }}</span>
            </div>
            <div class="status-item">
              <span class="status-indicator maintenance"></span>
              <span class="status-label">정비중</span>
              <span class="status-count">{{ lockerStats.maintenance }}</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section" v-if="selectedLocker">
          <h3 class="section-title">선택된 락커</h3>
          <div class="locker-info">
            <div class="info-row">
              <span class="info-label">번호:</span>
              <span class="info-value">{{ selectedLocker.number }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">상태:</span>
              <span class="info-value">{{ getStatusText(selectedLocker.status) }}</span>
            </div>
            <div class="button-group">
              <button class="btn-small" @click="editLocker">편집</button>
              <button class="btn-small danger" @click="deleteLocker">삭제</button>
            </div>
          </div>
        </div>
      </aside>
      
      <section class="canvas-area">
        <LockerCanvas :view-mode="viewMode" />
      </section>
    </main>
    
    <!-- 구역 추가 모달 -->
    <ZoneModal 
      :is-open="showZoneModal"
      @close="showZoneModal = false"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLockerStore } from '@/stores/lockerStore'
import LockerCanvas from '@/components/locker/LockerCanvas.vue'
import ZoneModal from '@/components/modals/ZoneModal.vue'

const lockerStore = useLockerStore()

const viewMode = computed(() => lockerStore.viewMode)
const showZoneModal = ref(false)
const showTypeModal = ref(false)

const lockerStats = computed(() => lockerStore.lockersByStatus)
const selectedLocker = computed(() => lockerStore.selectedLocker)

const changeViewMode = (mode: 'floor' | 'front') => {
  lockerStore.setViewMode(mode)
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '사용가능',
    occupied: '사용중',
    expired: '만료',
    maintenance: '정비중'
  }
  return statusMap[status] || status
}

const editLocker = () => {
  // TODO: 락커 편집 모달 열기
  console.log('Edit locker:', selectedLocker.value)
}
const deleteLocker = () => {
  if (selectedLocker.value && confirm('정말 삭제하시겠습니까?')) {
    lockerStore.deleteLocker(selectedLocker.value.id)
  }
}
</script>

<style scoped>
.locker-placement {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-main);
}

/* === Header Styles === */
.placement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  background: var(--background-white);
  border-bottom: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.breadcrumb .separator {
  color: var(--border-default);
}

.breadcrumb .current {
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

/* === Main Layout === */.placement-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* === Sidebar Styles === */
.sidebar {
  width: var(--sidebar-width);
  background: var(--background-white);
  border-right: 1px solid var(--border-default);
  padding: var(--space-5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* View Toggle */
.view-toggle {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}

.toggle-btn {
  display: flex;
  align-items: center;  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.toggle-btn:hover {
  background: var(--background-white);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--primary-color);
  color: var(--text-white);
  box-shadow: var(--shadow-sm);
}

.toggle-btn.active svg {
  color: var(--text-white);
}

/* Sidebar Sections */
.sidebar-section {
  display: flex;  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

/* Status List */
.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.status-item {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.status-item:hover {
  background: var(--surface-elevated);  box-shadow: var(--shadow-sm);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.status-indicator.available {
  background: var(--locker-available);
  box-shadow: 0 0 0 3px var(--locker-available-bg);
}

.status-indicator.occupied {
  background: var(--locker-occupied);
  box-shadow: 0 0 0 3px var(--locker-occupied-bg);
}

.status-indicator.expired {
  background: var(--locker-expired);
  box-shadow: 0 0 0 3px var(--locker-expired-bg);
}

.status-indicator.maintenance {
  background: var(--locker-maintenance);
  box-shadow: 0 0 0 3px var(--locker-maintenance-bg);
}

.status-label {
  flex: 1;
  margin-left: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.status-count {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

/* Canvas Area */
.canvas-area {
  flex: 1;
  padding: var(--space-6);
  background: var(--background-main);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Locker Info */
.locker-info {
  padding: var(--space-4);
  background: var(--surface-sunken);  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.info-label {
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.info-value {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

/* Button Group */
.button-group {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.btn-small {
  padding: var(--space-1-5) var(--space-3);
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
}

.btn-small.danger {
  background: var(--color-error);
  color: var(--text-white);
}

.btn-small.danger:hover {
  background: #DC2626;
}
</style>
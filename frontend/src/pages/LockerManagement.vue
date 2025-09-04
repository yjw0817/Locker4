<template>
  <div class="locker-management">
    <div class="header">
      <h1>락커 관리</h1>
      <div class="header-actions">
        <router-link to="/locker-placement" class="btn btn-secondary">
          <i class="icon-layout"></i>
          락커 배치
        </router-link>
      </div>
    </div>

    <div class="management-container">
      <!-- 필터 섹션 -->
      <div class="filters-section">
        <div class="filter-group">
          <label>구역 선택</label>
          <select v-model="selectedZoneId" @change="loadLockers">
            <option value="">전체 구역</option>
            <option v-for="zone in zones" :key="zone.id" :value="zone.id">
              {{ zone.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>상태 필터</label>
          <select v-model="statusFilter" @change="applyFilters">
            <option value="">전체 상태</option>
            <option value="00">사용 가능</option>
            <option value="01">사용 중</option>
            <option value="02">유지보수</option>
            <option value="03">예약</option>
          </select>
        </div>

        <div class="filter-group">
          <label>검색</label>
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="applyFilters"
            placeholder="락커 번호 검색..."
          />
        </div>
      </div>

      <!-- 락커 목록 테이블 -->
      <div class="lockers-table-container">
        <table class="lockers-table">
          <thead>
            <tr>
              <th>락커 번호</th>
              <th>구역</th>
              <th>타입</th>
              <th>상태</th>
              <th>사용자</th>
              <th>시작일</th>
              <th>종료일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locker in filteredLockers" :key="locker.id">
              <td>{{ locker.number || locker.label }}</td>
              <td>{{ getZoneName(locker.zoneId) }}</td>
              <td>{{ locker.type }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(locker.status)]">
                  {{ getStatusText(locker.status) }}
                </span>
              </td>
              <td>{{ locker.userName || '-' }}</td>
              <td>{{ formatDate(locker.startDate) || '-' }}</td>
              <td>{{ formatDate(locker.endDate) || '-' }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="locker.status === '00'" 
                    @click="assignLocker(locker)"
                    class="btn btn-sm btn-primary"
                  >
                    배정
                  </button>
                  <button 
                    v-if="locker.status === '01'" 
                    @click="releaseLocker(locker)"
                    class="btn btn-sm btn-danger"
                  >
                    해제
                  </button>
                  <button 
                    @click="editLocker(locker)"
                    class="btn btn-sm btn-secondary"
                  >
                    수정
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredLockers.length === 0" class="no-data">
          검색 결과가 없습니다.
        </div>
      </div>

      <!-- 통계 섹션 -->
      <div class="statistics-section">
        <h2>락커 사용 통계</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">전체 락커</div>
            <div class="stat-value">{{ totalLockers }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">사용 가능</div>
            <div class="stat-value available">{{ availableCount }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">사용 중</div>
            <div class="stat-value occupied">{{ occupiedCount }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">사용률</div>
            <div class="stat-value">{{ usageRate }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 배정 모달 -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <h2>락커 배정</h2>
        <div class="form-group">
          <label>락커 번호</label>
          <input type="text" :value="selectedLocker?.number" disabled />
        </div>
        <div class="form-group">
          <label>사용자 이름</label>
          <input type="text" v-model="assignData.userName" placeholder="사용자 이름 입력" />
        </div>
        <div class="form-group">
          <label>시작일</label>
          <input type="date" v-model="assignData.startDate" />
        </div>
        <div class="form-group">
          <label>종료일</label>
          <input type="date" v-model="assignData.endDate" />
        </div>
        <div class="modal-buttons">
          <button class="btn btn-secondary" @click="closeAssignModal">취소</button>
          <button class="btn btn-primary" @click="confirmAssign">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLockerStore } from '@/stores/lockerStore'
import { loadZones, loadLockers as apiLoadLockers, updateLocker } from '@/api/locker'

// Store
const lockerStore = useLockerStore()

// State
const zones = ref([])
const lockers = ref([])
const selectedZoneId = ref('')
const statusFilter = ref('')
const searchQuery = ref('')
const showAssignModal = ref(false)
const selectedLocker = ref(null)
const assignData = ref({
  userName: '',
  startDate: '',
  endDate: ''
})

// Computed
const filteredLockers = computed(() => {
  let result = lockers.value
  
  if (statusFilter.value) {
    result = result.filter(l => l.status === statusFilter.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(l => 
      (l.number || l.label || '').toLowerCase().includes(query)
    )
  }
  
  return result
})

const totalLockers = computed(() => lockers.value.length)
const availableCount = computed(() => lockers.value.filter(l => l.status === '00').length)
const occupiedCount = computed(() => lockers.value.filter(l => l.status === '01').length)
const usageRate = computed(() => {
  if (totalLockers.value === 0) return 0
  return Math.round((occupiedCount.value / totalLockers.value) * 100)
})

// Methods
const loadZonesData = async () => {
  try {
    const data = await loadZones()
    zones.value = data
  } catch (error) {
    console.error('Failed to load zones:', error)
  }
}

const loadLockers = async () => {
  try {
    const params = selectedZoneId.value ? { zoneId: selectedZoneId.value } : {}
    const data = await apiLoadLockers(params)
    lockers.value = data.map(locker => ({
      ...locker,
      id: locker.LOCKR_CD,
      number: locker.LOCKR_NO || locker.LOCKR_LABEL,
      label: locker.LOCKR_LABEL,
      type: locker.LOCKR_TYPE_CD,
      status: locker.LOCKR_STAT,
      zoneId: locker.LOCKR_KND,
      userName: locker.USER_NAME,
      startDate: locker.START_DATE,
      endDate: locker.END_DATE
    }))
  } catch (error) {
    console.error('Failed to load lockers:', error)
  }
}

const applyFilters = () => {
  // Filters are applied through computed property
}

const getZoneName = (zoneId: string) => {
  const zone = zones.value.find(z => z.id === zoneId)
  return zone?.name || zoneId
}

const getStatusClass = (status: string) => {
  switch (status) {
    case '00': return 'status-available'
    case '01': return 'status-occupied'
    case '02': return 'status-maintenance'
    case '03': return 'status-reserved'
    default: return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case '00': return '사용 가능'
    case '01': return '사용 중'
    case '02': return '유지보수'
    case '03': return '예약'
    default: return '알 수 없음'
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR')
}

const assignLocker = (locker: any) => {
  selectedLocker.value = locker
  showAssignModal.value = true
  assignData.value = {
    userName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  }
}

const releaseLocker = async (locker: any) => {
  if (!confirm(`${locker.number} 락커를 해제하시겠습니까?`)) return
  
  try {
    await updateLocker(locker.id, {
      LOCKR_STAT: '00',
      USER_NAME: null,
      START_DATE: null,
      END_DATE: null
    })
    await loadLockers()
    alert('락커가 해제되었습니다.')
  } catch (error) {
    console.error('Failed to release locker:', error)
    alert('락커 해제에 실패했습니다.')
  }
}

const editLocker = (locker: any) => {
  // TODO: Implement edit functionality
  console.log('Edit locker:', locker)
  alert('수정 기능은 준비 중입니다.')
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedLocker.value = null
  assignData.value = {
    userName: '',
    startDate: '',
    endDate: ''
  }
}

const confirmAssign = async () => {
  if (!assignData.value.userName) {
    alert('사용자 이름을 입력해주세요.')
    return
  }
  
  try {
    await updateLocker(selectedLocker.value.id, {
      LOCKR_STAT: '01',
      USER_NAME: assignData.value.userName,
      START_DATE: assignData.value.startDate,
      END_DATE: assignData.value.endDate
    })
    await loadLockers()
    closeAssignModal()
    alert('락커가 배정되었습니다.')
  } catch (error) {
    console.error('Failed to assign locker:', error)
    alert('락커 배정에 실패했습니다.')
  }
}

// Lifecycle
onMounted(async () => {
  await loadZonesData()
  await loadLockers()
})
</script>

<style scoped>
.locker-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.management-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Filters */
.filters-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

/* Table */
.lockers-table-container {
  overflow-x: auto;
  margin-bottom: 30px;
}

.lockers-table {
  width: 100%;
  border-collapse: collapse;
}

.lockers-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.lockers-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
}

.lockers-table tr:hover {
  background: #f9f9f9;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-available {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-occupied {
  background: #ffebee;
  color: #c62828;
}

.status-maintenance {
  background: #fff3e0;
  color: #ef6c00;
}

.status-reserved {
  background: #e3f2fd;
  color: #1565c0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 5px;
}

/* Statistics */
.statistics-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.statistics-section h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.available {
  color: #2e7d32;
}

.stat-value.occupied {
  color: #c62828;
}

/* Modal */
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:disabled {
  background: #f5f5f5;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-secondary:hover {
  background: #616161;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>
<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <span class="locker-number">{{ lockerNumber }}번</span>
        <span class="modal-title">락커배정</span>
        <button @click="close" class="close-button">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- User Info or Search -->
        <div v-if="!hasAssignedUser" class="member-search-section">
          <label class="search-label">회원 조회</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="회원명 또는 전화번호로 검색"
              class="search-input"
            />
            <button @click="searchMembers" class="search-button">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M10 10L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="member in searchResults" 
              :key="member.id"
              @click="selectMember(member)"
              class="search-result-item"
            >
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-phone">{{ member.phone }}</div>
              </div>
              <div class="member-vouchers">
                <span class="member-id">{{ member.memberId }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Assigned User Info -->
        <div v-else class="user-info">
          <div class="user-avatar">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="29" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="2"/>
              <circle cx="30" cy="20" r="8" fill="#9CA3AF"/>
              <path d="M15 45C15 37.268 21.268 31 29 31H31C38.732 31 45 37.268 45 45V50H15V45Z" fill="#9CA3AF"/>
            </svg>
          </div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-phone">{{ userPhone }}</div>
          </div>
          <button @click="clearMember" class="clear-member-btn">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Date Selection -->
        <div class="date-section">
          <label class="date-label">기간 설정</label>
          <div class="date-inputs">
            <div class="date-input-wrapper">
              <input 
                type="date" 
                v-model="startDate"
                class="date-input"
                :min="todayDate"
              />
            </div>
            <span class="date-separator">-</span>
            <div class="date-input-wrapper">
              <input 
                type="date" 
                v-model="endDate"
                class="date-input"
                :min="startDate || todayDate"
              />
            </div>
          </div>
        </div>

        <!-- Usage Authority -->
        <div v-if="hasAssignedUser" class="usage-section">
          <label class="usage-label">연동할 이용권</label>
          <div class="usage-select-wrapper">
            <select v-model="selectedUsage" class="usage-select" :disabled="!memberVouchers.length">
              <option v-if="!memberVouchers.length" value="">이용권이 없습니다</option>
              <option 
                v-for="voucher in memberVouchers" 
                :key="voucher.id" 
                :value="voucher.id"
              >
                {{ voucher.displayName }} &nbsp;&nbsp;→&nbsp;&nbsp; {{ voucher.remainingDays }}일 남음
              </option>
            </select>
            <svg class="select-arrow" width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 5L6 8L9 5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
        </div>

        <!-- Memo Section -->
        <div class="memo-section">
          <label class="memo-label">메모</label>
          <textarea 
            v-model="lockerMemo"
            placeholder="락커 사용에 대한 메모를 입력하세요"
            class="memo-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="handleAssignToRandom" class="btn-random">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 6px">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 4V8L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          락커 사용 종료
        </button>
        <div class="action-buttons">
          <button @click="close" class="btn-cancel">취소</button>
          <button @click="handleAssign" class="btn-confirm">수정 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  lockerNumber: string
  lockerData?: any
}

interface Member {
  id: string
  name: string
  phone: string
  vouchers?: Voucher[]
}

interface Voucher {
  id: string
  name: string
  remainingDays: number
  type: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'confirm'])

// Form data
const userName = ref('')
const userPhone = ref('')
const startDate = ref('')
const endDate = ref('')
const selectedUsage = ref('')
const lockerMemo = ref('')

// Member search
const searchQuery = ref('')
const searchResults = ref<Member[]>([])
const selectedMember = ref<Member | null>(null)
const memberVouchers = ref<Voucher[]>([])

// Computed
const hasAssignedUser = computed(() => {
  return !!userName.value && !!userPhone.value
})

// Computed
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Methods
const close = () => {
  emit('close')
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

const handleAssign = () => {
  const assignmentData = {
    userName: userName.value,
    userPhone: userPhone.value,
    startDate: startDate.value,
    endDate: endDate.value,
    usage: selectedUsage.value,
    memo: lockerMemo.value
  }
  emit('confirm', assignmentData)
  close()
}

const handleAssignToRandom = () => {
  // 락커 사용 종료 로직
  console.log('락커 사용 종료')
  close()
}

// Member search methods
const handleSearch = () => {
  // 실시간 검색을 위한 디바운싱 처리 필요
  if (searchQuery.value.length >= 2) {
    searchMembers()
  }
}

const searchMembers = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  try {
    const response = await fetch(`http://localhost:3333/api/members/search?query=${encodeURIComponent(searchQuery.value)}`)
    if (!response.ok) throw new Error('검색 실패')
    
    const members = await response.json()
    searchResults.value = members.map(member => ({
      id: member.id,
      memberId: member.memberId,
      name: member.name,
      phone: member.phone,
      gender: member.gender
    }))
  } catch (error) {
    console.error('회원 검색 오류:', error)
    searchResults.value = []
  }
}

const selectMember = async (member: any) => {
  selectedMember.value = member
  userName.value = member.name
  userPhone.value = member.phone
  searchResults.value = []
  searchQuery.value = ''
  
  // 선택된 회원의 이용권 조회
  try {
    const response = await fetch(`http://localhost:3333/api/members/${member.id}/vouchers`)
    if (!response.ok) throw new Error('이용권 조회 실패')
    
    const vouchers = await response.json()
    memberVouchers.value = vouchers
    
    // 이용권이 있으면 첫 번째 이용권 자동 선택
    if (memberVouchers.value.length > 0) {
      selectedUsage.value = memberVouchers.value[0].id
    }
  } catch (error) {
    console.error('이용권 조회 오류:', error)
    memberVouchers.value = []
  }
}

const clearMember = () => {
  userName.value = ''
  userPhone.value = ''
  selectedMember.value = null
  memberVouchers.value = []
  selectedUsage.value = ''
  startDate.value = ''
  endDate.value = ''
}

// Watch for locker data changes
watch(() => props.lockerData, (newData) => {
  if (newData) {
    // Update form with existing locker data if available
    if (newData.userName) userName.value = newData.userName
    if (newData.userPhone) userPhone.value = newData.userPhone
    if (newData.startDate) startDate.value = newData.startDate
    if (newData.endDate) endDate.value = newData.endDate
    if (newData.usage) selectedUsage.value = newData.usage
    if (newData.memo) lockerMemo.value = newData.memo
    
    // 회원 정보가 있으면 이용권 조회
    if (newData.memberId) {
      // TODO: API로 회원 이용권 조회
    }
  } else {
    // 초기값 설정
    const today = new Date()
    startDate.value = today.toISOString().split('T')[0]
    const endDateCalc = new Date(today)
    endDateCalc.setMonth(endDateCalc.getMonth() + 1)
    endDate.value = endDateCalc.toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  position: relative;
}

.locker-number {
  background: #E0E7FF;
  color: #4C1D95;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-button {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #F3F4F6;
  color: #374151;
}

/* Body */
.modal-body {
  padding: 24px;
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 14px;
  color: #6B7280;
}

/* Date Section */
.date-section {
  margin-bottom: 20px;
}

.date-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input-wrapper {
  flex: 1;
}

.date-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.date-separator {
  color: #6B7280;
  font-weight: 500;
}

/* Usage Section */
.usage-section {
  margin-bottom: 20px;
}

.usage-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.usage-select-wrapper {
  position: relative;
}

.usage-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}

.usage-select:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Member Search Section */
.member-search-section {
  margin-bottom: 20px;
}

.search-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.search-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-button {
  padding: 10px 14px;
  background: #6366F1;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover {
  background: #4F46E5;
}

.search-results {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: white;
}

.search-result-item {
  padding: 12px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #F9FAFB;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
}

.member-phone {
  font-size: 12px;
  color: #6B7280;
}

.member-vouchers {
  margin-left: 12px;
}

.voucher-count {
  font-size: 12px;
  color: #6366F1;
  font-weight: 500;
  background: #EEF2FF;
  padding: 4px 8px;
  border-radius: 4px;
}

.member-id {
  font-size: 12px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 8px;
  border-radius: 4px;
}

/* User Info with Clear Button */
.user-info {
  position: relative;
}

.clear-member-btn {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-member-btn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
  color: #EF4444;
}

/* Memo Section */
.memo-section {
  margin-bottom: 20px;
}

.memo-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.memo-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}

.memo-textarea:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.memo-textarea::placeholder {
  color: #9CA3AF;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.btn-random {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: white;
  border: 1px solid #EF4444;
  color: #EF4444;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-random:hover {
  background: #FEF2F2;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 10px 24px;
  background: white;
  border: 1px solid #D1D5DB;
  color: #374151;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #F9FAFB;
}

.btn-confirm {
  padding: 10px 24px;
  background: #4F46E5;
  border: none;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #4338CA;
}
</style>
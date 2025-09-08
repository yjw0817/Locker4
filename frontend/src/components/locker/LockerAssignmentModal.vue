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
        <!-- User Info -->
        <div class="user-info">
          <div class="user-avatar">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="29" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="2"/>
              <circle cx="30" cy="20" r="8" fill="#9CA3AF"/>
              <path d="M15 45C15 37.268 21.268 31 29 31H31C38.732 31 45 37.268 45 45V50H15V45Z" fill="#9CA3AF"/>
            </svg>
          </div>
          <div class="user-details">
            <div class="user-name">{{ userName || '박민영' }}</div>
            <div class="user-phone">{{ userPhone || '010-2244-8554' }}</div>
          </div>
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
        <div class="usage-section">
          <label class="usage-label">연동할 이용권</label>
          <div class="usage-select-wrapper">
            <select v-model="selectedUsage" class="usage-select">
              <option value="3months">학기 3개월 &nbsp;&nbsp;→&nbsp;&nbsp; 35번 (남자 락커)</option>
              <option value="6months">학기 6개월 &nbsp;&nbsp;→&nbsp;&nbsp; 70번 (남자 락커)</option>
              <option value="1year">연간 이용권 &nbsp;&nbsp;→&nbsp;&nbsp; 140번 (남자 락커)</option>
            </select>
            <svg class="select-arrow" width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 5L6 8L9 5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
        </div>

        <!-- Notice -->
        <div class="notice-box">
          <div class="notice-title">락커 배정</div>
          <div class="notice-text">입력된 내용이 없어요.</div>
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

const props = defineProps<Props>()
const emit = defineEmits(['close', 'confirm'])

// Form data
const userName = ref('박민영')
const userPhone = ref('010-2244-8554')
const startDate = ref('2025-07-10')
const endDate = ref('2025-08-09')
const selectedUsage = ref('3months')

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
    usage: selectedUsage.value
  }
  emit('confirm', assignmentData)
  close()
}

const handleAssignToRandom = () => {
  // 락커 사용 종료 로직
  console.log('락커 사용 종료')
  close()
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

/* Notice Box */
.notice-box {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.notice-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  margin-bottom: 4px;
}

.notice-text {
  font-size: 13px;
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
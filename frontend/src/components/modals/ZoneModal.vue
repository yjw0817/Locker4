<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">구역 추가</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="zone-name" class="form-label">구역 이름</label>
          <input
            id="zone-name"
            v-model="zoneName"
            type="text"
            class="form-input"
            placeholder="예: 남자 탈의실"
            @keyup.enter="handleSave"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">구역 색상 (선택)</label>
          <div class="color-options">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :class="{ selected: selectedColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            />
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">
          취소
        </button>
        <button class="btn-save" @click="handleSave" :disabled="!zoneName">
          추가
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  save: [data: { name: string; color?: string }]
}>()

const zoneName = ref('')
const selectedColor = ref('#f0f9ff')

const colorOptions = [
  '#f0f9ff', // 연한 파랑
  '#fef3c7', // 연한 노랑  
  '#fee2e2', // 연한 빨강
  '#d1fae5', // 연한 초록
  '#f3e8ff', // 연한 보라
  '#fce7f3', // 연한 분홍
]

const handleSave = () => {
  if (!zoneName.value.trim()) {
    alert('구역 이름을 입력해주세요.')
    return
  }
  
  emit('save', {
    name: zoneName.value.trim(),
    color: selectedColor.value
  })
}
</script>

<style scoped>
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

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(34, 132, 244, 0.1);
}

.color-options {
  display: flex;
  gap: 12px;
}

.color-option {
  width: 48px;
  height: 48px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(34, 132, 244, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 8px 20px;
  background: white;
  color: var(--text-primary);
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-save {
  padding: 8px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
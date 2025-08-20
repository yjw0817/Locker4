<template>
  <div class="modal-overlay">
    <div class="modal-content" @keydown.stop @keyup.stop>
      <div class="modal-header">
        <h2>락커 등록</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Locker Type Name -->
        <div class="form-group">
          <label>락커 타입 이름</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="예: 소형, 중형, 대형"
            required
          />
        </div>
        
        <!-- Dimensions -->
        <div class="form-row">
          <div class="form-group">
            <label>가로 (Width)</label>
            <input 
              v-model.number="formData.width" 
              type="number" 
              min="20" 
              max="200"
              placeholder="cm"
              required
            />
          </div>
          
          <div class="form-group">
            <label>깊이 (Depth)</label>
            <input 
              v-model.number="formData.depth" 
              type="number" 
              min="20" 
              max="200"
              placeholder="cm"
              required
            />
          </div>
          
          <div class="form-group">
            <label>높이 (Height)</label>
            <input 
              v-model.number="formData.height" 
              type="number" 
              min="20" 
              max="300"
              placeholder="cm"
              required
            />
          </div>
        </div>
        
        <!-- Additional Info -->
        <div class="form-group">
          <label>설명 (선택)</label>
          <textarea 
            v-model="formData.description" 
            rows="3"
            placeholder="락커 타입에 대한 설명"
            @keydown="(e) => {
              console.log('[Modal Textarea] Keydown:', e.key, e.keyCode);
              if (e.key === 'Backspace') {
                console.log('[Modal Textarea] Backspace pressed - should work normally');
              }
            }"
          ></textarea>
        </div>
        
        <!-- Color (optional) -->
        <div class="form-group">
          <label>색상 구분</label>
          <select v-model="formData.color">
            <option value="#4A90E2">파란색</option>
            <option value="#7ED321">초록색</option>
            <option value="#F5A623">주황색</option>
            <option value="#BD10E0">보라색</option>
            <option value="#9013FE">남색</option>
          </select>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">취소</button>
        <button class="btn-save" @click="handleSave">등록</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

const formData = ref({
  name: '',
  width: 40,
  depth: 40,
  height: 60,
  description: '',
  color: '#4A90E2'
})

const handleSave = () => {
  if (!formData.value.name || !formData.value.width || !formData.value.height || !formData.value.depth) {
    alert('필수 정보를 입력해주세요')
    return
  }
  
  emit('save', { ...formData.value })
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-save {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-save:hover {
  background: #2563eb;
}
</style>
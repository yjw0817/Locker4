<template>
  <div class="locker-assignment">
    <header class="assignment-header">
      <h1>락커 배정 관리</h1>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">전체</span>
          <span class="stat-value">120</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">사용중</span>
          <span class="stat-value">85</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">사용가능</span>
          <span class="stat-value">35</span>
        </div>
      </div>
    </header>
    
    <main class="assignment-main">
      <section class="locker-view">
        <div class="locker-grid">
          <div v-for="i in 20" :key="i" class="locker-item" :class="getLockerClass(i)">
            <span class="locker-number">{{ i }}</span>
          </div>
        </div>
      </section>
      
      <aside class="assignment-sidebar">
        <div class="assignment-form">
          <h3>락커 배정</h3>
          <p>락커를 선택하여 배정하세요</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
const getLockerClass = (index: number) => {
  if (index % 3 === 0) return 'occupied'
  if (index % 5 === 0) return 'expired'
  return 'available'
}
</script>

<style scoped>
.locker-assignment {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.assignment-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.assignment-header h1 {
  font-size: var(--text-xl);
  font-weight: 600;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.assignment-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.locker-view {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.locker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.locker-item {
  aspect-ratio: 3/4;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.locker-item.available {
  background: var(--locker-available);
}

.locker-item.occupied {
  background: var(--locker-occupied);
}

.locker-item.expired {
  background: var(--locker-expired);
}

.locker-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.locker-number {
  font-size: var(--text-lg);
  font-weight: 600;
}

.assignment-sidebar {
  width: 300px;
  background: var(--surface-color);
  border-left: 1px solid var(--border-color);
  padding: 24px;
}

.assignment-form h3 {
  font-size: var(--text-lg);
  margin-bottom: 8px;
}

.assignment-form p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}
</style>
<template>
  <div class="test-page">
    <h1>Test Page</h1>
    <p>Store loaded: {{ storeLoaded ? 'Yes' : 'No' }}</p>
    <p>Zones: {{ zones.length }}</p>
    <p>Lockers: {{ lockers.length }}</p>
    <button @click="initData">Initialize Test Data</button>
    
    <div v-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <div class="lockers">
      <div v-for="locker in lockers" :key="locker.id" class="locker">
        {{ locker.LOCKR_LABEL || locker.number }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLockerStore } from '@/stores/lockerStoreV2'

const error = ref<string | null>(null)
const storeLoaded = ref(false)

const lockerStore = useLockerStore()
storeLoaded.value = true

const zones = computed(() => lockerStore.zones)
const lockers = computed(() => lockerStore.lockers)

const initData = () => {
  try {
    lockerStore.initTestData()
    console.log('Test data initialized')
  } catch (e: any) {
    error.value = e.message
    console.error('Error initializing test data:', e)
  }
}

onMounted(() => {
  console.log('Test page mounted')
  if (lockerStore.zones.length === 0) {
    initData()
  }
})
</script>

<style scoped>
.test-page {
  padding: 20px;
}

.error {
  color: red;
  padding: 10px;
  background: #fee;
  border-radius: 4px;
  margin: 10px 0;
}

.lockers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.locker {
  padding: 10px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
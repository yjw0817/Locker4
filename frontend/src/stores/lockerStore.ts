import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { lockerApi } from '@/services/lockerApi'

export type LockerStatus = 'available' | 'occupied' | 'expired' | 'maintenance'
export type ViewMode = 'floor' | 'front'
export type PlacementMode = 'flat' | 'vertical' // 평면배치 | 세로배치

export interface Locker {
  id: string
  number: string  // Floor placement number (zone management) - maps to LOCKR_LABEL
  x: number
  y: number
  width: number  // 가로 (공통)
  height: number // 세로배치에서 Y축 (세로 높이)
  depth: number  // 평면배치에서 Y축 (깊이)
  status: LockerStatus
  rotation: number  // Cumulative rotation value (not normalized)
  floor?: number
  zoneId: string
  typeId: string
  
  // Database fields
  lockrCd?: number              // Maps to LOCKR_CD (primary key)
  compCd?: string               // Company code (COMP_CD)
  bcoffCd?: string              // Branch office code (BCOFF_CD)
  lockrLabel?: string           // Floor view number (LOCKR_LABEL) - e.g., "A-01"
  lockrNo?: number              // Front view number (LOCKR_NO) - e.g., 101, 102
  lockrKnd?: string             // Locker kind/zone (LOCKR_KND)
  lockrTypeCd?: string          // Locker type code (LOCKR_TYPE_CD)
  doorDirection?: string        // Door direction (DOOR_DIRECTION)
  groupNum?: number             // Group number for front view (GROUP_NUM)
  lockrGendrSet?: string        // Gender setting (LOCKR_GENDR_SET)
  
  // Parent-child relationship
  parentLockerId?: string | null     // null = parent locker
  parentLockrCd?: number | null      // Database parent reference (PARENT_LOCKR_CD)
  childLockerIds?: string[]          // IDs of child lockers
  tierLevel?: number                 // 0 = parent, 1+ = child tiers (TIER_LEVEL)
  
  // Front view specific
  frontViewX?: number                // X position in front view (FRONT_VIEW_X)
  frontViewY?: number                // Y position in front view (FRONT_VIEW_Y)
  frontViewNumber?: string           // Assignment number for front view
  actualHeight?: number              // Actual height for front view rendering
  
  // Member assignment
  memSno?: string               // Member serial number (MEM_SNO)
  memNm?: string                // Member name (MEM_NM)
  lockrUseSDate?: string        // Usage start date (LOCKR_USE_S_DATE)
  lockrUseEDate?: string        // Usage end date (LOCKR_USE_E_DATE)
  lockrStat?: string            // Status code (LOCKR_STAT) - '00', '01', etc.
  buyEventSno?: string          // Purchase event serial (BUY_EVENT_SNO)
  
  // Visibility control
  isVisible?: boolean                // Control visibility in floor view
  isAnimating?: boolean              // Animation state flag
  hasError?: boolean                 // Error state flag
  
  // Assignment info (legacy support)
  assignedTo?: {
    name: string
    expiryDate: Date
  }
  memberInfo?: any                   // Future: member assignment info
  lockerState?: string               // Future: in-use, empty, broken, etc.
  
  // Metadata
  memo?: string                 // Additional notes (MEMO)
  updateBy?: string             // Last updated by (UPDATE_BY)
  updateDt?: Date | string      // Last update timestamp (UPDATE_DT)
}

export interface LockerZone {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color?: string
}

export interface LockerType {
  id: string
  name: string
  width: number
  depth: number  // Add depth for floor view
  height: number
  color: string
  icon?: string
}

export const useLockerStore = defineStore('locker', () => {
  // State
  const lockers = ref<Locker[]>([])
  const zones = ref<LockerZone[]>([])
  const lockerTypes = ref<LockerType[]>([
    { id: '1', name: '소형', width: 40, depth: 40, height: 40, color: '#3b82f6' },
    { id: '2', name: '중형', width: 50, depth: 50, height: 60, color: '#10b981' },
    { id: '3', name: '대형', width: 60, depth: 60, height: 80, color: '#f59e0b' }
  ])
  const selectedLockerId = ref<string | null>(null)
  const viewMode = ref<ViewMode>('floor')
  const placementMode = ref<PlacementMode>('flat') // 평면배치가 기본
  const currentFloor = ref(1)
  
  // Undo/Redo를 위한 히스토리
  const history = ref<Locker[][]>([])
  const historyIndex = ref(-1)
  
  // Database integration flags
  const isOnlineMode = ref(true) // Toggle between local and DB mode - default to online
  const isSyncing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const connectionStatus = ref<'connected' | 'disconnected' | 'error'>('disconnected')

  // Computed
  const selectedLocker = computed(() => 
    lockers.value.find(l => l.id === selectedLockerId.value)
  )

  const lockersByStatus = computed(() => {
    const counts = {
      total: lockers.value.length,
      available: 0,
      occupied: 0,
      expired: 0,
      maintenance: 0
    }
    
    lockers.value.forEach(locker => {
      counts[locker.status]++
    })
    
    return counts
  })

  const currentFloorLockers = computed(() => 
    lockers.value.filter(l => l.floor === currentFloor.value || !l.floor)
  )

  // 히스토리 저장 함수
  const saveHistory = () => {
    // 현재 위치 이후의 히스토리는 삭제
    history.value = history.value.slice(0, historyIndex.value + 1)
    // 새로운 상태 추가
    history.value.push(JSON.parse(JSON.stringify(lockers.value)))
    historyIndex.value++
    // 최대 50개까지만 저장
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  // Actions
  const addLocker = async (locker: Omit<Locker, 'id'>) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newLocker: Locker = {
      ...locker,
      rotation: locker.rotation || 0, // 기본값 0 설정
      id: tempId
    }
    
    saveHistory()
    lockers.value.push(newLocker)
    console.log('[Store] Added locker with rotation:', newLocker.rotation)
    
    // If online mode, try to save to database
    if (isOnlineMode.value) {
      isSyncing.value = true
      try {
        const savedLocker = await lockerApi.saveLocker(newLocker)
        if (savedLocker) {
          // Replace temp locker with saved one
          const index = lockers.value.findIndex(l => l.id === tempId)
          if (index !== -1) {
            lockers.value[index] = savedLocker
          }
          console.log('[Store] Locker saved to database:', savedLocker.id)
        } else {
          console.warn('[Store] Failed to save to database, keeping local copy')
        }
      } catch (error) {
        console.error('[Store] Database save error:', error)
      } finally {
        isSyncing.value = false
      }
    }
    
    return newLocker
  }

  const updateLocker = async (id: string, updates: Partial<Locker>) => {
    const index = lockers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      saveHistory()
      
      // rotation이 NaN이면 기존 값 유지 또는 0으로 설정
      if ('rotation' in updates && (isNaN(updates.rotation!) || updates.rotation === undefined)) {
        console.warn('[Store] Invalid rotation value, using existing or 0')
        updates.rotation = lockers.value[index].rotation || 0
      }
      
      lockers.value[index] = { ...lockers.value[index], ...updates }
      // 선택된 락커가 업데이트되면 selectedLocker computed도 자동 갱신됨
      console.log(`[Store] Updated locker ${id}:`, updates)
      
      // If online mode, sync to database
      if (isOnlineMode.value && !id.includes('temp')) {
        isSyncing.value = true
        try {
          const savedLocker = await lockerApi.saveLocker(lockers.value[index])
          if (!savedLocker) {
            console.warn('[Store] Failed to sync update to database')
          }
        } catch (error) {
          console.error('[Store] Database update error:', error)
        } finally {
          isSyncing.value = false
        }
      }
      
      return lockers.value[index]
    }
    return null
  }

  // ID로 락커 찾기
  const getLockerById = (id: string) => {
    return lockers.value.find(l => l.id === id) || null
  }

  const deleteLocker = async (id: string) => {
    const index = lockers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      saveHistory()
      lockers.value.splice(index, 1)
      
      // If online mode, delete from database
      if (isOnlineMode.value && !id.includes('temp')) {
        isSyncing.value = true
        try {
          const success = await lockerApi.deleteLocker(id)
          if (!success) {
            console.warn('[Store] Failed to delete from database')
          }
        } catch (error) {
          console.error('[Store] Database delete error:', error)
        } finally {
          isSyncing.value = false
        }
      }
    }
  }
  
  // Undo 기능
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      lockers.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }
  
  // Redo 기능
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      lockers.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  const selectLocker = (id: string | null) => {
    selectedLockerId.value = id
  }

  const addZone = (zone: Omit<LockerZone, 'id'>) => {
    const newZone: LockerZone = {
      ...zone,
      id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    zones.value.push(newZone)
    return newZone
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }
  
  const setPlacementMode = (mode: PlacementMode) => {
    placementMode.value = mode
    console.log(`[Store] Placement mode changed to: ${mode}`)
  }

  const setCurrentFloor = (floor: number) => {
    currentFloor.value = floor
  }

  // 회전된 바운딩 박스 계산
  const getRotatedBounds = (locker: Locker) => {
    // 회전 각도를 라디안으로 변환
    const rad = ((locker.rotation || 0) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    
    // 중심점
    const cx = locker.x + locker.width / 2
    const cy = locker.y + locker.height / 2
    
    // 네 모서리 (중심점 기준 상대 좌표)
    const corners = [
      { x: -locker.width / 2, y: -locker.height / 2 },
      { x: locker.width / 2, y: -locker.height / 2 },
      { x: locker.width / 2, y: locker.height / 2 },
      { x: -locker.width / 2, y: locker.height / 2 }
    ]
    
    // 회전 변환 적용
    const rotated = corners.map(c => ({
      x: c.x * cos - c.y * sin + cx,
      y: c.x * sin + c.y * cos + cy
    }))
    
    // 바운딩 박스 계산
    const xs = rotated.map(p => p.x)
    const ys = rotated.map(p => p.y)
    
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    }
  }

  // 충돌 체크 함수 (회전 시 더 관대한 버전)
  const checkCollision = (newLocker: Partial<Locker> & { x: number; y: number; width: number; height: number }, excludeId?: string, zoneId?: string, isRotating: boolean = false): boolean => {
    const targetZoneId = zoneId || newLocker.zoneId
    const zoneLockers = lockers.value.filter(l => l.zoneId === targetZoneId)
    
    // 회전 시에는 약간의 여유 공간 허용 (1px)
    const tolerance = isRotating ? 1 : 0
    
    for (const locker of zoneLockers) {
      if (locker.id === excludeId || locker.id === newLocker.id) continue
      
      // 회전을 고려한 바운딩 박스 계산
      const bounds1 = getRotatedBounds({ ...newLocker, rotation: newLocker.rotation || 0 } as Locker)
      const bounds2 = getRotatedBounds(locker)
      
      // 디버깅: 회전 시 바운딩 박스 로그
      if (isRotating) {
        console.log(`[Rotation Collision Check]`, {
          rotating: { 
            id: newLocker.id || excludeId,
            bounds: bounds1,
            rotation: newLocker.rotation 
          },
          checking: { 
            id: locker.id,
            bounds: bounds2,
            rotation: locker.rotation 
          }
        })
      }
      
      // AABB 충돌 체크 (회전 시 tolerance 적용)
      // 실제로 겹치는 부분이 tolerance보다 큰 경우만 충돌로 판단
      const overlapLeft = Math.max(bounds1.left, bounds2.left)
      const overlapRight = Math.min(bounds1.right, bounds2.right)
      const overlapTop = Math.max(bounds1.top, bounds2.top)
      const overlapBottom = Math.min(bounds1.bottom, bounds2.bottom)
      
      const overlapWidth = overlapRight - overlapLeft
      const overlapHeight = overlapBottom - overlapTop
      
      // 겹침이 있고, 그 크기가 tolerance보다 큰 경우만 충돌
      if (overlapWidth > tolerance && overlapHeight > tolerance) {
        console.log(`[Collision] Detected overlap:`, {
          overlapWidth,
          overlapHeight,
          tolerance,
          isRotating
        })
        return true // 충돌 발생
      }
    }
    return false
  }

  // 테스트용 초기 데이터 생성
  const initTestData = () => {
    // 구역 생성
    zones.value = [
      { id: 'zone-1', name: '남자 탈의실', x: 0, y: 0, width: 800, height: 600, color: '#f0f9ff' },
      { id: 'zone-2', name: '여자 탈의실', x: 0, y: 0, width: 800, height: 600, color: '#fef3c7' },
      { id: 'zone-3', name: '혼용 탈의실', x: 0, y: 0, width: 800, height: 600, color: '#fee2e2' }
    ]

    // 락커 크기 통일 (소형: 40x40)
    const lockerSize = 40
    
    // 각 구역에 몇 개의 락커 생성 - 정확히 붙어있도록 배치
    const demoLockers = [
      // 남자 탈의실 락커들 - 정확히 붙어있도록 배치
      { id: 'L1', zoneId: 'zone-1', x: 40, y: 100, status: 'available' as LockerStatus },
      { id: 'L2', zoneId: 'zone-1', x: 80, y: 100, status: 'occupied' as LockerStatus },   // 40 + 40 = 80
      { id: 'L3', zoneId: 'zone-1', x: 120, y: 100, status: 'available' as LockerStatus }, // 80 + 40 = 120
      { id: 'L4', zoneId: 'zone-1', x: 40, y: 140, status: 'expired' as LockerStatus },    // y: 100 + 40 = 140
      { id: 'L5', zoneId: 'zone-1', x: 80, y: 140, status: 'maintenance' as LockerStatus },// 40 + 40 = 80, y: 140
      
      // 여자 탈의실 락커들 - 정확히 붙어있도록 배치
      { id: 'L6', zoneId: 'zone-2', x: 40, y: 100, status: 'available' as LockerStatus },
      { id: 'L7', zoneId: 'zone-2', x: 80, y: 100, status: 'occupied' as LockerStatus },   // 40 + 40 = 80
      { id: 'L8', zoneId: 'zone-2', x: 120, y: 100, status: 'available' as LockerStatus }, // 80 + 40 = 120
      
      // 혼용 탈의실 락커들 - 정확히 붙어있도록 배치
      { id: 'L9', zoneId: 'zone-3', x: 40, y: 100, status: 'available' as LockerStatus },
      { id: 'L10', zoneId: 'zone-3', x: 80, y: 100, status: 'occupied' as LockerStatus }   // 40 + 40 = 80
    ]

    // 락커 생성 시 크기 통일
    demoLockers.forEach((demo, i) => {
      lockers.value.push({
        id: `locker-${i}`,
        number: demo.id,
        x: demo.x,
        y: demo.y,
        width: lockerSize,   // 소형 크기로 통일 (40)
        depth: lockerSize,   // 소형 크기로 통일 (40)
        height: lockerSize,  // 소형 크기로 통일 (40)
        status: demo.status,
        rotation: 0,
        zoneId: demo.zoneId,
        typeId: '1'  // 소형 타입
      })
    })
    console.log('[Store] Test data initialized with adjacent lockers (no gaps)')
  }

  // Database integration methods
  const loadLockersFromDatabase = async () => {
    if (!isOnlineMode.value) return
    
    isSyncing.value = true
    try {
      const dbLockers = await lockerApi.getAllLockers()
      if (dbLockers.length > 0) {
        lockers.value = dbLockers
        lastSyncTime.value = new Date()
        connectionStatus.value = 'connected'
        console.log(`[Store] Loaded ${dbLockers.length} lockers from database`)
      } else {
        console.log('[Store] No lockers found in database')
        connectionStatus.value = 'connected'
      }
    } catch (error) {
      console.error('[Store] Failed to load from database:', error)
      connectionStatus.value = 'error'
    } finally {
      isSyncing.value = false
    }
  }
  
  const toggleOnlineMode = async (enabled: boolean): Promise<boolean> => {
    isOnlineMode.value = enabled
    
    if (enabled) {
      // Test connection first
      const isConnected = await lockerApi.testConnection()
      if (isConnected) {
        connectionStatus.value = 'connected'
        // When enabling online mode, load from database
        await loadLockersFromDatabase()
        return true
      } else {
        connectionStatus.value = 'error'
        isOnlineMode.value = false
        console.error('[Store] Cannot connect to database')
        return false
      }
    } else {
      // When disabling, keep current local data
      connectionStatus.value = 'disconnected'
      console.log('[Store] Switched to offline mode')
      return true
    }
  }
  
  const syncToDatabase = async () => {
    if (!isOnlineMode.value) return
    
    isSyncing.value = true
    try {
      const successCount = await lockerApi.batchSaveLockers(lockers.value)
      console.log(`[Store] Synced ${successCount}/${lockers.value.length} lockers`)
      lastSyncTime.value = new Date()
    } catch (error) {
      console.error('[Store] Sync failed:', error)
    } finally {
      isSyncing.value = false
    }
  }

  return {
    // State
    lockers,
    zones,
    lockerTypes,
    selectedLockerId,
    viewMode,
    placementMode,
    currentFloor,
    
    // Computed
    selectedLocker,
    lockersByStatus,
    currentFloorLockers,
    
    // Actions
    addLocker,
    updateLocker,
    deleteLocker,
    selectLocker,
    addZone,
    setViewMode,
    setPlacementMode,
    setCurrentFloor,
    initTestData,
    undo,
    redo,
    checkCollision,
    getRotatedBounds,
    getLockerById,
    
    // Database integration
    isOnlineMode: readonly(isOnlineMode),
    isSyncing: readonly(isSyncing),
    lastSyncTime: readonly(lastSyncTime),
    connectionStatus: readonly(connectionStatus),
    loadLockersFromDatabase,
    toggleOnlineMode,
    syncToDatabase
  }
})
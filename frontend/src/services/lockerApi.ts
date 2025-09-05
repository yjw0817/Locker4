import type { Locker, LockerStatus } from '@/stores/lockerStore'
import { 
  isCodeIgniterEnvironment, 
  getApiBaseUrl, 
  getCsrfToken, 
  getCsrfHeader,
  getCompanyCodes,
  isDebugMode,
  getLockerConfig 
} from '@/config/codeigniter'

// Database schema interface matching the actual DB structure (lockrs table)
export interface ApiLocker {
  LOCKR_CD: number
  COMP_CD: string
  BCOFF_CD: string
  LOCKR_KND: string
  LOCKR_TYPE_CD: string
  X: number
  Y: number
  LOCKR_LABEL: string            // Floor view number (e.g., "A-01")
  ROTATION: number
  DOOR_DIRECTION?: string
  FRONT_VIEW_X?: number
  FRONT_VIEW_Y?: number
  GROUP_NUM?: number
  LOCKR_GENDR_SET?: string
  LOCKR_NO?: number               // Front view number (e.g., 101, 102)
  PARENT_LOCKR_CD?: number | null  // NULL = parent locker
  TIER_LEVEL: number              // 0 = parent, 1+ = child tier
  BUY_EVENT_SNO?: string
  MEM_SNO?: string
  MEM_NM?: string
  LOCKR_USE_S_DATE?: string
  LOCKR_USE_E_DATE?: string
  LOCKR_STAT: string              // '00' = available, '01' = occupied, etc.
  MEMO?: string
  UPDATE_BY?: string
  UPDATE_DT?: string
}

// Type dimensions (hardcoded for now, should come from DB)
const TYPE_DIMENSIONS: Record<string, { width: number; height: number; depth: number }> = {
  '1': { width: 40, height: 40, depth: 40 }, // Small
  '2': { width: 50, height: 60, depth: 50 }, // Medium
  '3': { width: 60, height: 80, depth: 60 }  // Large
}

// Type colors mapping (matching backend default colors)
const TYPE_COLORS: Record<string, string> = {
  '1': '#3b82f6',  // Small - Blue
  '2': '#10b981',  // Medium - Green
  '3': '#f59e0b',  // Large - Orange
  // Additional types use variations
  '4': '#8b5cf6',  // Purple
  '5': '#ef4444',  // Red
  '6': '#14b8a6',  // Teal
  '7': '#f97316',  // Orange variant
  '8': '#6366f1'   // Indigo
}

export class LockerApiService {
  private baseUrl: string
  private headers: HeadersInit
  private useCodeIgniter: boolean
  
  constructor() {
    this.useCodeIgniter = isCodeIgniterEnvironment()
    
    // Use CodeIgniter API if available, otherwise fall back to Node.js API
    if (this.useCodeIgniter) {
      // Use the base URL from CodeIgniter config
      const config = getLockerConfig()
      this.baseUrl = config ? config.baseUrl + '/api' : '/api'
    } else {
      // Development mode - use Node.js API
      this.baseUrl = 'http://localhost:3333/api'
    }
    
    this.headers = {
      'Content-Type': 'application/json'
    }
    
    console.log('[LockerApi] Using API:', this.baseUrl)
    console.log('[LockerApi] CodeIgniter environment:', this.useCodeIgniter)
    
    // Keep CodeIgniter detection for future use
    if (this.useCodeIgniter) {
      const csrfToken = getCsrfToken()
      const csrfHeader = getCsrfHeader()
      
      // Add CSRF token if available (for future CodeIgniter API)
      if (csrfToken && csrfHeader) {
        (this.headers as any)[csrfHeader] = csrfToken
      }
    }
  }
  
  // Convert DB format to current app format
  private dbToAppFormat(dbLocker: ApiLocker): Locker {
    // Handle both numeric and string type codes, with fallback defaults
    const typeCode = String(dbLocker.LOCKR_TYPE_CD || '1')
    const dimensions = TYPE_DIMENSIONS[typeCode] || TYPE_DIMENSIONS['1'] || { width: 40, height: 40, depth: 40 }
    const color = TYPE_COLORS[typeCode] || TYPE_COLORS['1'] || '#3b82f6'
    
    return {
      id: `locker-${dbLocker.LOCKR_CD}`,
      number: dbLocker.LOCKR_LABEL || '',  // Maps to LOCKR_LABEL for floor view
      x: dbLocker.X || 0,
      y: dbLocker.Y || 0,
      width: dimensions.width || 40,
      height: dimensions.height || 40,
      depth: dimensions.depth || 40,
      color: color,  // Add color based on type
      status: this.mapDbStatusToApp(dbLocker.LOCKR_STAT),
      rotation: dbLocker.ROTATION || 0,
      zoneId: dbLocker.LOCKR_KND,
      typeId: dbLocker.LOCKR_TYPE_CD,
      
      // Database fields
      lockrCd: dbLocker.LOCKR_CD,
      compCd: dbLocker.COMP_CD,
      bcoffCd: dbLocker.BCOFF_CD,
      lockrLabel: dbLocker.LOCKR_LABEL,
      lockrNo: dbLocker.LOCKR_NO,
      lockrKnd: dbLocker.LOCKR_KND,
      lockrTypeCd: dbLocker.LOCKR_TYPE_CD,
      doorDirection: dbLocker.DOOR_DIRECTION,
      groupNum: dbLocker.GROUP_NUM,
      lockrGendrSet: dbLocker.LOCKR_GENDR_SET,
      
      // Parent-child relationship
      parentLockerId: (() => {
        const result = dbLocker.PARENT_LOCKR_CD ? `locker-${dbLocker.PARENT_LOCKR_CD}` : null;
        if (dbLocker.LOCKR_LABEL && dbLocker.LOCKR_LABEL.includes('-T')) {
          // Tier transformation logged
        }
        return result;
      })(),
      parentLockrCd: dbLocker.PARENT_LOCKR_CD,
      childLockerIds: [], // Will be populated from relationships
      tierLevel: dbLocker.TIER_LEVEL || 0,
      
      // Front view specific
      frontViewX: dbLocker.FRONT_VIEW_X,
      frontViewY: dbLocker.FRONT_VIEW_Y,
      frontViewNumber: dbLocker.LOCKR_NO ? `${dbLocker.LOCKR_NO}` : undefined,
      
      // Member assignment
      memSno: dbLocker.MEM_SNO,
      memNm: dbLocker.MEM_NM,
      lockrUseSDate: dbLocker.LOCKR_USE_S_DATE,
      lockrUseEDate: dbLocker.LOCKR_USE_E_DATE,
      lockrStat: dbLocker.LOCKR_STAT,
      buyEventSno: dbLocker.BUY_EVENT_SNO,
      
      // Visibility control
      isVisible: true,
      isAnimating: false,
      hasError: false,
      
      // Legacy support
      assignedTo: dbLocker.MEM_NM ? {
        name: dbLocker.MEM_NM,
        expiryDate: dbLocker.LOCKR_USE_E_DATE ? new Date(dbLocker.LOCKR_USE_E_DATE) : new Date()
      } : undefined,
      
      // Metadata
      memo: dbLocker.MEMO,
      updateBy: dbLocker.UPDATE_BY,
      updateDt: dbLocker.UPDATE_DT
    }
  }
  
  // Convert app format to DB format
  private appToDbFormat(appLocker: Locker): Partial<ApiLocker> {
    const parentId = appLocker.parentLockrCd || 
      (appLocker.parentLockerId ? parseInt(appLocker.parentLockerId.replace('locker-', '')) : null)
    
    return {
      LOCKR_LABEL: appLocker.lockrLabel || appLocker.number,
      X: appLocker.x !== undefined ? Math.round(appLocker.x) : 0,
      Y: appLocker.y !== undefined ? Math.round(appLocker.y) : 0,
      FRONT_VIEW_X: appLocker.frontViewX ? Math.round(appLocker.frontViewX) : undefined,
      FRONT_VIEW_Y: appLocker.frontViewY ? Math.round(appLocker.frontViewY) : undefined,
      ROTATION: appLocker.rotation || 0,
      DOOR_DIRECTION: appLocker.doorDirection,
      GROUP_NUM: appLocker.groupNum,
      LOCKR_GENDR_SET: appLocker.lockrGendrSet,
      LOCKR_STAT: appLocker.lockrStat || this.mapAppStatusToDb(appLocker.status),
      LOCKR_KND: appLocker.lockrKnd || appLocker.zoneId,
      LOCKR_TYPE_CD: appLocker.lockrTypeCd || appLocker.typeId,
      PARENT_LOCKR_CD: parentId,
      TIER_LEVEL: appLocker.tierLevel || 0,
      LOCKR_NO: appLocker.lockrNo,
      // Member assignment
      MEM_SNO: appLocker.memSno,
      MEM_NM: appLocker.memNm,
      LOCKR_USE_S_DATE: appLocker.lockrUseSDate,
      LOCKR_USE_E_DATE: appLocker.lockrUseEDate,
      BUY_EVENT_SNO: appLocker.buyEventSno,
      // Metadata
      MEMO: appLocker.memo,
      UPDATE_BY: appLocker.updateBy,
      // Default values for required fields
      COMP_CD: appLocker.compCd || '001',
      BCOFF_CD: appLocker.bcoffCd || '001'
    }
  }
  
  private mapDbStatusToApp(dbStatus: string): LockerStatus {
    const statusMap: Record<string, LockerStatus> = {
      '00': 'available',
      '01': 'occupied',
      '02': 'occupied', // reserved treated as occupied
      '03': 'maintenance',
      '04': 'maintenance', // disabled treated as maintenance
      '05': 'expired'
    }
    return statusMap[dbStatus] || 'available'
  }
  
  private mapAppStatusToDb(appStatus: LockerStatus): string {
    const statusMap: Record<LockerStatus, string> = {
      'available': '00',
      'occupied': '01',
      'expired': '05',
      'maintenance': '03'
    }
    return statusMap[appStatus] || '00'
  }
  
  // Handle API response and check for authentication
  private async handleResponse(response: Response): Promise<any> {
    // Check for authentication errors
    if (response.status === 401) {
      if (this.useCodeIgniter) {
        // Redirect to login page for CodeIgniter
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
  
  // API methods
  async getLockers(compCd?: string, bcoffCd?: string, includeChildren: boolean = false): Promise<Locker[]> {
    try {
      // Use company codes from config if in CodeIgniter environment
      if (this.useCodeIgniter) {
        const codes = getCompanyCodes()
        compCd = compCd || codes.companyCode
        bcoffCd = bcoffCd || codes.officeCode
      }
      
      const params = new URLSearchParams()
      if (compCd) params.append('COMP_CD', compCd)
      if (bcoffCd) params.append('BCOFF_CD', bcoffCd)
      // LockerManagement needs all lockers including children
      if (!includeChildren) {
        params.append('parentOnly', 'true')
      }
      
      // Always use Node.js API URL pattern for now
      const url = `${this.baseUrl}/lockrs?${params}`
      
      console.log('[LockerApi] Fetching lockers from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        credentials: 'omit' // No credentials needed for Node.js API
      })
      
      const data = await this.handleResponse(response)
      
      // Handle Node.js API response format
      const dbLockers: ApiLocker[] = data.lockers || data
      
      console.log('[LockerApi] Received', dbLockers.length, 'lockers from backend')
      
      // Convert all lockers
      const appLockers = dbLockers.map((dbLocker, index) => {
        return this.dbToAppFormat(dbLocker)
      })
      
      // Build parent-child relationships
      appLockers.forEach(locker => {
        if (locker.parentLockerId) {
          const parent = appLockers.find(l => l.id === locker.parentLockerId)
          if (parent) {
            if (!parent.childLockerIds) {
              parent.childLockerIds = []
            }
            parent.childLockerIds.push(locker.id)
          }
        }
      })
      
      return appLockers
    } catch (error) {
      console.error('[API] Failed to fetch lockers:', error)
      return [] // Return empty array on error, don't break app
    }
  }
  
  // Legacy method for compatibility
  async getAllLockers(includeChildren: boolean = false): Promise<Locker[]> {
    return this.getLockers(undefined, undefined, includeChildren)
  }
  
  async saveLocker(locker: Locker): Promise<Locker | null> {
    try {
      const dbLocker = this.appToDbFormat(locker)
      const isNew = locker.id.includes('temp') || locker.id.includes('new')
      
      // Add company codes if in CodeIgniter environment
      if (this.useCodeIgniter) {
        const codes = getCompanyCodes()
        dbLocker.COMP_CD = dbLocker.COMP_CD || codes.companyCode
        dbLocker.BCOFF_CD = dbLocker.BCOFF_CD || codes.officeCode
      }
      
      // Always use Node.js API URL pattern
      const url = isNew 
        ? `${this.baseUrl}/lockrs`
        : `${this.baseUrl}/lockrs/${this.extractDbId(locker.id)}`
        
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: this.headers,
        body: JSON.stringify(dbLocker),
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      const savedDbLocker: ApiLocker = result
      
      return this.dbToAppFormat(savedDbLocker)
    } catch (error) {
      console.error('[API] Failed to save locker:', error)
      return null
    }
  }
  
  async deleteLocker(lockerId: string): Promise<boolean> {
    try {
      const dbId = this.extractDbId(lockerId)
      
      // Always use Node.js API URL pattern
      const url = `${this.baseUrl}/lockrs/${dbId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
        credentials: 'omit'
      })
      
      return response.ok
    } catch (error) {
      console.error('[API] Failed to delete locker:', error)
      return false
    }
  }
  
  async batchSaveLockers(lockers: Locker[]): Promise<number> {
    let successCount = 0
    
    for (const locker of lockers) {
      const result = await this.saveLocker(locker)
      if (result) successCount++
    }
    
    return successCount
  }
  
  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers
      })
      return response.ok
    } catch (error) {
      console.error('[API] Database connection test failed:', error)
      return false
    }
  }
  
  // Add tiers to parent locker
  async addTiers(parentLockrCd: number, tierCount: number, parentFrontViewX?: number, parentFrontViewY?: number, startTierLevel?: number): Promise<Locker[]> {
    try {
      console.log('[API DEBUG] addTiers called with:', { parentLockrCd, tierCount, parentFrontViewX, parentFrontViewY, startTierLevel })
      console.log('[API DEBUG] baseUrl:', this.baseUrl)
      
      const url = `${this.baseUrl}/lockrs/${parentLockrCd}/tiers`
      console.log('[API DEBUG] Request URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ 
          tierCount,
          parentFrontViewX,
          parentFrontViewY,
          startTierLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      // Tier API response received
      
      const newTiers: ApiLocker[] = data.tiers || data
      
      // Log each tier's data transformation
      const transformedTiers = newTiers.map((tier, index) => {
        // Tier from API
        
        const transformed = this.dbToAppFormat(tier)
        
        // Tier transformed
        
        return transformed
      })
      
      return transformedTiers
    } catch (error) {
      console.error('[API] Failed to add tiers:', error)
      return []
    }
  }
  
  // Get children of a parent locker
  async getChildren(parentLockrCd: number): Promise<Locker[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lockrs/${parentLockrCd}/children`, {
        method: 'GET',
        headers: this.headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const children: ApiLocker[] = data.children || data
      return children.map(child => this.dbToAppFormat(child))
    } catch (error) {
      console.error('[API] Failed to get children:', error)
      return []
    }
  }
  
  // Update locker with new database fields
  async updateLocker(lockrCd: number, updates: Partial<Locker>): Promise<Locker | null> {
    try {
      const dbUpdates = this.appToDbFormat(updates)
      const response = await fetch(`${this.baseUrl}/lockrs/${lockrCd}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(dbUpdates)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedDbLocker: ApiLocker = await response.json()
      return this.dbToAppFormat(updatedDbLocker)
    } catch (error) {
      console.error('[API] Failed to update locker:', error)
      return null
    }
  }
  
  // Create new locker
  async createLocker(locker: Partial<Locker>): Promise<Locker | null> {
    try {
      const dbLocker = this.appToDbFormat(locker as Locker)
      const response = await fetch(`${this.baseUrl}/lockrs`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(dbLocker)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newDbLocker: ApiLocker = await response.json()
      return this.dbToAppFormat(newDbLocker)
    } catch (error) {
      console.error('[API] Failed to create locker:', error)
      return null
    }
  }
  
  private extractDbId(appId: string): number {
    const match = appId.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }
}

export const lockerApi = new LockerApiService()
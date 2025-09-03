// CodeIgniter Integration Configuration

export interface LockerConfig {
  apiUrl: string
  baseUrl: string
  csrfToken: string
  csrfHeader: string
  csrfHash: string
  companyCode: string
  officeCode: string
  user: {
    id: string
    name: string
    role: string
    isLoggedIn: boolean
  }
  settings: {
    dateFormat: string
    timeFormat: string
    locale: string
    currency: string
  }
  features: {
    enableApi: boolean
    enableRealtime: boolean
    enableDebugMode: boolean
  }
}

// Get configuration from window object (injected by PHP)
export function getLockerConfig(): LockerConfig | null {
  if (typeof window !== 'undefined' && (window as any).LockerConfig) {
    return (window as any).LockerConfig
  }
  return null
}

// Check if running in CodeIgniter environment
export function isCodeIgniterEnvironment(): boolean {
  return getLockerConfig() !== null
}

// Get API base URL
export function getApiBaseUrl(): string {
  const config = getLockerConfig()
  if (config) {
    return config.apiUrl
  }
  // Fallback to local development API
  return import.meta.env.VITE_API_URL || '/api'
}

// Get CSRF token for API requests
export function getCsrfToken(): string {
  const config = getLockerConfig()
  return config?.csrfToken || ''
}

// Get CSRF header name
export function getCsrfHeader(): string {
  const config = getLockerConfig()
  return config?.csrfHeader || 'X-CSRF-TOKEN'
}

// Get company and office codes
export function getCompanyCodes(): { companyCode: string; officeCode: string } {
  const config = getLockerConfig()
  return {
    companyCode: config?.companyCode || '001',
    officeCode: config?.officeCode || '001'
  }
}

// Get user information
export function getUserInfo() {
  const config = getLockerConfig()
  return config?.user || {
    id: '',
    name: '',
    role: '',
    isLoggedIn: false
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const config = getLockerConfig()
  return config?.user?.isLoggedIn || false
}

// Get debug mode status
export function isDebugMode(): boolean {
  const config = getLockerConfig()
  return config?.features?.enableDebugMode || false
}

// Log configuration (only in debug mode)
export function logConfig(): void {
  if (isDebugMode()) {
    console.log('[Locker4] Configuration:', getLockerConfig())
    console.log('[Locker4] Environment:', isCodeIgniterEnvironment() ? 'CodeIgniter' : 'Standalone')
    console.log('[Locker4] API URL:', getApiBaseUrl())
    console.log('[Locker4] User:', getUserInfo())
  }
}

// Initialize configuration on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    logConfig()
  })
}
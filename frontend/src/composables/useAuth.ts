import { ref, computed } from 'vue'
import { getUserInfo, isAuthenticated, isCodeIgniterEnvironment } from '@/config/codeigniter'

export function useAuth() {
  const user = ref(getUserInfo())
  const isLoggedIn = computed(() => isAuthenticated())
  const isInCodeIgniter = computed(() => isCodeIgniterEnvironment())
  
  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return user.value.role === role
  }
  
  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(user.value.role)
  }
  
  // Redirect to login page (CodeIgniter login)
  const redirectToLogin = () => {
    if (isInCodeIgniter.value) {
      // Redirect to CodeIgniter login page
      window.location.href = '/login'
    } else {
      // In development, just log
      console.log('[Auth] Redirect to login requested (development mode)')
    }
  }
  
  // Logout function
  const logout = async () => {
    if (isInCodeIgniter.value) {
      // Redirect to CodeIgniter logout
      window.location.href = '/logout'
    } else {
      // In development, just log
      console.log('[Auth] Logout requested (development mode)')
    }
  }
  
  // Check permission for locker operations
  const canEditLockers = computed(() => {
    // In development mode, always allow
    if (!isInCodeIgniter.value) return true
    
    // Check user role
    return hasAnyRole(['admin', 'manager', 'staff'])
  })
  
  const canDeleteLockers = computed(() => {
    // In development mode, always allow
    if (!isInCodeIgniter.value) return true
    
    // Only admin and manager can delete
    return hasAnyRole(['admin', 'manager'])
  })
  
  const canAssignLockers = computed(() => {
    // In development mode, always allow
    if (!isInCodeIgniter.value) return true
    
    // Check user role
    return hasAnyRole(['admin', 'manager', 'staff'])
  })
  
  const canViewReports = computed(() => {
    // In development mode, always allow
    if (!isInCodeIgniter.value) return true
    
    // Only admin and manager can view reports
    return hasAnyRole(['admin', 'manager'])
  })
  
  return {
    user,
    isLoggedIn,
    isInCodeIgniter,
    hasRole,
    hasAnyRole,
    redirectToLogin,
    logout,
    canEditLockers,
    canDeleteLockers,
    canAssignLockers,
    canViewReports
  }
}
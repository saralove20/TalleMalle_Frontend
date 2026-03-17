/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (Auth Store 정의)
 * ==============================================================================
 */

// 다른 페이지에서 const authStore = useAuthStore() 변수 선언해주고
// authStore.user, authStore.user.id, authStore.user.email 이런식으로 사용하면 됨

export const useAuthStore = defineStore('auth', () => {
  const driver = ref(JSON.parse(localStorage.getItem('DRIVERINFO')) || null)

  function login(driverInfo) {
    const driverData = driverInfo
    driver.value = driverData
    localStorage.setItem('DRIVERINFO', JSON.stringify(driverData))
  }

  function logout() {
    driver.value = null
    localStorage.removeItem('DRIVERINFO')
    window.location.href = '/driverlogin' // 확실한 리셋을 위해
  }

  return { driver, login, logout }
})

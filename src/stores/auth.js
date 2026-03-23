/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * ==============================================================================
 * 2. AUTH STORE (통합 관리)
 * ==============================================================================
 */
export const useAuthStore = defineStore('auth', () => {
    // 1. STATE (상태)
    const user = ref(null)         // 프로필 정보 (idx, nickname, imageUrl 등)


    // 2. ACTIONS (기능)
    // 로그인 처리 (이제 persist가 자동으로 저장해주므로 localStorage.setItem 불필요)
    function login(userInfo) {
        user.value = userInfo
    }

    // 로그아웃 처리
    function logout() {
        user.value = null

        // Pinia Persist 데이터 초기화 및 이동
        localStorage.removeItem('auth')
        window.location.href = '/login'
    }

    // 유저 정보 갱신 (프로필 수정 등)
    function updateUser(newInfo) {
        if (user.value) {
            user.value = { ...user.value, ...newInfo }
        } else {
            user.value = newInfo
        }
    }

    return { 
        user, history,
        login, logout, updateUser
    }
}, {
    // [핵심] 이 한 줄로 새로고침 시에도 모든 상태가 로컬 스토리지에 자동 저장/복구됩니다.
    persist: true 
})

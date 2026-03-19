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

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('USERINFO')) || null)

    function login(userInfo) {
        const userData = userInfo
        user.value = userData
        localStorage.setItem('USERINFO', JSON.stringify(userData))
    }

    // 유저 정보를 안전하게 갱신하고 로컬 스토리지에 저장하는 함수
    function updateUser(newInfo) {
        if (user.value) {
            // 새 객체를 할당하여 Vue의 반응성(Reactivity)을 확실히 트리거함
            const updatedUser = { ...user.value, ...newInfo }
            user.value = updatedUser
            localStorage.setItem('USERINFO', JSON.stringify(updatedUser))
        }
    }

    function logout() {
        user.value = null
        localStorage.removeItem('USERINFO')
        window.location.href = '/login' // 확실한 리셋을 위해
    }

    return { user, login, logout, updateUser }
})

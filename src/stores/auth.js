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
    const user = ref(null)

    function login(userInfo) {
        user.value = userInfo
    }

    // TODO : 신우님 이 부분 + profile 스토어 로컬스토리지 사용하는 부분 코드 수정 필요
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
        window.location.href = '/login' // 확실한 리셋을 위해
    }

    return { user, login, logout, updateUser }
})

/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { defineStore } from 'pinia'

/**
 * ==============================================================================
 * 2. STORE DEFINITION
 * ==============================================================================
 */
export const useNotificationStore = defineStore('notification', {
  /**
   * ----------------------------------------------------------------------------
   * STATE (상태 변수 정의)
   * ----------------------------------------------------------------------------
   */
  state: () => ({
    notifications: [],
  }),

  /**
   * ----------------------------------------------------------------------------
   * ACTIONS (상태 변경 함수)
   * ----------------------------------------------------------------------------
   */
  actions: {
    /**
     * [SETTER] 알림 리스트 저장
     * - View에서 API 호출 성공 후, 받은 데이터를 이 함수를 통해 저장합니다.
     */
    setNotifications(data) {
      // API 응답 문제로 undefined 등이 들어오더라도 배열 오류가 나지 않도록 빈 배열 보장
      this.notifications = data || []
    },

    // 모든 알림 읽음 처리
    markAllAsRead() {
      this.notifications.forEach((n) => (n.isRead = true))
    },

    // 특정 알림 읽음 처리 (API 명세에 맞춰 매개변수를 id에서 idx로 수정)
    markAsRead(idx) {
      const item = this.notifications.find((n) => n.idx === idx)
      if (item) item.isRead = true
    },

    // 알림 삭제 (API 명세에 맞춰 매개변수를 id에서 idx로 수정)
    removeNotification(idx) {
      this.notifications = this.notifications.filter((n) => n.idx !== idx)
    },
  },

  // Pinia Persist 플러그인 설정 (새로고침 해도 데이터 유지)
  persist: true,
})

import api from '@/plugins/axiosinterceptor'

/** 모집·콜(매칭) 푸시 수신 동의 + 구독 등록 여부 */
export default {
  getPreferences: () => api.get('/push/preferences'),
  patchRecruitPromotionPush: (recruitPromotionPushEnabled) =>
    api.patch('/push/preferences', { recruitPromotionPushEnabled }),
}

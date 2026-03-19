import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  const userInfo = reactive({
    profile: {
      idx: null,
      nickname: '',
      phoneNumber: '',
      introduction: '',
      imageUrl: '',
      birth: '',
      gender: '',
      rating: 0,
    },
    history: [],
    review: [],
    payment: {
      default: 0,
      method: [],
    },
  })

  // 초기화: 세션 스토리지에 저장된 정보가 있다면 불러오기
  const savedInfo = sessionStorage.getItem('UserInfo')
  if (savedInfo) {
    try {
      const parsed = JSON.parse(savedInfo)
      Object.assign(userInfo, parsed)
    } catch (e) {
      console.error('Failed to parse UserInfo from sessionStorage:', e)
    }
  }

  // 프로필 정보 로드 및 세션 스토리지 동기화
  const loadProfile = (loadedProfile) => {
    // 백엔드 데이터 필드를 그대로 반영
    Object.assign(userInfo.profile, loadedProfile)
    sessionStorage.setItem('UserInfo', JSON.stringify(userInfo))
  }

  // 탑승 기록 로드 및 세션 스토리지 동기화
  const loadHistory = (loadedHistory) => {
    userInfo.history = loadedHistory
    sessionStorage.setItem('UserInfo', JSON.stringify(userInfo))
  }

  // 리뷰 정보 로드 및 세션 스토리지 동기화
  const loadReview = (loadedReview) => {
    userInfo.review = loadedReview
    sessionStorage.setItem('UserInfo', JSON.stringify(userInfo))
  }

  // 결제 정보 로드 및 세션 스토리지 동기화
  const loadPayment = (loadedPayment) => {
    userInfo.payment = loadedPayment
    sessionStorage.setItem('UserInfo', JSON.stringify(userInfo))
  }
  return { userInfo, loadProfile, loadPayment, loadHistory, loadReview }
})

import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useAuthStore } from './auth'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()

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
    // 화면 표시용 임시 변수 (LocalStorage 저장 제외)
    history: [],
    review: [],
    payment: {
      default: 0,
      method: [],
    },
  })

  // 초기화: localStorage('USERINFO')에서 프로필 정보만 안전하게 로드
  const savedAuth = localStorage.getItem('USERINFO')
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth)
      userInfo.profile.idx = parsed.idx || parsed.id || null
      userInfo.profile.nickname = parsed.nickname || ''
      userInfo.profile.imageUrl = parsed.imageUrl || parsed.image || ''
      userInfo.profile.introduction = parsed.introduction || ''
      userInfo.profile.phoneNumber = parsed.phoneNumber || ''
      userInfo.profile.birth = parsed.birth || ''
      userInfo.profile.gender = parsed.gender || ''
    } catch (e) {
      console.error('Failed to parse USERINFO from localStorage:', e)
    }
  }

  // 프로필 정보만 AuthStore 및 LocalStorage('USERINFO')와 동기화
  const syncProfileToAuth = () => {
    authStore.updateUser(userInfo.profile)
  }

  // 데이터 할당 함수들 (메모리 변수에만 값 주입)
  const loadProfile = (loadedProfile) => {
    Object.assign(userInfo.profile, loadedProfile)
    syncProfileToAuth()
  }

  const loadHistory = (data) => { userInfo.history = data }
  const loadReview = (data) => { userInfo.review = data }
  const loadPayment = (data) => { userInfo.payment = data }

  return { 
    userInfo, 
    loadProfile, 
    loadHistory, 
    loadReview, 
    loadPayment 
  }
})

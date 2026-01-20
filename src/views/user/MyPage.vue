<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import {
  UserMinus,
  X,
  Trash2,
  Check,
  AlertCircle,
  AlertTriangle,
  Star,
  CreditCard,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import api from '@/api/profile'
import RoundBox from '@/components/layout/RoundBox.vue'
import EditPayment from '@/components/modal/EditPayment.vue'
import EditProfile from '@/components/modal/EditProfile.vue'
import HistoryEntry from '@/components/entry/HistoryEntry.vue'
import ReviewEntry from '@/components/entry/ReviewEntry.vue'
import PaymentList from '@/components/list/PaymentList.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const profileStore = useProfileStore()
const router = useRouter()

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언) - [변수]
 * ==============================================================================
 */
const activeTab = ref('history') // 'history' | 'reviews'

// 모달 상태 관리
const isRideHistoryModalOpen = ref(false)
const isEditPaymentModalOpen = ref(false)
const isEditProfileOpen = ref(false)
const isReviewModalOpen = ref(false)
const isPaymentActionModalOpen = ref(false)
const isLimitReachedModalOpen = ref(false)
const isWithdrawModalOpen = ref(false)

// 선택된 데이터 상태
const currentHistory = ref({})
const currentReview = ref({})
const selectedPayment = ref(null)

// 스크롤 상태 감지 로직용 Ref 및 상태
const historyScrollRef = ref(null)
const reviewScrollRef = ref(null)
const scrollState = reactive({
  history: { top: false, bottom: false },
  reviews: { top: false, bottom: false },
})

/**
 * ==============================================================================
 * 4. COMPUTED (계산된 속성)
 * ==============================================================================
 */
// 탭 전환 및 데이터 변경 감지 워처 (스크롤 상태 계산)
watch(
  [activeTab, () => profileStore.userInfo.history, () => profileStore.userInfo.review],
  async () => {
    await nextTick()
    if (activeTab.value === 'history') checkScroll(historyScrollRef.value, 'history')
    else checkScroll(reviewScrollRef.value, 'reviews')
  },
  { deep: true },
)

/**
 * ==============================================================================
 * 5. METHODS - UI INTERACTION (화면 조작) - [기능 함수]
 * ==============================================================================
 */
// 날짜 포맷팅 유틸리티
const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return isoString

  const week = ['일', '월', '화', '수', '목', '금', '토']
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const day = week[date.getDay()]
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}.${mm}.${dd} (${day}) ${hh}:${min}`
}

// 스크롤 위치 확인
const checkScroll = (el, type) => {
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  const canScroll = scrollHeight > clientHeight

  if (canScroll) {
    scrollState[type].top = scrollTop > 10
    scrollState[type].bottom = scrollTop + clientHeight < scrollHeight - 10
  } else {
    scrollState[type].top = false
    scrollState[type].bottom = false
  }
}

// 탭 전환
const switchTab = (tab) => {
  activeTab.value = tab
}

// 탑승 상세 정보 열기
const openRideDetail = (id) => {
  const selected = profileStore.userInfo.history.find((item) => item.id === id)
  if (selected) {
    currentHistory.value = selected
    isRideHistoryModalOpen.value = true
  }
}

// 리뷰 상세 열기
const openMyReview = (item) => {
  currentReview.value = item
  isReviewModalOpen.value = true
}

// 카드 추가 핸들러
const handleAddPayment = () => {
  if (profileStore.userInfo.payment.method.length >= 2) {
    isLimitReachedModalOpen.value = true
    return
  }
  isEditPaymentModalOpen.value = true
}

// 카드 관리 핸들러
const handleManagePayment = (card) => {
  selectedPayment.value = card
  isPaymentActionModalOpen.value = true
}

// 기본 결제 수단 설정
const setAsDefaultPayment = () => {
  if (selectedPayment.value) {
    profileStore.userInfo.payment.default = selectedPayment.value.id
    isPaymentActionModalOpen.value = false
  }
}

// 결제 수단 삭제
const deletePaymentMethod = () => {
  if (selectedPayment.value) {
    const list = profileStore.userInfo.payment.method
    const index = list.findIndex((c) => c.id === selectedPayment.value.id)

    if (index !== -1) {
      list.splice(index, 1)
      if (selectedPayment.value.id === profileStore.userInfo.payment.default) {
        profileStore.userInfo.payment.default = list.length > 0 ? list[0].id : 0
      }
    }
    isPaymentActionModalOpen.value = false
  }
}

// 회원 탈퇴 확인
const handleWithdrawConfirm = () => {
  isWithdrawModalOpen.value = false
  router.push('login')
}

/**
 * ==============================================================================
 * 6. METHODS - DATA & NETWORK (데이터 통신 및 소켓) - [연동 API 함수]
 * ==============================================================================
 */
// 전체 사용자 정보 Fetch
const fetchAllUserInfo = async () => {
  try {
    const results = await Promise.allSettled([
      api.profile(),
      api.payment(),
      api.history(),
      api.review(),
    ])

    const [profileResult, paymentResult, historyResult, reviewResult] = results

    if (profileResult.status === 'fulfilled' && profileResult.value.data) {
      profileStore.loadProfile(profileResult.value.data)
    }
    if (paymentResult.status === 'fulfilled' && paymentResult.value.data) {
      profileStore.loadPayment(paymentResult.value.data)
    }
    if (historyResult.status === 'fulfilled' && historyResult.value.data) {
      profileStore.loadHistory(historyResult.value.data)
    }
    if (reviewResult.status === 'fulfilled' && reviewResult.value.data) {
      profileStore.loadReview(reviewResult.value.data)
    }
  } catch (error) {
    console.error('Critical error during fetchAllData:', error)
  }
}

/**
 * ==============================================================================
 * 7. LIFECYCLE (생명주기 훅) - [마운트 관련]
 * ==============================================================================
 */
onMounted(async () => {
  fetchAllUserInfo()
})
</script>

<template>
  <div class="h-full flex gap-4 p-4 overflow-hidden relative text-slate-900">
    <div class="hidden md:block w-20 shrink-0"></div>

    <div
      class="flex-1 flex flex-col glass-panel rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur border border-white/50 shadow-xl"
    >
      <!-- 헤더 -->
      <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight text-left">
            마이페이지
          </h1>
          <p class="text-sm text-slate-400 font-medium mt-1 text-left">
            나의 동승 기록과 프로필 정보를 관리하세요.
          </p>
        </div>
        <div class="flex gap-4">
          <div class="text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase">누적 동승</p>
            <p class="text-lg font-black text-indigo-600">
              {{ profileStore.userInfo.history?.length || 0 }}회
            </p>
          </div>
          <div class="w-px h-8 bg-slate-200 self-center"></div>
          <div class="text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase">절약 금액</p>
            <p class="text-lg font-black text-emerald-600">24.5만</p>
          </div>
        </div>
      </div>

      <!-- 메인 컨테이너 -->
      <div class="flex-1 overflow-hidden p-8 flex flex-col">
        <div class="max-w-6xl mx-auto grid grid-cols-12 gap-8 w-full flex-1 min-h-0">
          <!-- 왼쪽 사이드바 -->
          <div class="col-span-12 lg:col-span-4 space-y-6 flex flex-col min-h-0">
            <!-- 프로필 카드 -->
            <RoundBox padding="32px" class="text-center relative overflow-hidden flex-none">
              <div class="absolute top-0 left-0 w-full h-24 bg-slate-50"></div>
              <div class="relative w-28 h-28 mx-auto mb-4 mt-4">
                <img
                  :src="
                    profileStore.userInfo.profile.image ||
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
                  "
                  class="w-full h-full rounded-full bg-white border-4 border-white shadow-xl object-cover"
                />
              </div>
              <h2 class="text-xl font-bold text-slate-900">
                {{ profileStore.userInfo.profile.nickname || '사용자' }}
              </h2>
              <p class="text-xs text-slate-400 mb-6 text-center tracking-tight leading-relaxed">
                {{ profileStore.userInfo.profile.bio || '등록된 자기소개가 없습니다.' }}
              </p>
              <button
                @click="isEditProfileOpen = true"
                class="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
              >
                개인정보 수정
              </button>
            </RoundBox>

            <!-- 매너 등급 -->
            <RoundBox padding="28px" class="flex-none">
              <div class="flex justify-between items-start mb-4">
                <div class="text-left">
                  <span
                    class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1"
                  >
                    나의 매너 등급
                  </span>
                  <div class="flex items-baseline gap-2">
                    <div class="flex items-baseline gap-1">
                      <span class="text-4xl font-black text-indigo-600 tracking-tighter">
                        {{ profileStore.userInfo.profile.rating || 0 }}
                      </span>
                      <span class="text-sm font-bold text-slate-300">/ 100</span>
                    </div>
                    <span class="text-xs font-bold text-indigo-400 whitespace-nowrap mb-1">
                      (상위 5%)
                    </span>
                  </div>
                </div>
              </div>
              <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: (profileStore.userInfo.profile.rating || 0) + '%' }"
                ></div>
              </div>
            </RoundBox>

            <div class="flex-1"></div>
            <div class="pt-4 flex justify-center mt-auto flex-none">
              <button
                @click="isWithdrawModalOpen = true"
                class="flex items-center gap-1.5 text-slate-300 hover:text-rose-500 transition-all font-bold text-[11px]"
              >
                <UserMinus class="w-3.5 h-3.5" />
                탈래말래 탈퇴하기
              </button>
            </div>
          </div>

          <!-- 오른쪽 섹션 -->
          <div class="col-span-12 lg:col-span-8 space-y-6 flex flex-col min-h-0">
            <!-- 분리된 결제 수단 컴포넌트 적용 -->
            <PaymentList @add-card="handleAddPayment" @manage-card="handleManagePayment" />

            <!-- 기록/리뷰 탭 영역 -->
            <RoundBox padding="0" class="overflow-hidden flex flex-col flex-none h-[450px]">
              <div class="flex border-b border-slate-50 flex-none">
                <button
                  @click="switchTab('history')"
                  class="flex-1 py-6 text-sm font-bold border-b-2 transition-all"
                  :class="
                    activeTab === 'history'
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  "
                >
                  최근 탑승 기록
                </button>
                <button
                  @click="switchTab('reviews')"
                  class="flex-1 py-6 text-sm font-bold border-b-2 transition-all"
                  :class="
                    activeTab === 'reviews'
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  "
                >
                  받은 리뷰
                  <span class="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {{ profileStore.userInfo.review?.length || 0 }}
                  </span>
                </button>
              </div>

              <div class="relative flex-1 min-h-0">
                <!-- 탑승 기록 리스트 -->
                <div
                  v-if="activeTab === 'history'"
                  class="h-full relative content-fade-wrapper"
                  :class="{
                    'show-top': scrollState.history.top,
                    'show-bottom': scrollState.history.bottom,
                  }"
                >
                  <div
                    ref="historyScrollRef"
                    @scroll="checkScroll($event.target, 'history')"
                    class="h-full overflow-y-auto custom-scroll p-6 pb-20 flex flex-col gap-2.5"
                  >
                    <HistoryEntry
                      v-for="item in profileStore.userInfo.history"
                      :key="item.id"
                      v-bind="item"
                      @click="openRideDetail(item.id)"
                    />
                    <div
                      v-if="profileStore.userInfo.history?.length === 0"
                      class="h-full flex items-center justify-center text-slate-300 text-sm font-medium"
                    >
                      기록이 없습니다.
                    </div>
                  </div>
                </div>

                <!-- 받은 리뷰 리스트 -->
                <div
                  v-if="activeTab === 'reviews'"
                  class="h-full relative content-fade-wrapper"
                  :class="{
                    'show-top': scrollState.reviews.top,
                    'show-bottom': scrollState.reviews.bottom,
                  }"
                >
                  <div
                    ref="reviewScrollRef"
                    @scroll="checkScroll($event.target, 'reviews')"
                    class="h-full overflow-y-auto custom-scroll p-8 pb-20"
                  >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                      <ReviewEntry
                        v-for="item in profileStore.userInfo.review"
                        :key="item.id"
                        :review="item"
                        @click="openMyReview(item)"
                      />
                    </div>
                    <div
                      v-if="profileStore.userInfo.review?.length === 0"
                      class="h-full flex items-center justify-center text-slate-300 text-sm font-medium"
                    >
                      리뷰가 없습니다.
                    </div>
                  </div>
                </div>
              </div>
            </RoundBox>
          </div>
        </div>
      </div>
    </div>

    <!-- 모달 Teleport -->
    <Teleport to="body">
      <EditProfile v-if="isEditProfileOpen" @close="isEditProfileOpen = false" />

      <div
        v-if="isEditPaymentModalOpen"
        class="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
        @click="isEditPaymentModalOpen = false"
      >
        <div class="w-full max-w-md animate-in fade-in zoom-in duration-300" @click.stop>
          <EditPayment @close="isEditPaymentModalOpen = false" />
        </div>
      </div>

      <div
        v-if="isPaymentActionModalOpen"
        class="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        @click="isPaymentActionModalOpen = false"
      >
        <div
          class="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          @click.stop
        >
          <div class="p-8 text-center border-b border-slate-50">
            <div
              class="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4"
            >
              <CreditCard class="w-8 h-8 text-slate-400" />
            </div>
            <h2 class="text-lg font-extrabold text-slate-900 mb-1">결제 수단 관리</h2>
            <p class="text-sm text-slate-400 font-medium">
              {{ selectedPayment?.card_company }} ({{
                selectedPayment?.card_number?.split('-').pop()
              }})
            </p>
          </div>
          <div class="p-4 grid grid-cols-1 gap-2">
            <button
              v-if="selectedPayment?.id !== profileStore.userInfo.payment.default"
              @click="setAsDefaultPayment"
              class="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              <Check class="w-4 h-4" /> 기본 결제 수단으로 설정
            </button>
            <button
              @click="deletePaymentMethod"
              class="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-rose-500 rounded-2xl font-bold hover:bg-rose-50 transition-all"
            >
              <Trash2 class="w-4 h-4" /> 삭제하기
            </button>
            <button
              @click="isPaymentActionModalOpen = false"
              class="w-full py-4 text-slate-400 font-bold text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      <!-- 탑승 상세 모달 -->
      <div
        v-if="isRideHistoryModalOpen"
        class="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        @click="isRideHistoryModalOpen = false"
      >
        <div
          class="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
          @click.stop
        >
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-slate-900">탑승 상세 정보</h2>
            <button @click="isRideHistoryModalOpen = false">
              <X class="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div class="space-y-4 mb-8 text-left">
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-400 text-sm">경로</span>
              <span class="text-slate-800 font-bold text-sm text-right"
                >{{ currentHistory.start }} → {{ currentHistory.dest }}</span
              >
            </div>
            <div class="flex flex-col py-2 border-b border-slate-50 gap-2">
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">출발 시각</span>
                <span class="text-slate-800 font-bold text-sm text-right">
                  {{ formatDateTime(currentHistory.departure) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 text-sm">도착 시각</span>
                <span class="text-slate-800 font-bold text-sm text-right">
                  {{ formatDateTime(currentHistory.arrival) }}
                </span>
              </div>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-400 text-sm">결제 금액</span>
              <span class="text-slate-800 font-bold text-sm text-right">{{
                currentHistory.cost
              }}</span>
            </div>
          </div>
          <button
            @click="isRideHistoryModalOpen = false"
            class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
          >
            확인
          </button>
        </div>
      </div>

      <!-- 리뷰 상세 모달 -->
      <div
        v-if="isReviewModalOpen"
        class="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        @click="isReviewModalOpen = false"
      >
        <div
          class="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
          @click.stop
        >
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-bold text-slate-900">리뷰 상세</h2>
            <button @click="isReviewModalOpen = false">
              <X class="w-6 h-6 text-slate-400 hover:text-slate-600 transition-colors" />
            </button>
          </div>
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
            <div class="flex items-center gap-4">
              <img
                :src="currentReview.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna'"
                class="w-16 h-16 rounded-[1.5rem] bg-slate-50 border-4 border-white shadow-lg object-cover"
              />
              <div class="text-left">
                <p class="text-lg font-bold text-slate-900">{{ currentReview.from }}님</p>
                <div class="flex gap-0.5 mt-1">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="w-4 h-4"
                    :class="
                      i <= (currentReview.rating || 5)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    "
                  />
                </div>
              </div>
            </div>
            <div class="bg-indigo-50 px-4 py-2 rounded-2xl">
              <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
                Manner Score
              </p>
              <p class="text-sm font-black text-indigo-600">
                + {{ (currentReview.rating || 5) * 2 }}pt
              </p>
            </div>
          </div>
          <div class="mb-8 text-left space-y-3">
            <h4 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              동승 경로 정보
            </h4>
            <div
              class="flex items-center gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100"
            >
              <div class="flex flex-col items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                <div class="w-0.5 h-4 bg-slate-200"></div>
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <div class="flex-1 text-sm font-bold text-slate-700">
                <p>{{ currentReview.departure }}</p>
                <p class="mt-1">{{ currentReview.destination }}</p>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 p-6 rounded-xl mb-10">
            <p class="text-base text-slate-600 leading-relaxed text-left">
              "{{ currentReview.contents }}"
            </p>
          </div>
          <button
            @click="isReviewModalOpen = false"
            class="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            확인
          </button>
        </div>
      </div>

      <!-- 등록 제한 알림 -->
      <div
        v-if="isLimitReachedModalOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        @click="isLimitReachedModalOpen = false"
      >
        <div
          class="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          @click.stop
        >
          <div class="p-8 text-center">
            <div
              class="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-4"
            >
              <AlertCircle class="w-8 h-8 text-amber-500" />
            </div>
            <h2 class="text-lg font-extrabold text-slate-900 mb-2">등록 제한</h2>
            <p class="text-sm text-slate-500 font-medium leading-relaxed">
              결제 수단은 최대 <span class="text-indigo-600 font-bold">2개</span>까지<br />등록할 수
              있습니다.
            </p>
          </div>
          <div class="p-4 pt-0">
            <button
              @click="isLimitReachedModalOpen = false"
              class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
            >
              확인
            </button>
          </div>
        </div>
      </div>

      <!-- 회원 탈퇴 확인 모달 -->
      <div
        v-if="isWithdrawModalOpen"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        @click="isWithdrawModalOpen = false"
      >
        <div
          class="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          @click.stop
        >
          <div class="p-8 text-center">
            <div
              class="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle class="w-8 h-8 text-rose-500" />
            </div>
            <h2 class="text-lg font-extrabold text-slate-900 mb-2">정말 탈퇴하시겠습니까?</h2>
            <p class="text-sm text-slate-500 font-medium leading-relaxed">
              탈퇴 시 사용자의 모든 데이터가 삭제되며<br />
              <span class="text-rose-500 font-bold">복구가 불가능</span>합니다.
            </p>
          </div>
          <div class="p-6 pt-0 flex gap-3">
            <button
              @click="isWithdrawModalOpen = false"
              class="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              취소
            </button>
            <button
              @click="handleWithdrawConfirm"
              class="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all"
            >
              탈퇴 확정
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.custom-scroll::-webkit-scrollbar {
  display: none;
}
.content-fade-wrapper::before,
.content-fade-wrapper::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 60px;
  pointer-events: none;
  z-index: 20;
  transition: opacity 0.3s ease;
  opacity: 0;
}
.content-fade-wrapper::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%);
}
.content-fade-wrapper::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%);
}
.show-top::before {
  opacity: 1;
}
.show-bottom::after {
  opacity: 1;
}
.glass-panel {
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}
</style>

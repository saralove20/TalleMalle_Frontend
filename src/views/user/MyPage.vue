<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { UserMinus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import api from '@/api/profile'
import RoundBox from '@/components/layout/RoundBox.vue'
import RegisterPayment from '@/components/modal/RegisterPayment.vue'
import ManagePayment from '@/components/modal/ManagePayment.vue'
import EditProfile from '@/components/modal/EditProfile.vue'
import HistoryEntry from '@/components/entry/HistoryEntry.vue'
import ReviewEntry from '@/components/entry/ReviewEntry.vue'
import PaymentList from '@/components/list/PaymentList.vue'
import HistoryDetail from '@/components/modal/HistoryDetail.vue'
import ReviewDetail from '@/components/modal/ReviewDetail.vue'
import LimitReached from '@/components/modal/LimitReached.vue'
import WithdrawConfirm from '@/components/modal/WithdrawConfirm.vue'

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

const activeModal = ref('none')

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
    handleModal('history-detail')
  }
}

// 리뷰 상세 열기
const openMyReview = (item) => {
  currentReview.value = item
  handleModal('review-detail')
}

// 카드 추가 핸들러
const handleRegisterPayment = () => {
  if (profileStore.userInfo.payment.method.length >= 2) {
    handleModal('limit-reached')
    return
  }
  handleModal('register-payment')
}

// 카드 관리 핸들러
const handleManagePayment = (card) => {
  selectedPayment.value = card
  handleModal('manage-payment')
}

// 회원 탈퇴 확인
const handleWithdrawConfirm = () => {
  handleModal('none')
  router.push('login')
}

// 모달 관리 핸들러
const handleModal = (active) => {
  activeModal.value = active
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
                @click="handleModal('edit-profile')"
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
                @click="handleModal('withdraw-confirm')"
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
            <PaymentList
              @register-payment="handleRegisterPayment"
              @manage-payment="handleManagePayment"
              @modal="handleModal"
            />

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
      <EditProfile v-if="activeModal === 'edit-profile'" @modal="handleModal" />
      <RegisterPayment v-if="activeModal === 'register-payment'" @modal="handleModal" />
      <ManagePayment
        v-if="activeModal === 'manage-payment' && selectedPayment"
        :selectedPayment="selectedPayment"
        @modal="handleModal"
      />

      <!-- 탑승 상세 모달 -->
      <HistoryDetail
        v-if="activeModal === 'history-detail' && currentHistory"
        :currentHistory="currentHistory"
        @modal="handleModal"
      />

      <!-- 리뷰 상세 모달 -->
      <ReviewDetail
        v-if="activeModal === 'review-detail' && currentReview"
        :currentReview="currentReview"
        @modal="handleModal"
      />
      <!-- 등록 제한 알림 -->
      <LimitReached v-if="activeModal === 'limit-reached'" @modal="handleModal" />

      <!-- 회원 탈퇴 확인 모달 -->
      <WithdrawConfirm
        v-if="activeModal === 'withdraw-confirm'"
        @modal="handleModal"
        @confirm="handleWithdrawConfirm"
      />
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

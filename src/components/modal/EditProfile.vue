<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { X, Camera, Send, UserCircle } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/profile'
import LabeledInput from '@/components/Input/LabeledInput.vue'
import SelectableTag from '@/components/tag/SelectableTag.vue'
import RoundBox from '@/components/layout/RoundBox.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const profileStore = useProfileStore()
const emits = defineEmits(['close'])

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언) - [변수]
 * ==============================================================================
 */
// 프로필 정보 로컬 복사본
const localProfile = ref({
  name: '',
  nickname: '',
  phone: '',
  bio: '',
  styles: [],
  image: '',
})

// 선택 가능한 스타일 목록
const availableStyles = [
  '🤫 조용한 이동 선호',
  '🎵 음악 감상',
  '☕ 커피 취식 가능',
  '💬 대화 선호',
  '🚭 금연 필수',
]

// 인증 및 타이머 관련 상태
const isPhoneChanged = ref(false)
const isPhoneVerified = ref(true)
const isAuthModalOpen = ref(false)
const authCode = ref('')
const timer = ref(180)
const timerInterval = ref(null)

/**
 * ==============================================================================
 * 4. COMPUTED (계산된 속성)
 * ==============================================================================
 */

/**
 * ==============================================================================
 * 5. METHODS - UI INTERACTION (화면 조작) - [기능 함수]
 * ==============================================================================
 */
// 이미지 업로드 프리뷰 처리
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => (localProfile.value.image = e.target.result)
    reader.readAsDataURL(file)
  }
}

// 휴대폰 번호 포맷팅 및 변경 감지
const handlePhoneInput = (e) => {
  let val = e.target.value.replace(/[^0-9]/g, '')
  if (val.length > 3 && val.length <= 7) {
    val = val.replace(/(\d{3})(\d{1,4})/, '$1-$2')
  } else if (val.length >= 8) {
    val = val.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
  }
  localProfile.value.phone = val

  if (val !== profileStore.userInfo.profile.phone) {
    isPhoneChanged.value = true
    isPhoneVerified.value = false
  } else {
    isPhoneChanged.value = false
    isPhoneVerified.value = true
  }
}

// 인증 타이머 시작
const startTimer = () => {
  clearInterval(timerInterval.value)
  timer.value = 180
  timerInterval.value = setInterval(() => {
    timer.value--
    if (timer.value <= 0) {
      clearInterval(timerInterval.value)
      isAuthModalOpen.value = false
    }
  }, 1000)
}

// 타이머 시간 포맷팅
const formatTimer = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * ==============================================================================
 * 6. METHODS - DATA & NETWORK (데이터 통신 및 소켓) - [연동 API 함수]
 * ==============================================================================
 */
// 인증번호 요청
const requestAuth = () => {
  if (localProfile.value.phone.length < 12) return
  isAuthModalOpen.value = true
  startTimer()
}

// 인증번호 확인
const confirmAuth = () => {
  if (authCode.value === '1234') {
    isPhoneVerified.value = true
    isPhoneChanged.value = false
    isAuthModalOpen.value = false
    authCode.value = ''
    clearInterval(timerInterval.value)
  }
}

// 변경사항 저장
const handleSave = () => {
  if (!isPhoneVerified.value) return
  Object.assign(profileStore.userInfo.profile, localProfile.value)
  emits('close')
}

/**
 * ==============================================================================
 * 7. LIFECYCLE (생명주기 훅) - [마운트 관련]
 * ==============================================================================
 */
onMounted(() => {
  Object.assign(localProfile.value, JSON.parse(JSON.stringify(profileStore.userInfo.profile)))
})

onUnmounted(() => {
  clearInterval(timerInterval.value)
})
</script>

<template>
  <!-- 화면 전체를 덮는 고정 레이어 (배경 블러 처리) -->
  <div
    class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
    @click="emits('close')"
  >
    <RoundBox
      padding="0"
      class="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300"
      @click.stop
    >
      <!-- 모달 헤더: 상단 고정 -->
      <div
        class="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 rounded-xl">
            <UserCircle class="w-5 h-5 text-indigo-600" />
          </div>
          <h2 class="text-xl font-bold text-slate-900">프로필 정보 수정</h2>
        </div>
        <button
          @click="emits('close')"
          class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- 모달 본문: 스크롤 영역 -->
      <div class="flex-1 overflow-y-auto p-8 space-y-10 custom-scroll">
        <!-- 프로필 이미지 수정 영역 -->
        <div class="flex flex-col items-center">
          <div class="relative group">
            <div
              class="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 transition-transform group-hover:scale-[1.02]"
            >
              <img
                :src="localProfile.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
                class="w-full h-full object-cover"
              />
            </div>
            <label
              class="absolute -bottom-1 -right-1 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl border-4 border-white cursor-pointer hover:bg-indigo-700 transition-all"
            >
              <Camera class="w-4 h-4" />
              <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
            </label>
          </div>
          <p class="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            클릭하여 사진 변경
          </p>
        </div>

        <!-- 기본 정보 입력 폼 -->
        <div class="space-y-6">
          <h3
            class="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"
          >
            기본 정보
          </h3>
          <div class="grid grid-cols-1 gap-6">
            <LabeledInput
              id="edit-nickname"
              v-model="localProfile.nickname"
              label="닉네임 *"
              placeholder="닉네임을 입력하세요"
              :length="{ max: 20 }"
            />

            <LabeledInput
              id="edit-name"
              :modelValue="localProfile.name"
              label="이름"
              readonly
              class="opacity-60"
            />

            <div class="flex gap-2 items-end">
              <LabeledInput
                id="edit-phone"
                :modelValue="localProfile.phone"
                @input="handlePhoneInput"
                label="휴대폰 번호 *"
                placeholder="010-0000-0000"
                :length="{ max: 13 }"
                class="flex-1"
              />
              <button
                type="button"
                @click="requestAuth"
                :disabled="!isPhoneChanged"
                class="h-[52px] px-5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap min-w-[90px]"
                :class="
                  isPhoneChanged
                    ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg'
                    : 'bg-slate-50 text-slate-300'
                "
              >
                {{ isPhoneChanged ? '인증번호 전송' : '인증 완료' }}
              </button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2 ml-1">한 줄 소개</label>
              <textarea
                v-model="localProfile.bio"
                placeholder="나를 소개해주세요."
                class="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-24 resize-none transition-all"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 동승 스타일 선택 -->
        <div class="space-y-6 pb-4">
          <h3
            class="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"
          >
            동승 스타일
          </h3>
          <div class="flex flex-wrap gap-3">
            <SelectableTag
              v-for="tag in availableStyles"
              :key="tag"
              :label="tag"
              :value="tag"
              v-model="localProfile.styles"
            />
          </div>
        </div>
      </div>

      <!-- 모달 푸터: 하단 버튼 영역 -->
      <div class="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
        <button
          @click="emits('close')"
          class="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
        >
          취소
        </button>
        <button
          @click="handleSave"
          :disabled="!isPhoneVerified"
          class="flex-[2] py-4 bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          변경사항 저장
        </button>
      </div>

      <!-- 인증번호 입력 레이어 (모달 내 오버레이) -->
      <div
        v-if="isAuthModalOpen"
        class="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300"
      >
        <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Send class="w-8 h-8 text-indigo-600" />
        </div>
        <h3 class="text-xl font-bold text-slate-900">인증번호 입력</h3>
        <p class="text-sm text-slate-500 mt-1 mb-8 text-center">
          전송된 4자리 번호를 입력해주세요.<br />(테스트 번호: 1234)
        </p>

        <input
          v-model="authCode"
          type="text"
          maxlength="4"
          placeholder="0000"
          class="w-40 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-mono text-3xl font-black tracking-[0.5em] focus:outline-none focus:border-indigo-500 transition-all mb-4"
        />
        <div class="text-rose-500 font-bold text-sm mb-8">{{ formatTimer(timer) }}</div>

        <div class="flex gap-3 w-full max-w-xs">
          <button
            @click="isAuthModalOpen = false"
            class="flex-1 py-4 text-sm font-bold text-slate-400"
          >
            취소
          </button>
          <button
            @click="confirmAuth"
            class="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold"
          >
            확인
          </button>
        </div>
      </div>
    </RoundBox>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>

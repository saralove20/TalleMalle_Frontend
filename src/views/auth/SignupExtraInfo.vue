<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { CarFront, User, Check, Send, Smartphone, Calendar, Smile } from 'lucide-vue-next'
import api from '@/api/user' // 기존 유저 API 호출용

/**
 * 1. 상태 관리
 */
const router = useRouter()

const form = ref({
  nickname: '',
  phoneNumber: '',
  birth: '',
  gender: '',
})

// 인증 관련 상태 (기존 로직 유지)
const verification = ref({
  isPhoneVerified: false,
  timer: 180,
  timerInterval: null,
  isTimerRunning: false,
})

const authCodeInput = ref('')

/**
 * 2. 포맷팅 및 타이머 로직
 */
const autoHyphen = () => {
  form.value.phoneNumber = form.value.phoneNumber
    .replace(/[^0-9]/g, '')
    .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, '$1-$2-$3')
    .replace(/(\-{1,2})$/g, '')
}

const handleBirthInput = (e) => {
  let val = e.target.value.replace(/\D/g, '')
  let result = ''
  if (val.length <= 4) result = val
  else if (val.length <= 6) result = val.slice(0, 4) + '-' + val.slice(4)
  else result = val.slice(0, 4) + '-' + val.slice(4, 6) + '-' + val.slice(6, 8)
  form.value.birth = result
}

const formattedTimer = computed(() => {
  const m = Math.floor(verification.value.timer / 60)
    .toString()
    .padStart(2, '0')
  const s = (verification.value.timer % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

/**
 * 3. 인증 로직
 */
const requestAuth = () => {
  if (form.value.phoneNumber.length < 12) {
    alert('휴대폰 번호를 올바르게 입력해주세요.')
    return
  }

  verification.value.isTimerRunning = true
  verification.value.timer = 180
  if (verification.value.timerInterval) clearInterval(verification.value.timerInterval)

  verification.value.timerInterval = setInterval(() => {
    verification.value.timer--
    if (verification.value.timer <= 0) {
      clearInterval(verification.value.timerInterval)
      verification.value.isTimerRunning = false
    }
  }, 1000)
}

const confirmAuth = (inputCode) => {
  if (inputCode === '1234') {
    // 테스트 코드
    clearInterval(verification.value.timerInterval)
    verification.value.isTimerRunning = false
    verification.value.isPhoneVerified = true
    alert('인증되었습니다.')
    authCodeInput.value = ''
  } else {
    alert('인증번호가 일치하지 않습니다.')
  }
}

/**
 * 4. 최종 제출 (Update API 호출)
 */
const handleExtraSignup = async () => {
  if (!form.value.nickname || !form.value.birth || !form.value.gender) {
    alert('모든 필수 정보를 입력해주세요.')
    return
  }
  if (!verification.value.isPhoneVerified) {
    alert('휴대폰 인증이 필요합니다.')
    return
  }

  try {
    // 백엔드에 작성한 '추가 정보 업데이트 API' 호출
    // 기존의 signup API 대신 updateSocialInfo 같은 API를 새로 만들어 사용하세요.
    const res = await api.extraSignup(form.value)

    alert('회원가입이 완료되었습니다!')
    // 쿠키 삭제 및 로그인 페이지로 이동
    document.cookie = 'ATOKEN=; max-age=0; path=/;'
    router.push('/login')
  } catch (error) {
    console.error('업데이트 실패:', error)
    alert(error.response?.data?.message || '정보 업데이트에 실패했습니다.')
  }
}

onUnmounted(() => {
  if (verification.value.timerInterval) clearInterval(verification.value.timerInterval)
})
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 font-sans"
  >
    <div
      class="signup-card bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-white/50"
    >
      <div class="p-8 pb-0 flex flex-col items-center text-center">
        <div class="flex items-center gap-2 mb-6 cursor-default">
          <div class="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
            <CarFront class="text-white w-7 h-7" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-indigo-900">탈래말래</h1>
        </div>
        <h2 class="text-xl font-bold text-slate-800">추가 정보 입력</h2>
        <p class="text-slate-500 mt-2 text-sm">
          반가워요! 원활한 서비스 이용을 위해<br />몇 가지 정보만 더 입력해주세요.
        </p>
      </div>

      <div class="p-8 space-y-5">
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-400 uppercase ml-1">닉네임</label>
          <div class="relative">
            <input
              v-model="form.nickname"
              type="text"
              placeholder="사용하실 닉네임을 입력해주세요"
              class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <Smile class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-400 uppercase ml-1">휴대폰 번호</label>
          <div class="flex gap-2">
            <input
              v-model="form.phoneNumber"
              @input="autoHyphen"
              type="tel"
              placeholder="010-0000-0000"
              maxlength="13"
              :disabled="verification.isPhoneVerified"
              class="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-100"
            />
            <button
              type="button"
              @click="requestAuth"
              :disabled="verification.isPhoneVerified"
              class="px-4 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap min-w-[80px] disabled:bg-emerald-500"
            >
              {{ verification.isPhoneVerified ? '인증 완료' : '인증번호' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">생년월일</label>
            <div class="relative">
              <input
                v-model="form.birth"
                @input="handleBirthInput"
                type="text"
                placeholder="YYYY-MM-DD"
                maxlength="10"
                class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">성별</label>
            <div class="flex gap-1 h-[54px]">
              <button
                type="button"
                @click="form.gender = 'MALE'"
                :class="
                  form.gender === 'MALE' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                "
                class="flex-1 border border-slate-200 rounded-xl font-bold transition-all text-sm"
              >
                남
              </button>
              <button
                type="button"
                @click="form.gender = 'FEMALE'"
                :class="
                  form.gender === 'FEMALE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-400'
                "
                class="flex-1 border border-slate-200 rounded-xl font-bold transition-all text-sm"
              >
                여
              </button>
            </div>
          </div>
        </div>

        <button
          @click="handleExtraSignup"
          style="margin-top: 35px"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
        >
          <span>가입 완료하기</span>
          <Check class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div
      v-if="verification.isTimerRunning"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-center">
        <div
          class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Send class="w-6 h-6 text-indigo-600" />
        </div>
        <h3 class="text-lg font-bold text-slate-900">인증번호 발송 완료</h3>
        <div class="mt-6 mb-2">
          <input
            v-model="authCodeInput"
            type="text"
            placeholder="번호 4자리"
            maxlength="4"
            class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div class="text-sm font-bold text-rose-500 mb-6">{{ formattedTimer }}</div>
        <div class="flex gap-3">
          <button
            @click="verification.isTimerRunning = false"
            class="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
          >
            취소
          </button>
          <button
            @click="confirmAuth(authCodeInput)"
            class="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg"
          >
            인증하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

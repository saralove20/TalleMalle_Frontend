<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CarFront,
  User,
  ArrowRight,
  Lock,
  CheckCircle2,
  Check,
  ShieldCheck,
  Smartphone,
  Mail,
  AtSign,
  Info,
} from 'lucide-vue-next'
import api from '@/api/user'
import * as PortOne from '@portone/browser-sdk/v2'

/**
 * ==============================================================================
 * 2. CONFIG & STORES
 * ==============================================================================
 */
const router = useRouter()

/**
 * ==============================================================================
 * 3. STATE & REFS
 * ==============================================================================
 */
// 현재 단계 (1: 본인인증 시작, 2: 정보 확인, 3: 계정 설정)
const step = ref(1)

const form = ref({
  name: '',
  phoneNumber: '',
  birth: '',
  gender: '',
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
  termCheck: false,
  impUid: '', // 본인인증 고유 번호 저장
})

const verification = ref({
  isVerified: false, // 본인인증 완료 여부
  isEmailChecked: false, // 이메일 중복 확인 완료
  isNicknameChecked: false, // 닉네임 중복 확인 완료
})

const errors = ref({
  email: '',
  nickname: '',
  password: '',
  passwordMatch: false,
})

/**
 * ==============================================================================
 * 4. METHODS - IDENTITY VERIFICATION (PortOne)
 * ==============================================================================
 */

// 포트원 본인인증
const handleCertification = async () => {
  // 1. ID를 변수에 저장해서 나중에 서버 전송 시에도 사용할 수 있게 함
  const identityVerificationId = `identity-verification-${crypto.randomUUID()}`

  try {
    // 2. 포트원 본인인증 호출
    const portoneResponse = await PortOne.requestIdentityVerification({
      storeId: import.meta.env.VITE_PORTONE_STORE_ID,
      channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
      identityVerificationId: identityVerificationId, // 변수 사용
    })

    // 3. 인증 실패 처리 (사용자가 창을 닫거나 에러 발생 시)
    if (portoneResponse.code != null) {
      // 포트원 응답에 에러 코드가 있으면 중단
      alert(`인증 실패: ${portoneResponse.message}`)
      return
    }

    // 4. 서버로 인증 결과 검증 요청
    const response = await fetch('/api/user/verify-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityVerificationId }), // 위에서 정의한 ID 전달
    })

    if (!response.ok) {
      throw new Error('서버 검증에 실패했습니다.')
    }

    const result = await response.json()
    // console.log('인증 완료:', result)

    // --- 사용자 정보 데이터 매핑 로직 ---
    if (result.userInfo) {
      const info = result.userInfo
      form.value.name = info.name
      form.value.birth = info.birthDate
      form.value.gender = info.gender === 'MALE' ? 'male' : 'female'
      if (info.phoneNumber) {
        form.value.phoneNumber = info.phoneNumber
          .replace(/[^0-9]/g, '') // 숫자만 남기기
          .replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3') // 포맷팅
      }

      verification.value.isVerified = true
      step.value = 2 // 1단계에서 2단계로 이동
      alert('본인인증이 완료되었습니다.')
    }
  } catch (error) {
    console.error('오류 발생:', error)
    alert('인증 과정 중 예상치 못한 오류가 발생했습니다.')
  }
}

/**
 * ==============================================================================
 * 5. METHODS - DUPLICATE CHECKS
 * ==============================================================================
 */

// 이메일 중복 확인
const checkEmailUnique = async () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errors.value.email = '올바른 이메일 형식이 아닙니다.'
    return
  }

  try {
    // const res = await api.checkEmail(form.value.email);
    // if(res.data.isUnique) ...
    alert('사용 가능한 이메일입니다.')
    verification.value.isEmailChecked = true
    errors.value.email = ''
  } catch (error) {
    errors.value.email = '이미 사용 중인 이메일입니다.'
    verification.value.isEmailChecked = false
  }
}

// 닉네임 중복 확인
const checkNicknameUnique = async () => {
  if (form.value.nickname.length < 1) {
    errors.value.nickname = '닉네임은 1자 이상 입력해주세요.'
    return
  }

  try {
    // const res = await api.checkNickname(form.value.nickname);
    alert('사용 가능한 닉네임입니다.')
    verification.value.isNicknameChecked = true
    errors.value.nickname = ''
  } catch (error) {
    errors.value.nickname = '이미 사용 중인 닉네임입니다.'
    verification.value.isNicknameChecked = false
  }
}

/**
 * ==============================================================================
 * 6. METHODS - STEP NAVIGATION & SIGNUP
 * ==============================================================================
 */

const goToStep3 = () => {
  if (!form.value.name || !form.value.phoneNumber) {
    alert('인증 정보가 부족합니다. 다시 시도해주세요.')
    step.value = 1
    return
  }
  step.value = 3
}

const handleSignup = async () => {
  if (!verification.value.isEmailChecked) {
    alert('이메일 중복 확인을 해주세요.')
    return
  }
  if (!verification.value.isNicknameChecked) {
    alert('닉네임 중복 확인을 해주세요.')
    return
  }
  if (form.value.password.length < 8) {
    errors.value.password = '비밀번호는 8자 이상이어야 합니다.'
    return
  }
  if (form.value.password !== form.value.passwordConfirm) {
    errors.value.passwordMatch = true
    return
  }
  if (!form.value.termCheck) {
    alert('약관에 동의해주세요.')
    return
  }

  try {
    await api.signup(form.value)
    alert('회원가입이 완료되었습니다!')
    router.push('/login')
  } catch (error) {
    const message = error.response?.data?.message || '회원가입 실패'
    alert(message)
  }
}

onMounted(() => {
  // 포트원 SDK 스크립트 로드 확인
  // if (!window.IMP) {
  //   const script = document.createElement('script')
  //   script.src = 'https://cdn.iamport.kr/v1/iamport.js'
  //   document.head.appendChild(script)
  // }
})
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 font-sans"
  >
    <div
      class="signup-card bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden relative border border-white/50"
    >
      <!-- 단계별 인디케이터 -->
      <div class="flex h-1.5 w-full bg-slate-100">
        <div
          class="h-full bg-indigo-600 transition-all duration-500"
          :style="{ width: (step / 3) * 100 + '%' }"
        ></div>
      </div>

      <div class="p-8 pb-0 flex flex-col items-center text-center">
        <div class="flex items-center gap-2 mb-6 cursor-default">
          <div class="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
            <CarFront class="text-white w-7 h-7" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-indigo-900">탈래말래</h1>
        </div>

        <h2 class="text-xl font-bold text-slate-800">
          <template v-if="step === 1">본인 인증</template>
          <template v-else-if="step === 2">정보 확인</template>
          <template v-else>계정 정보 설정</template>
        </h2>
        <p class="text-slate-500 mt-2 text-sm">
          <template v-if="step === 1"
            >서비스 이용을 위해 본인 명의의 휴대폰으로 인증해주세요.</template
          >
          <template v-else-if="step === 2">인증된 정보를 확인하고 다음으로 진행하세요.</template>
          <template v-else>로그인에 사용할 계정 정보를 설정합니다.</template>
        </p>
      </div>

      <div class="p-8 space-y-6">
        <!-- STEP 1: 본인인증 시작 -->
        <div v-if="step === 1" class="py-6 flex flex-col items-center gap-6">
          <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
            <ShieldCheck class="w-10 h-10 text-indigo-600" />
          </div>
          <button
            @click="handleCertification"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
          >
            <span>휴대폰 본인인증 시작</span>
            <Smartphone class="w-5 h-5" />
          </button>
        </div>

        <!-- STEP 2: 정보 확인 (입력칸 디자인으로 변경) -->
        <div v-if="step === 2" class="space-y-5">
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">이름</label>
            <div class="relative">
              <input
                :value="form.name"
                type="text"
                readonly
                class="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed focus:outline-none"
              />
              <User class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">휴대폰 번호</label>
            <div class="relative">
              <input
                :value="form.phoneNumber"
                type="tel"
                readonly
                class="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed focus:outline-none"
              />
              <Smartphone class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-400 uppercase ml-1">생년월일</label>
              <div class="relative">
                <input
                  :value="form.birth"
                  type="text"
                  readonly
                  class="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-center cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>
            <div class="space-y-2 mb-2">
              <label class="block text-xs font-bold text-slate-400 uppercase ml-1">성별</label>
              <div class="flex gap-1 h-[54px]">
                <div
                  :class="
                    form.gender === 'male'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-300 border-slate-200'
                  "
                  class="flex-1 flex items-center justify-center border rounded-xl font-bold text-sm"
                >
                  남
                </div>
                <div
                  :class="
                    form.gender === 'female'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-300 border-slate-200'
                  "
                  class="flex-1 flex items-center justify-center border rounded-xl font-bold text-sm"
                >
                  여
                </div>
              </div>
            </div>
          </div>

          <button
            @click="goToStep3"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>정보가 맞습니다</span>
            <ArrowRight class="w-5 h-5" />
          </button>
          <button
            @click="step = 1"
            class="w-full py-3 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors text-center"
          >
            다시 인증하기
          </button>
        </div>

        <!-- STEP 3: 계정 설정 -->
        <div v-if="step === 3" class="space-y-5">
          <!-- 이메일 중복 확인 -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">이메일 계정</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="example@tallemalle.com"
                  @input="verification.isEmailChecked = false"
                  class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Mail class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
              </div>
              <button
                type="button"
                @click="checkEmailUnique"
                class="px-4 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap min-w-[80px]"
              >
                {{ verification.isEmailChecked ? '확인됨' : '중복확인' }}
              </button>
            </div>
            <p v-if="errors.email" class="text-xs text-rose-500 ml-1">{{ errors.email }}</p>
          </div>

          <!-- 닉네임 중복 확인 -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">닉네임</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="form.nickname"
                  type="text"
                  placeholder="닉네임을 입력해주세요"
                  @input="verification.isNicknameChecked = false"
                  class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <AtSign class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
              </div>
              <button
                type="button"
                @click="checkNicknameUnique"
                class="px-4 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap min-w-[80px]"
              >
                {{ verification.isNicknameChecked ? '확인됨' : '중복확인' }}
              </button>
            </div>
            <p v-if="errors.nickname" class="text-xs text-rose-500 ml-1">{{ errors.nickname }}</p>
          </div>

          <!-- 비밀번호 -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1">비밀번호</label>
            <div class="relative">
              <input
                v-model="form.password"
                type="password"
                placeholder="영문, 숫자 포함 8자 이상"
                class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Lock class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400 uppercase ml-1"
              >비밀번호 확인</label
            >
            <div class="relative">
              <input
                v-model="form.passwordConfirm"
                type="password"
                placeholder="비밀번호를 한 번 더 입력해주세요"
                class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                :class="{ 'border-rose-500 bg-rose-50': errors.passwordMatch }"
              />
              <CheckCircle2 class="absolute right-4 top-3.5 w-5 h-5 text-slate-300" />
            </div>
            <p v-if="errors.passwordMatch" class="text-xs text-rose-500 ml-1">
              비밀번호가 일치하지 않습니다.
            </p>
          </div>

          <!-- 약관 동의 -->
          <div class="pt-2 space-y-3 border-t border-slate-50 mt-2 mb-6">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input
                v-model="form.termCheck"
                type="checkbox"
                class="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors"
                >이용약관 및 개인정보 처리방침 동의 (필수)</span
              >
            </label>
          </div>

          <div class="flex gap-3">
            <button
              @click="step = 2"
              class="px-5 py-4 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
            >
              이전
            </button>
            <button
              @click="handleSignup"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>가입 완료</span>
              <Check class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 bg-slate-50 text-center border-t border-slate-100">
        <p class="text-sm text-slate-500">
          이미 계정이 있으신가요?
          <router-link to="/login" class="text-indigo-600 font-bold hover:underline"
            >로그인</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-card {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

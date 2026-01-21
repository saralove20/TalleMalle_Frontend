<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { CarFront, User, Lock, Mail, AlertCircle } from 'lucide-vue-next'
import api from '@/api/user'

// Components
import DriverAuthLayout from '@/components/driver/DriverAuthLayout.vue'
import DriverAuthHeader from '@/components/driver/DriverAuthHeader.vue'
import DriverAuthInput from '@/components/driver/DriverAuthInput.vue'
import DriverAuthButton from '@/components/driver/DriverAuthButton.vue'

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
const autoLogin = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const loginForm = reactive({
  email: '',
  password: '',
})

const loginInputError = reactive({
  email: { errorMessage: null, isValid: false },
  password: { errorMessage: null, isValid: false },
})

/**
 * ==============================================================================
 * 4. METHODS - FUNCTIONAL (유효성 검사)
 * ==============================================================================
 */
const emailRules = () => {
  if (!loginForm.email.includes('@')) {
    loginInputError.email.errorMessage = '이메일 형식으로 입력해야합니다.'
    loginInputError.email.isValid = false
    return false
  }
  loginInputError.email.errorMessage = ''
  loginInputError.email.isValid = true
}

const passwordRules = () => {
  if (loginForm.password.length < 8) {
    loginInputError.password.errorMessage = '패스워드는 8글자 이상 입력해야합니다.'
    loginInputError.password.isValid = false
    return false
  }

  const hasUpperLetter = /[A-Z]/.test(loginForm.password)
  const hasLowerLetter = /[a-zA-Z]/.test(loginForm.password)
  const hasNumber = /[0-9]/.test(loginForm.password)
  const hasSpecial = /[!@$]/.test(loginForm.password)

  if (!(hasUpperLetter && hasLowerLetter && hasNumber && hasSpecial)) {
    loginInputError.password.errorMessage =
      '패스워드는 영문, 숫자, 특수문자(!@$)를 모두 포함해야합니다.'
    loginInputError.password.isValid = false
    return false
  }
  loginInputError.password.errorMessage = ''
  loginInputError.password.isValid = true
}

/**
 * ==============================================================================
 * 5. METHODS - API & NETWORK (로그인 처리)
 * ==============================================================================
 */
const handleLogin = async () => {
  // console.log('🚀 로그인 시도!')

  // 1. 에러 메시지 초기화
  errorMessage.value = ''

  emailRules()
  passwordRules()

  if (!loginInputError.email.isValid || !loginInputError.password.isValid) {
    return
  }

  if (!loginForm.password || !loginForm.email) {
    errorMessage.value = '모든 정보를 입력해주세요.'
    return
  }

  isLoading.value = true

  try {
    const res = await api.login(loginForm)

    // 성공 시
    if (res && res.status == 200) {
      localStorage.setItem('USERINFO', JSON.stringify(res.data));
      router.push({ name: 'driverpage' });
    }
  } catch (error) {
    // console.error('로그인 에러:', error)

    if (!error.response) {
      // 1. 인터넷 끊김 등 네트워크 에러
      errorMessage.value = '서버와 연결할 수 없습니다. 인터넷 상태를 확인해주세요.'
    } else {
      const { status, data } = error.response

      // 2. 400번대 에러 (사용자 실수)
      if (status >= 400 && status < 500) {
        errorMessage.value = data?.message || '입력하신 정보를 다시 확인해주세요.'
      }
      // 3. 500번대 에러 (서버 문제)
      else if (status >= 500 && status < 600) {
        errorMessage.value = '서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
      // 4. 그 외
      else {
        errorMessage.value = '알 수 없는 오류가 발생했습니다.'
      }
    }

  } finally {
    isLoading.value = false
  }
}

/**
 * ==============================================================================
 * 6. LIFECYCLE
 * ==============================================================================
 */
// (사용된 라이프사이클 훅 없음)
</script>

<template>
  <DriverAuthLayout theme="indigo">
    <DriverAuthHeader title="기사님 로그인" subtitle="오늘도 안전운행 하세요! 🚕" :icon="CarFront" theme="indigo" />

    <form @submit.prevent="handleLogin" class="space-y-5">
      <DriverAuthInput label="Email" v-model="loginForm.email" @blur="emailRules" placeholder="이메일을 입력하세요"
        :error-message="loginInputError.email.errorMessage" :icon="Mail" />

      <DriverAuthInput label="Password" type="password" v-model="loginForm.password" @blur="passwordRules"
        placeholder="비밀번호를 입력하세요" :error-message="loginInputError.password.errorMessage" :icon="Lock" />

      <div class="flex items-center justify-between px-1 pt-2">
        <label class="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" v-model="autoLogin"
            class="appearance-none w-5 h-5 rounded border border-slate-600 bg-slate-800 checked:bg-indigo-500 checked:border-indigo-500 transition-all" />
          <span class="text-sm text-slate-400 group-hover:text-slate-300">자동 로그인</span>
        </label>
      </div>

      <Transition enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0">
        <div v-if="errorMessage"
          class="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold shadow-sm">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <DriverAuthButton text="운행 시작하기" :is-loading="isLoading" theme-color="indigo" />
    </form>

    <div class="text-center mt-8">
      <p class="text-slate-400 text-sm">
        계정이 없으신가요?
        <RouterLink to="/driversignup" class="text-white font-bold underline decoration-indigo-500 ml-1">
          기사님 지원하기
        </RouterLink>
      </p>
    </div>
  </DriverAuthLayout>
</template>
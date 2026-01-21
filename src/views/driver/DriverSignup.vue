<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, UserPlus, AlertCircle } from 'lucide-vue-next'
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
const isLoading = ref(false)
const errorMessage = ref('')

const signupForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'DRIVER',
})

const signupInputError = reactive({
  name: { errorMessage: null, isValid: false },
  email: { errorMessage: null, isValid: false },
  password: { errorMessage: null, isValid: false },
})

/**
 * ==============================================================================
 * 4. METHODS - FUNCTIONAL (유효성 검사 및 UI 헬퍼)
 * ==============================================================================
 */
// 에러 표시 헬퍼
const showError = (msg) => {
  errorMessage.value = msg
}

// 아이디(이름) 유효성 검사
const nameRules = () => {
  if (signupForm.name.length < 5) {
    signupInputError.name.errorMessage = 'ID는 5글자 이상 입력해야합니다.'
    signupInputError.name.isValid = false
    return false
  }
  signupInputError.name.errorMessage = ''
  signupInputError.name.isValid = true
}

// 비밀번호 유효성 검사
const passwordRules = () => {
  if (signupForm.password.length < 8) {
    signupInputError.password.errorMessage = '패스워드는 8글자 이상 입력해야합니다.'
    signupInputError.password.isValid = false
    return false
  }

  const hasUpperLetter = /[A-Z]/.test(signupForm.password)
  const hasLowerLetter = /[a-zA-Z]/.test(signupForm.password)
  const hasNumber = /[0-9]/.test(signupForm.password)
  const hasSpecial = /[!@$]/.test(signupForm.password)

  if (!(hasUpperLetter && hasLowerLetter && hasNumber && hasSpecial)) {
    signupInputError.password.errorMessage =
      '패스워드는 영문, 숫자, 특수문자(!@$)를 모두 포함해야합니다.'
    signupInputError.password.isValid = false
    return false
  }

  signupInputError.password.errorMessage = ''
  signupInputError.password.isValid = true
}

/**
 * ==============================================================================
 * 5. METHODS - API & NETWORK (회원가입 처리)
 * ==============================================================================
 */
const signup = async () => {
  // 1. 에러 메시지 초기화
  errorMessage.value = ''

  // 2. 유효성 검사 실행
  nameRules()
  passwordRules()

  if (!signupInputError.name.isValid) {
    showError('아이디 입력 규칙을 확인해주세요.')
    return false
  }

  if (!signupForm.email) {
    showError('이메일을 입력해주세요.')
    return false
  }

  if (!signupInputError.password.isValid) {
    showError('비밀번호 입력 규칙을 확인해주세요.')
    return false
  }

  if (!signupForm.name || !signupForm.email || !signupForm.password) {
    showError('모든 정보를 입력해주세요.')
    return
  }

  isLoading.value = true

  try {
    const res = await api.signup(signupForm)
    // console.log('Signup success:', res)

    // 성공 시 로그인 페이지로 이동
    router.push('/driverlogin')

  } catch (error) {
    // console.error('회원가입 에러:', error)

    if (!error.response) {
      showError('서버와 연결할 수 없습니다. 인터넷 상태를 확인해주세요.')
    } else {
      const status = error.response.status
      const data = error.response.data

      // 400번대: 이미 존재하는 아이디/이메일 등
      if (status >= 400 && status < 500) {
        showError(data?.message || '입력하신 정보를 다시 확인해주세요. (중복된 ID 등)')
      }
      // 500번대: 서버 오류
      else if (status >= 500) {
        showError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      else {
        showError('회원가입에 실패했습니다.')
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
  <DriverAuthLayout theme="emerald">
    <DriverAuthHeader title="파트너 지원하기" subtitle="탈래말래의 기사님이 되어주세요 🤝" :icon="UserPlus" theme="emerald" />

    <form @submit.prevent="signup" class="space-y-5">
      <DriverAuthInput label="User Name" v-model="signupForm.name" @blur="nameRules" placeholder="사용하실 이름을 입력하세요"
        :error-message="signupInputError.name?.errorMessage" :icon="User" />

      <DriverAuthInput label="Email" v-model="signupForm.email" placeholder="사용하실 이메일을 입력하세요"
        :error-message="signupInputError.email?.errorMessage" :icon="User" />

      <DriverAuthInput label="Password" type="password" v-model="signupForm.password" @blur="passwordRules"
        placeholder="비밀번호를 설정하세요" :error-message="signupInputError.password?.errorMessage" :icon="Lock" />

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

      <DriverAuthButton text="가입 신청하기" :is-loading="isLoading" theme-color="emerald" />
    </form>

    <div class="text-center mt-8">
      <p class="text-slate-400 text-sm">
        이미 계정이 있으신가요?
        <RouterLink to="/driverlogin" class="text-white font-bold underline decoration-emerald-500 ml-1">
          로그인하기
        </RouterLink>
      </p>
    </div>
  </DriverAuthLayout>
</template>
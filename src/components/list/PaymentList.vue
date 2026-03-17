<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { computed, onMounted, shallowRef } from 'vue'
import { CreditCard } from 'lucide-vue-next'

// Stores
import { useProfileStore } from '@/stores/profile'

// Components
import RoundBox from '@/components/layout/RoundBox.vue'
import PaymentEntry from '@/components/entry/PaymentEntry.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const profileStore = useProfileStore()
const emits = defineEmits(['register-payment', 'manage-payment'])

const paymentInst = shallowRef(null)

const clientKey = 'test_ck_Gv6LjeKD8aYKA6qPb5QL8wYxAdXy'
const customerKey = 'j0SuRMJPCavNZRpeHnfBB'

/**
 * ==============================================================================
 * 3. COMPUTED (계산된 속성)
 * ==============================================================================
 */
// 기본 결제 수단을 최상단으로 올리는 정렬 로직
const sortedList = computed(() => {
  const payment = profileStore.userInfo.payment
  if (!payment || !payment.method) return []

  const list = [...payment.method]
  return list.sort((a, b) => {
    if (a.id === payment.default) return -1
    if (b.id === payment.default) return 1
    return 0
  })
})

/**
 * ==============================================================================
 * 4. METHODS - UI & LOGIC (기능 처리 및 이벤트 핸들러)
 * ==============================================================================
 */

// 토스 페이먼츠 SDK 초기회
const initTossPaymentsSDK = () => {
  const tossPayments = TossPayments(clientKey)
  paymentInst.value = tossPayments.payment({ customerKey })
}

// 결제 수단 추가 핸들러
const handleRegisterPayment = async () => {
  await paymentInst.value.requestBillingAuth({
    method: 'CARD', // 자동결제(빌링)는 카드만 지원합니다
    successUrl: window.location.origin + '/api/payment/enroll', // 요청이 성공하면 리다이렉트되는 URL
    failUrl: window.location.origin + '/fail', // 요청이 실패하면 리다이렉트되는 URL
    customerEmail: 'customer123@gmail.com',
    customerName: '김토스',
  })
}

onMounted(() => {
  initTossPaymentsSDK()
})

// 결제 수단 관리(수정/삭제) 핸들러
const handleManagePayment = (card) => {
  emits('manage-payment', card)
}
</script>

<template>
  <RoundBox padding="32px" class="flex-none">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-bold text-slate-900 flex items-center gap-2 text-left">
        <CreditCard class="w-5 h-5 text-indigo-600" /> 나의 결제 수단
      </h3>
      <button
        @click="handleRegisterPayment"
        class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
      >
        카드 추가
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PaymentEntry
        v-for="card in sortedList"
        :key="card.id"
        :card="card"
        @click="handleManagePayment(card)"
      />

      <!-- 데이터가 없을 때 -->
      <div
        v-if="
          !profileStore.userInfo.payment.method || profileStore.userInfo.payment.method.length === 0
        "
        class="flex items-center justify-center p-5 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-sm font-bold col-span-full"
      >
        등록된 결제 수단이 없습니다.
      </div>
    </div>
  </RoundBox>
</template>

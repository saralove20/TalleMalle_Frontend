<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { CreditCard, Trash2, Check } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/profile'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const profileStore = useProfileStore()

const props = defineProps({
  selectedPayment: {
    type: Object,
    required: true,
  },
})

const emits = defineEmits(['modal'])

/**
 * ==============================================================================
 * 3. METHODS - UI & LOGIC (기능 처리 및 이벤트 핸들러)
 * ==============================================================================
 */
// 모달 닫기 핸들러
const handleClose = () => {
  emits('modal', 'none')
}

// 기본 결제 수단 설정 핸들러
const setAsDefaultPayment = () => {
  if (props.selectedPayment) {
    profileStore.userInfo.payment.default = props.selectedPayment.id
    handleClose()
  }
}

// 결제 수단 삭제 핸들러
const deletePaymentMethod = () => {
  if (props.selectedPayment) {
    const list = profileStore.userInfo.payment.method
    const index = list.findIndex((c) => c.id === props.selectedPayment.id)

    if (index !== -1) {
      list.splice(index, 1)
      if (props.selectedPayment.id === profileStore.userInfo.payment.default) {
        // 기본 결제 수단을 삭제한 경우, 남은 리스트의 첫 번째 항목을 기본으로 설정 (없으면 0)
        profileStore.userInfo.payment.default = list.length > 0 ? list[0].id : 0
      }
    }
    handleClose()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
  >
    <!-- 모달 외부 클릭 시 닫기 위해 @click.stop 및 이벤트 버블링 관리 -->
    <div class="w-full max-w-md animate-in fade-in zoom-in duration-300" @click.stop>
      <div
        class="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        @click="handleClose"
      >
        <!-- 카드 정보 헤더 -->
        <div class="p-8 text-center border-b border-slate-50" @click.stop>
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

        <!-- 관리 버튼 영역 -->
        <div class="p-4 grid grid-cols-1 gap-2" @click.stop>
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
          <button @click="handleClose" class="w-full py-4 text-slate-400 font-bold text-sm">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

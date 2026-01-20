<script setup>
import { computed } from 'vue'
import { CreditCard, CheckCircle2 } from 'lucide-vue-next'
import RoundBox from '@/components/layout/RoundBox.vue'
import { useProfileStore } from '@/stores/profile'
import PaymentEntry from '@/components/entry/PaymentEntry.vue'

const profileStore = useProfileStore()

const emit = defineEmits(['add-card', 'manage-card'])

// 기본 결제 수단을 최상단으로 올리는 정렬 로직
const sortedList = computed(() => {
  const payment = profileStore.userInfo.payment
  const list = [...payment.method]
  return list.sort((a, b) => {
    if (a.id === payment.default) return -1
    if (b.id === payment.default) return 1
    return 0
  })
})

const handleAdd = () => emit('add-card')
const handleManage = (card) => emit('manage-card', card)
</script>

<template>
  <RoundBox padding="32px" class="flex-none">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-bold text-slate-900 flex items-center gap-2 text-left">
        <CreditCard class="w-5 h-5 text-indigo-600" /> 나의 결제 수단
      </h3>
      <button
        @click="handleAdd"
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
        @click="handleManage(card)"
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

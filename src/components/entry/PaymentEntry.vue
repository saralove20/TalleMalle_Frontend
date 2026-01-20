<script setup>
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()

defineProps({
  card: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div
    class="flex items-center justify-between p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all group"
  >
    <div class="flex items-center gap-4">
      <div
        class="w-10 h-7 bg-white/10 rounded flex items-center justify-center text-[8px] font-black italic uppercase"
      >
        {{ card.card_company?.includes('삼성') ? 'AMEX' : 'VISA' }}
      </div>
      <div class="text-left">
        <p class="text-xs font-bold">
          {{ card.card_company }}
          ({{ card.card_number?.split('-').pop() }})
        </p>
        <p class="text-[10px] text-slate-400">
          {{ card.id === defaultPaymentId ? '기본 결제 수단' : '결제 수단' }}
        </p>
      </div>
    </div>
    <CheckCircle2
      v-if="card.id === profileStore.userInfo.payment.default"
      class="w-5 h-5 text-indigo-400 flex-none"
    />
  </div>
</template>

<style scoped></style>

<script setup>
import { Phone, Navigation } from 'lucide-vue-next'

defineProps({
  show: Boolean,
  passengerName: String,
  location: String,
})
defineEmits(['start-drive'])
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="show"
      class="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe"
    >
      <div class="flex justify-center pt-2 pb-1">
        <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
      </div>

      <div class="px-4 pb-4 pt-2">
        <div class="flex justify-between items-center mb-3">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ passengerName }}</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ location }}</p>
          </div>
          <button
            class="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 active:scale-95 transition-transform"
          >
            <Phone class="w-4 h-4" />
          </button>
        </div>

        <button
          @click="$emit('start-drive')"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
        >
          <Navigation class="w-4 h-4" />
          경로 안내 시작
        </button>
      </div>
    </div>
  </Transition>
</template>

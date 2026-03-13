<script setup>
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { CarFront } from 'lucide-vue-next'
import TheSidebar from './components/layout/Nav.vue'
import ErrorBoundary from './components/util/ErrorBoundary.vue'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login')
const isDriverMode = computed(() => route.path.startsWith('/driver'))
const showSidebar = computed(() => !route.meta.hideNavbar && !isDriverMode.value)

const goToDriverLogin = () => router.push('/driverlogin')
</script>

<template>
  <!-- <ErrorBoundary> -->
    <div class="h-screen w-screen overflow-hidden bg-slate-50 relative flex">

      <main class="flex-1 w-full h-full relative z-0">
        <RouterView v-slot="{ Component }">
          <component :is="Component" :key="$route.fullPath" />
        </RouterView>
      </main>

      <Transition name="slide-left">
        <div v-if="showSidebar" class="absolute left-4 top-4 bottom-4 z-50 hidden md:block">
          <TheSidebar />
        </div>
      </Transition>
    </div>
  <!-- </ErrorBoundary> -->
</template>

<style>
/* 전역 스크롤바 스타일 */
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

/* 페이드 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 왼쪽 슬라이드 애니메이션 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-120%);
  opacity: 0;
}
</style>
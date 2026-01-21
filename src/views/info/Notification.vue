<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import notificationApi from '@/api/notification'
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-vue-next'

// Components
import NotificationHeader from '@/components/notification/NotificationHeader.vue'
import FilterTabButton from '@/components/notification/FilterTabButton.vue'
import NotificationList from '@/components/notification/NotificationList.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES
 * ==============================================================================
 */
const store = useNotificationStore()

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 및 Computed)
 * ==============================================================================
 */
// 상태 변수
const { notifications } = storeToRefs(store)
const isLoading = ref(false)
const isError = ref(false)
const activeFilter = ref('all')

// 상수 (옵션)
const filterOptions = [
    { key: 'all', label: '전체' },
    { key: 'matching', label: '매칭' },
    { key: 'payment', label: '결제' },
    { key: 'event', label: '이벤트' }
]

// Computed: 리스트 필터링 및 정렬
const filteredList = computed(() => {
    // 1. 필터링
    const list = activeFilter.value === 'all'
        ? notifications.value
        : notifications.value.filter(n => n.type === activeFilter.value)

    // 2. 정렬 (안 읽음 = 상단, 읽음 = 하단)
    return [...list].sort((a, b) => {
        if (a.isRead === b.isRead) return 0
        return a.isRead ? 1 : -1
    })
})

/**
 * ==============================================================================
 * 5. METHODS - API & NETWORK (데이터 로드)
 * ==============================================================================
 */
// 데이터 로드 함수 (API 에러 핸들링 포함)
const loadData = async () => {
    isLoading.value = true
    isError.value = false

    try {
        // 1. API 호출
        const res = await notificationApi.getNotificationList()

        // 2. 결과가 있으면 Store에 저장
        if (res && res.data) {
            store.setNotifications(res.data)
        }
    } catch (error) {
        // 3. 예외 처리
        // console.error("알림 데이터 로드 실패:", error)
        isError.value = true
    } finally {
        isLoading.value = false
    }
}

/**
 * ==============================================================================
 * 6. LIFECYCLE
 * ==============================================================================
 */
onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="h-full flex gap-4 p-4 overflow-hidden relative">
        <div class="hidden md:block w-20 shrink-0"></div>

        <div
            class="flex-1 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col relative bg-white/95 backdrop-blur border border-white/50 shadow-xl">

            <NotificationHeader @markAllRead="store.markAllAsRead" />

            <div class="px-10 py-4 bg-white/50 border-b border-slate-50">
                <div class="max-w-4xl mx-auto flex gap-6">
                    <FilterTabButton v-for="tab in filterOptions" :key="tab.key" :active="activeFilter === tab.key"
                        @click="activeFilter = tab.key">
                        {{ tab.label }}
                    </FilterTabButton>
                </div>
            </div>

            <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 class="w-8 h-8 animate-spin text-indigo-500" />
                <span class="text-sm font-medium">알림을 불러오는 중입니다...</span>
            </div>

            <div v-else-if="isError" class="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                <div class="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2">
                    <AlertCircle class="w-8 h-8" />
                </div>
                <div class="text-center">
                    <h3 class="text-lg font-bold text-slate-800">데이터를 불러올 수 없습니다</h3>
                    <p class="text-sm text-slate-400 mt-1">네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.</p>
                </div>
                <button @click="loadData"
                    class="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">
                    <RefreshCcw class="w-4 h-4" />
                    다시 시도
                </button>
            </div>

            <NotificationList v-else :items="filteredList" @readItem="store.markAsRead" />

        </div>
    </div>
</template>
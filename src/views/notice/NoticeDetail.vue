<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Eye } from 'lucide-vue-next' // 아이콘 직접 임포트
import { useAuthStore } from '@/stores/auth.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/api/notice/index.js' // API 임포트
import PageHeader from '@/components/layout/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notice = ref(null) // 공지사항 전체 데이터를 담을 객체
const isLoading = ref(true)

/**
 * 권한 체크: 글 수정 버튼 노출 여부
 */
const canEditNotice = computed(() => {
  return authStore.user.role === 'ROLE_ADMIN'

  // return true // 테스트용: 모든 유저에게 노출
})

const goToEdit = () => {
  router.push({ name: 'noticeEdit' , params: { idx: route.params.idx }})
}

const fetchNoticeDetail = async () => {
  try {
    const noticeId = route.params.idx // URL에서 번호 가져오기

    // 1. API 호출
    const response = await api.getNoticeDetail(noticeId)

    // 2. 데이터 할당
    notice.value = response

    // console.log('불러온 데이터:', notice.value)
  } catch (error) {
    console.error('상세 내용을 불러오는데 실패했습니다.', error)
  } finally {
    isLoading.value = false
  }
}

// 날짜 포맷팅
dayjs.extend(utc)
dayjs.extend(timezone)

const formatDate = (date) => {
  return dayjs(date).tz('Asia/Seoul').format('YYYY.MM.DD')
}

onMounted(() => {
  fetchNoticeDetail()
})
</script>

<template>
  <div class="flex h-screen p-4 gap-4 bg-[#f8fafc] font-['Pretendard'] overflow-hidden text-left">
    <div id="navbar-container" class="w-20 h-full shrink-0 rounded-[2.5rem]"></div>

    <div class="flex-1 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col">
      <PageHeader title="공지사항 상세" description="탈래말래의 새로운 소식을 확인하세요." />
      <div class="flex-1 overflow-y-auto custom-scroll p-8">
        <div class="max-w-5xl mx-auto">
          <div v-if="isLoading" class="text-center py-20">
            <p class="text-slate-400 animate-pulse">내용을 읽어오는 중입니다...</p>
          </div>

          <div
            v-else-if="notice"
            class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8 text-left"
          >
            <div class="space-y-4 border-b border-slate-50 pb-8">
              <div class="flex gap-2">
                <span
                  class="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider"
                >
                  {{ notice.tag }}
                </span>
              </div>
              <h2 class="text-3xl font-extrabold text-slate-900 leading-tight">
                {{ notice.title }}
              </h2>
              <div class="flex items-center text-slate-400 text-sm gap-4">
                <span class="flex items-center gap-1.5"
                  ><Calendar class="w-4 h-4" /> {{ formatDate(notice.createdAt) }}</span
                >
                <span class="flex items-center gap-1.5"
                  ><Eye class="w-4 h-4" /> 조회수 {{ notice.views.toLocaleString() }}</span
                >
              </div>
            </div>

            <div class="text-slate-600 leading-[1.8] text-base space-y-6">
              <p class="font-bold text-slate-800 text-lg">안녕하세요, 탈래말래 팀입니다.</p>
              <p>{{ notice.contents }}</p>
              <p>감사합니다.</p>
            </div>

            <div class="pt-10 flex justify-center gap-3">
              <button
                v-if="canEditNotice"
                @click="goToEdit"
                class="flex items-center gap-2 bg-slate-800 hover:bg-indigo-600 text-white px-8 py-4 rounded-[1.25rem] text-sm font-bold transition-all shadow-md shadow-slate-200 active:scale-95"
              >
                공지 수정
              </button>

              <button
                @click="$router.push('/notice')"
                class="px-8 py-4 bg-slate-800 text-white rounded-[1.25rem] text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(30, 27, 75, 0.05);
}
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>

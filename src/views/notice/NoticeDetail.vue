<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/notice/index.js' // API 임포트
import { Calendar, Eye } from 'lucide-vue-next' // 아이콘 직접 임포트
import PageHeader from '@/components/layout/PageHeader.vue'

const route = useRoute()
const notice = ref(null) // 공지사항 전체 데이터를 담을 객체
const isLoading = ref(true)

const fetchNoticeDetail = async () => {
  try {
    const noticeId = route.params.num // URL에서 번호 가져오기

    // 1. API 호출
    const response = await api.getNoticeDetail(noticeId)

    // 2. 데이터 할당
    // JSON 구조가 { data: { num: 1, title: "..." } } 이므로 response.data를 할당
    notice.value = response.data

    // console.log('불러온 데이터:', notice.value)
  } catch (error) {
    // console.error('상세 내용을 불러오는데 실패했습니다.', error)
  } finally {
    isLoading.value = false
  }
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
                  ><Calendar class="w-4 h-4" /> {{ notice.date }}</span
                >
                <span class="flex items-center gap-1.5"
                  ><Eye class="w-4 h-4" /> 조회수 {{ notice.views.toLocaleString() }}</span
                >
              </div>
            </div>

            <div class="text-slate-600 leading-[1.8] text-base space-y-6">
              <p class="font-bold text-slate-800 text-lg">{{ notice.content.greeting }}</p>
              <p>{{ notice.content.intro }}</p>

              <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p class="font-bold text-indigo-600">{{ notice.content.main_points_title }}</p>
                <ul class="list-disc list-inside space-y-2 text-sm text-slate-500">
                  <li v-for="(point, index) in notice.content.main_points" :key="index">
                    {{ point }}
                  </li>
                </ul>
              </div>

              <p>{{ notice.content.outro }}</p>
              <p>{{ notice.content.closing }}</p>
            </div>

            <div class="pt-10 flex justify-center">
              <button
                @click="$router.push('/notice')"
                class="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
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

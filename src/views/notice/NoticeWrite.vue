<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/notice/index.js'
import PageHeader from '@/components/layout/PageHeader.vue'

/**
 * ==============================================================================
 * 2. STATE & REFS (상태 관리)
 * ==============================================================================
 */
const router = useRouter()

// DB 구조에 맞춘 데이터 모델
const notice = ref({
  title: '',
  contents: '',
  tag: '일반',
  isPinned: 0
})

// 요청하신 5가지 태그 옵션
const tagOptions = ['일반', '업데이트', '이벤트', '점검', '긴급']

// 비활성 상태 스타일
const tagStyles = {
  공지: 'bg-yellow-50 text-yellow-600',
  업데이트: 'bg-blue-50 text-blue-500',
  이벤트: 'bg-purple-50 text-purple-500',
  점검: 'bg-orange-50 text-orange-600',
  긴급: 'bg-red-50 text-red-600',
}

// 활성 상태 스타일
const activeTagStyles = {
  공지: 'bg-yellow-400 text-white shadow-yellow-100',
  업데이트: 'bg-blue-600 text-white shadow-md',
  이벤트: 'bg-purple-600 text-white shadow-md',
  점검: 'bg-orange-500 text-white shadow-md',
  긴급: 'bg-red-600 text-white shadow-md',
}

/**
 * ==============================================================================
 * 3. METHODS (서버 연동 및 UI 핸들러)
 * ==============================================================================
 */
const submitNotice = async () => {
  if (!notice.value.title.trim() || !notice.value.contents.trim()) {
    alert('제목과 내용을 모두 입력해주세요.')
    return
  }

  try {
    // API 호출 (기존 api 구조에 맞게 설정)
    await api.createNotice(notice.value)
    alert('공지사항이 성공적으로 등록되었습니다.')
    router.push('/notice') // 등록 후 목록으로 이동
  } catch (error) {
    // console.error('등록 실패:', error)
    alert('등록 중 오류가 발생했습니다.')
  }
}

const goBack = () => {
  router.go(-1)
}
</script>

<template>
  <div class="flex h-screen p-4 gap-4 bg-[#f8fafc] font-['Pretendard'] overflow-hidden">
    <div
      id="navbar-container"
      class="w-20 h-full shrink-0 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm"
    ></div>

    <div class="flex-1 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col">
      <PageHeader
        title="공지사항 작성"
        description="새로운 소식을 작성하여 사용자들에게 알리세요."
      />

      <div class="flex-1 overflow-y-auto custom-scroll p-8">
        <div class="max-w-5xl mx-auto space-y-6">
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8">
            <div class="flex flex-wrap items-center gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-500 ml-1">카테고리</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in tagOptions"
                    :key="tag"
                    type="button"
                    @click="notice.tag = tag"
                    :class="[
                      'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-transparent',
                      notice.tag === tag
                        ? activeTagStyles[tag] + ' shadow-lg -translate-y-0.5'
                        : tagStyles[tag] + ' hover:border-slate-200',
                    ]"
                  >
                    <span v-if="notice.tag === tag" class="mr-1">✓</span>
                    {{ tag }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2 ml-auto">
                <label class="text-sm font-semibold text-slate-500 ml-1">상단 고정</label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="notice.isPinned"
                    :true-value="1"
                    :false-value="0"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                  ></div>
                  <span class="ml-3 text-sm font-medium text-slate-600">중요 공지</span>
                </label>
              </div>
            </div>

            <hr class="border-slate-50" />

            <div class="space-y-2">
              <label for="title" class="text-sm font-semibold text-slate-500 ml-1">제목</label>
              <input
                id="title"
                v-model="notice.title"
                type="text"
                placeholder="공지사항 제목을 입력하세요"
                class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label for="contents" class="text-sm font-semibold text-slate-500 ml-1"
                >상세 내용</label
              >
              <textarea
                id="contents"
                v-model="notice.contents"
                rows="12"
                placeholder="사용자들에게 전달할 내용을 자유롭게 작성하세요"
                class="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] text-slate-700 leading-relaxed placeholder:text-slate-300 focus:ring-2 focus:ring-slate-200 transition-all resize-none custom-scroll"
              ></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                @click="goBack"
                class="px-8 py-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                @click="submitNotice"
                class="px-10 py-4 rounded-2xl font-bold text-white bg-slate-900 shadow-lg shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                공지사항 등록하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap');

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

/* 입력 필드 포커스 효과 */
input:focus,
textarea:focus {
  outline: none;
}
</style>

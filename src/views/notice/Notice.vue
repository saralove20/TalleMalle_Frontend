<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, onMounted } from 'vue'
import api from '@/api/notice/index.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import NoticeTabButton from '@/components/notice/NoticeTabButton.vue'
import NoticeCard from '@/components/notice/NoticeCard.vue'
import FaqItem from '@/components/notice/FaqItem.vue'

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 관리)
 * ==============================================================================
 */
const activeTab = ref('notice')  // 현재 선택된 탭 ('notice' | 'faq')
const activeFaq = ref(null)      // 열려있는 FAQ 아이템의 인덱스
const noticeList = ref([])       // 공지사항 목록 데이터
const faqs = ref([])             // FAQ 목록 데이터

/**
 * ==============================================================================
 * 4. METHODS - FUNCTIONAL (UI 핸들러)
 * ==============================================================================
 */
/**
 * FAQ 아코디언 토글 제어
 * @param {Number} index - 선택된 FAQ 아이템의 인덱스
 */
const toggleFaq = (index) => {
  // 이미 열려있는 아이템을 다시 누르면 닫고(null), 아니면 해당 인덱스 오픈
  activeFaq.value = activeFaq.value === index ? null : index
}

/**
 * ==============================================================================
 * 5. METHODS - API SERVICE METHODS (서버 연동)
 * ==============================================================================
 */
/**
 * 공지사항 데이터 로드
 */
const getNoticeList = async () => {
  try {
    const res = await api.noticeList()
    noticeList.value = res.data || []
  } catch (error) {
    // console.error('공지사항을 불러오는 중 오류 발생:', error)
  }
}

/**
 * FAQ 데이터 로드
 */
const getFaqList = async () => {
  try {
    const res = await api.faqList()
    faqs.value = res.data || res 
  } catch (error) {
    // console.error('FAQ를 불러오는 중 오류 발생:', error)
  }
}

/**
 * ==============================================================================
 * 6. LIFECYCLE (생명주기 훅)
 * ==============================================================================
 */
onMounted(() => {
  getNoticeList()
  getFaqList()
})
</script>

<template>
  <div class="flex h-screen p-4 gap-4 bg-[#f8fafc] font-['Pretendard'] overflow-hidden">
    <div
      id="navbar-container"
      class="w-20 h-full shrink-0 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm"
    ></div>

    <div class="flex-1 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col">
      <PageHeader
        title="공지사항"
        description="탈래말래의 새로운 소식과 자주 묻는 질문을 확인하세요."
      />

      <div class="flex-1 overflow-y-auto custom-scroll p-8">
        <div class="max-w-5xl mx-auto space-y-6">
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            
            <div class="flex border-b border-slate-50">
              <NoticeTabButton 
                :active="activeTab === 'notice'" 
                @click="activeTab = 'notice'"
              >
                공지사항
              </NoticeTabButton>
              <NoticeTabButton 
                :active="activeTab === 'faq'" 
                @click="activeTab = 'faq'"
              >
                자주 묻는 질문 (FAQ)
              </NoticeTabButton>
            </div>

            <div
              v-if="activeTab === 'notice'"
              class="tab-content flex-1 overflow-y-auto custom-scroll p-8 space-y-4"
            >
              <div v-if="noticeList.length === 0" class="py-20 text-center text-slate-400">
                등록된 공지사항이 없습니다.
              </div>
              <NoticeCard v-for="item in noticeList" :key="item.id" :item="item" />
            </div>

            <div
              v-if="activeTab === 'faq'"
              class="tab-content flex-1 overflow-y-auto custom-scroll p-8 space-y-3"
            >
              <FaqItem
                v-for="(item, index) in faqs"
                :key="index"
                :question="item.question"
                :answer="item.answer"
                :is-open="activeFaq === index"
                @toggle="toggleFaq(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap');

/* 투명도와 블러가 적용된 카드 패널 스타일 */
.glass-panel {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(30, 27, 75, 0.05);
}

/* 내부 전용 커스텀 스크롤바 */
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

/* 탭 전환 시 부드럽게 올라오는 애니메이션 */
.tab-content {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
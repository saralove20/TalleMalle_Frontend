<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Stores & Composables
import { useAuthStore } from '@/stores/auth'
import { useRecruitStore } from '@/stores/recruit'
import { useWebSocket } from '@/composables/useWebSocket'
import api from '@/api/main/index.js'

// Components
import Map from '@/components/main/Map.vue'
import RecruitListPanel from '@/components/main/RecruitListPanel.vue'
import RecruitDetailPanel from '@/components/main/RecruitDetailPanel.vue'
import CreateRecruitModal from '@/components/main/CreateRecruitModal.vue'
import MapControls from '@/components/main/MapControls.vue'
import BottomActionBar from '@/components/main/BottomActionBar.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const router = useRouter()
const authStore = useAuthStore()
const recruitStore = useRecruitStore()

// 반응형 상태 구조분해 (Pinia)
// status: 'IDLE'(기본), 'OWNER'(모집장), 'JOINED'(참여자)
const { status: myStatus, recruitId: myRecruitId } = storeToRefs(recruitStore)

// WebSocket 연결 (Composable 사용)
const { isConnected, connect, sendMessage } = useWebSocket()

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언)
 * ==============================================================================
 */
// 지도 관련
const mapComponent = ref(null) // 자식 컴포넌트(TheMap) 접근용
const myLat = ref(37.498095)
const myLng = ref(127.02761)

// 데이터 관련
const recruitList = ref([])
const visibleRecruitIds = ref([])
const selectedRecruit = ref(null)
const displayRoute = ref('경로 미지정')

// UI 상태 (모달, 패널 등)
const isListPanelOpen = ref(true)
const isPanelOpen = ref(false)
const isDetailOpen = ref(false)
const isCreateModalOpen = ref(false)
const isLoading = ref(false)
const isError = ref(false)

/**
 * ==============================================================================
 * 4. COMPUTED (계산된 속성)
 * ==============================================================================
 */
// 하단 버튼 텍스트 및 상태 계산
const actionButtonState = computed(() => {
  if (myStatus.value === 'OWNER') {
    return { text: '모집 중...', disabled: true }
  } else if (myStatus.value === 'JOINED') {
    return { text: '참여 중...', disabled: true }
  } else {
    return { text: '모집 시작', disabled: false }
  }
})

// 패널 열림 여부에 따른 하단 바 위치 조정
const bottomBarClass = computed(() => {
  return isDetailOpen.value
    ? 'left-4 md:left-[920px]' // 상세 패널 열림 (오른쪽 밀림)
    : 'left-4 md:left-[500px]' // 닫힘 (기본 위치)
})

// 지도에 보이는 영역만 리스트에 표시
const displayRecruitList = computed(() => {
  if (visibleRecruitIds.value.length === 0) return []
  return recruitList.value.filter((item) => visibleRecruitIds.value.includes(item.id))
})

// 상세 패널 오픈 시 지도 중심 이동 오프셋
const mapCenterOffset = computed(() => {
  if (window.innerWidth < 768) return 0 // 모바일은 오프셋 없음
  if (isDetailOpen.value) return 440 // 상세 열림
  return 230 // 기본 (리스트 패널만 열림)
})

/**
 * ==============================================================================
 * 5. METHODS - UI & LOGIC (기능 처리 및 이벤트 핸들러)
 * ==============================================================================
 */
// 리스트 패널 토글 핸들러
const handleToggleListPanel = () => {
  isListPanelOpen.value = !isListPanelOpen.value
}

// 리스트 아이템 클릭 핸들러 (상세 패널 열기)
const handleSelectRecruit = (recruit) => {
  isListPanelOpen.value = true
  if (isDetailOpen.value && selectedRecruit.value?.id === recruit.id) {
    // 이미 선택된 거 누르면 다시 닫기
    isDetailOpen.value = false
    selectedRecruit.value = null
  } else {
    // 새로운 마커 선택 시
    selectedRecruit.value = recruit
    isDetailOpen.value = true
    // 지도 이동
    if (mapComponent.value && recruit.startLat) {
      mapComponent.value.moveToLocation(recruit.startLat, recruit.startLng)
    }
  }
}

// 채팅방 참여하기 핸들러
const handleJoinChat = () => {
  if (!selectedRecruit.value) return

  if (myStatus.value !== 'IDLE') {
    if (myRecruitId.value === selectedRecruit.value.id) {
      router.push('/chat')
      return
    }
    alert('이미 참여 중인 다른 모집이 있습니다.')
    return
  }

  // 데이터 필드명 안전하게 체크
  const recruit = selectedRecruit.value
  const startName = recruit.startPoint || recruit.start || recruit.departure || '출발지 미정'
  const destName = recruit.destPoint || recruit.dest || recruit.destination || '목적지 미정'
  const timeInfo = recruit.time || recruit.startTime || '시간 미정'

  // 선택된 모집 정보를 스토어에 저장
  const rideInfoPayload = {
    driver: {
      name: '매칭 대기중',
      car: '-',
      plate: '-',
      type: '택시',
    },
    route: {
      start: startName,
      dest: destName,
      startTime: timeInfo,
      endTime: '-',
    },
    payment: {
      total: 0,
      mine: 0,
      status: '결제 대기',
    },
  }

  recruitStore.setRideInfo(rideInfoPayload)
  recruitStore.setJoined(selectedRecruit.value.id)
  router.push('/chat')
}

// 모집 생성 제출 핸들러 (기능 로직 포함)
const handleCreateSubmit = (formData) => {
  if (myStatus.value !== 'IDLE') {
    alert('이미 진행 중인 모집이 있습니다.')
    return
  }

  // 1. 좌표 데이터 안전하게 추출
  const lat = formData.startLat || formData.lat || formData.y
  const lng = formData.startLng || formData.lng || formData.x

  if (!lat || !lng) {
    alert('출발지와 목적지의 위치 정보가 정확하지 않습니다.')
    return
  }

  // 2. 출발지/도착지 명칭 데이터 처리
  let startName = formData.startPoint || formData.start || formData.departure || '출발지'
  let destName = formData.destPoint || formData.dest || formData.destination || '목적지'

  if (typeof startName === 'object')
    startName = startName.name || startName.text || startName.address || '출발지'
  if (typeof destName === 'object')
    destName = destName.name || destName.text || destName.address || '목적지'

  const newId = Date.now()

  // 3. 데이터 통합
  const newRecruitData = {
    id: newId,
    nickname: authStore.user?.userName || '익명 승객',
    ...formData,
    startLat: lat,
    startLng: lng,
    startPoint: startName,
    destPoint: destName,
    cur: 1,
    max: formData.max || 4,
  }

  // 소켓 전송용 payload
  const payload = {
    type: 'createRecruit',
    payload: newRecruitData,
  }

  try {
    if (isConnected.value) {
      sendMessage(payload)
    }

    // UI 즉시 갱신
    recruitList.value.unshift(newRecruitData)
    recruitStore.setOwner(newId)
    recruitStore.setRideInfo({
      driver: { name: '매칭 대기중', car: '-', plate: '-', type: '택시' },
      route: {
        start: startName,
        dest: destName,
        startTime: '방금 출발',
        endTime: '-',
      },
      payment: { total: 0, mine: 0, status: '정산 대기' },
    })

    isCreateModalOpen.value = false
    alert('모집이 시작되었습니다!')
    handleSelectRecruit(newRecruitData)
  } catch (e) {
    // console.error('전송 실패:', e)
    alert('전송 중 오류가 발생했습니다.')
  }
}

// 내 위치 업데이트 핸들러 (지도 이벤트)
const handleLocationUpdate = (coords) => {
  myLat.value = coords.lat
  myLng.value = coords.lng
}

// 화면 내 리스트 업데이트 핸들러 (지도 이벤트)
const handleVisibleListUpdate = (ids) => {
  visibleRecruitIds.value = ids
}

// 지도 확대 핸들러 (UI 컨트롤)
const handleZoomIn = () => mapComponent.value?.zoomIn()

// 지도 축소 핸들러 (UI 컨트롤)
const handleZoomOut = () => mapComponent.value?.zoomOut()

// 내 위치로 이동 핸들러 (UI 컨트롤)
const handleMoveToCurrentLocation = () => mapComponent.value?.panToCurrent()

/**
 * ==============================================================================
 * 6. METHODS - DATA & NETWORK (데이터 통신 및 소켓)
 * ==============================================================================
 */
// 모집 리스트 조회 (API)
const fetchRecruits = async () => {
  isLoading.value = true
  isError.value = false
  try {
    const res = await api.getRecruitList()
    if (res && Array.isArray(res.data)) {
      recruitList.value = res.data.filter((item) => item.startLat && item.startLng)
    } else {
      recruitList.value = []
    }
  } catch (error) {
    // console.log('fetchRecruits 에러 : ', error)
    isError.value = true
    alert('데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

// WebSocket 메시지 수신 핸들러
const handleSocketMessage = (event) => {
  if (!event.data) return

  try {
    let data = JSON.parse(event.data)

    if (data.payload && typeof data.payload === 'string') {
      try {
        data = JSON.parse(data.payload)
      } catch (e) { }
    }

    if (!data || typeof data !== 'object') return

    // console.log('📩 받은 메시지 : ', data)

    // 1. 신규 모집글 등록 알림
    if (data.type === 'newRecruit' && data.payload) {
      // 현재 리스트에 같은 ID가 있는지 확인
      const isExist = recruitList.value.some(item => item.id === data.payload.id)
      // 리스트에 없을 때만 추가
      if (!isExist) {
        recruitList.value.unshift(data.payload)
      }
    }
    // 2. 모집글 수정 알림
    else if (data.type === 'updateRecruit') {
      const targetRecruit = data.payload || data.recruit
      if (targetRecruit && targetRecruit.id) {
        const idx = recruitList.value.findIndex((r) => r.id === targetRecruit.id)
        if (idx !== -1) {
          recruitList.value[idx] = targetRecruit
        }
      }
    }
    // 기사님 위치 수신 -> 지도 업데이트
    else if (data.type === 'driverLocation') {
      mapComponent.value?.updateDriverMarker(data.payload)
    }
    // 경로 데이터 수신 -> 지도에 그리기
    else if (data.type === 'drivingPath') {
      mapComponent.value?.drawPath(data.payload)
    }
  } catch (e) {
    // console.error('🚨 이상한 데이터 수신:', event.data)
  }
}

/**
 * ==============================================================================
 * 7. LIFECYCLE (생명주기 훅)
 * ==============================================================================
 */
onMounted(async () => {
  // 1. 비로그인 접근 차단
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // 2. 소켓 연결 시작
  const baseUrl = import.meta.env.VITE_WS_URL
  const wsUrl = `${baseUrl}?userId=${encodeURIComponent(authStore.user.id)}`
  connect(wsUrl, handleSocketMessage)

  // 3. 초기 데이터 로드
  await fetchRecruits()

  // 4. 상태 복구/검증 로직
  if (myStatus.value !== 'IDLE' && myRecruitId.value) {
    const targetRoom = recruitList.value.find((r) => r.id === myRecruitId.value)
    if (!targetRoom) {
      // (TODO: 실제로는 상태 검증 API 호출 필요)
    }
  }
  // console.log(`현재 상태: ${myStatus.value}, 방 ID: ${myRecruitId.value}`)
})
</script>

<template>
  <div class="relative w-full h-full">
    <Map ref="mapComponent" :recruit-list="recruitList" :center-offset="mapCenterOffset"
      @update-location="handleLocationUpdate" @marker-click="handleSelectRecruit"
      @update-visible-list="handleVisibleListUpdate" />

    <div class="absolute inset-0 z-10 flex p-4 pointer-events-none">
      <div class="hidden md:block w-20 shrink-0 h-full"></div>

      <div class="flex h-full items-center">
        <Transition name="slide-fade">
          <div v-show="isListPanelOpen"
            class="pointer-events-auto h-full shadow-xl z-20 ml-4 rounded-3xl overflow-hidden">
            <RecruitListPanel :recruit-list="displayRecruitList" :is-open="true" :selected-id="selectedRecruit?.id"
              :is-socket-connected="isConnected" @expand="isPanelOpen = true" @select="handleSelectRecruit" />
          </div>
        </Transition>

        <button v-show="!isDetailOpen" @click="handleToggleListPanel"
          class="pointer-events-auto w-6 h-12 bg-white border-y border-r border-slate-200 rounded-r-md shadow-md flex items-center justify-center hover:bg-slate-50 text-slate-400 z-10 -ml-[1px]"
          :class="{ 'self-center': isListPanelOpen }" title="목록 토글">
          <span v-if="isListPanelOpen">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </span>
          <span v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </button>
      </div>

      <Transition name="slide-shrink">
        <div v-if="isDetailOpen" class="flex h-full items-center">
          <div class="pointer-events-auto h-full">
            <RecruitDetailPanel :recruit="selectedRecruit" :is-open="isDetailOpen" :my-status="myStatus"
              :my-recruit-id="myRecruitId" @close="isDetailOpen = false" @join="handleJoinChat" />
          </div>

          <button @click="isDetailOpen = false"
            class="pointer-events-auto w-6 h-12 bg-white border-y border-r border-slate-200 rounded-r-md shadow-md flex items-center justify-center hover:bg-slate-50 text-slate-400 z-10 -ml-[1px]"
            title="상세정보 닫기">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>

    <MapControls :nickname="authStore.user?.userName" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut"
      @move-location="handleMoveToCurrentLocation" />

    <BottomActionBar :class="bottomBarClass" :route-info="displayRoute" :button-state="actionButtonState"
      @open-create="isCreateModalOpen = true" />

    <CreateRecruitModal :is-open="isCreateModalOpen" @close="isCreateModalOpen = false" @submit="handleCreateSubmit" />
  </div>
</template>
<style scoped>
/* 1. 리스트 패널 애니메이션 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-width: 400px;
  opacity: 1;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-100%);
  max-width: 0;
  opacity: 0;
  margin-left: 0 !important;
}

/* 2. 상세 패널 애니메이션 (변동 없음) */
.slide-shrink-enter-active,
.slide-shrink-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-width: 400px;
  opacity: 1;
}

.slide-shrink-enter-from,
.slide-shrink-leave-to {
  opacity: 0;
  max-width: 0;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

/* 3. 버튼 애니메이션 수정 */
button {
  transition:
    background-color 0.2s,
    color 0.2s;
}
</style>
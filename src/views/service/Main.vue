<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, onMounted, computed, watch } from 'vue'
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
const { isConnected, connect } = useWebSocket()

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
// 시간 포맷팅 함수
const formatTime = (dateString) => {
  if (!dateString) return '시간 미정'

  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}월 ${day}일 ${hours}:${minutes}`
}

// 출발지 키워드 검색 핸들러
const handleKeywordSearch = (keyword) => {
  if (!keyword || !keyword.trim()) {
    alert("검색어를 입력해주세요")
    return
  }

  if (mapComponent.value) {
    mapComponent.value.searchPlace(keyword)
  }
}

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
const handleJoinChat = async () => {
  if (!selectedRecruit.value) {
    return
  }

  if (myStatus.value !== 'IDLE') {
    if (myRecruitId.value === selectedRecruit.value.id) {
      router.push(`/chat/${selectedRecruit.value.id}`)
      return
    }
    alert('이미 참여 중인 다른 모집이 있습니다.')
    return
  }

  try {
    const recruitIdx = selectedRecruit.value.id

    const res = await api.joinRecruit(recruitIdx)

    if (res.data.result) {
      const recruit = selectedRecruit.value
      const startName = recruit.startPoint || recruit.start || recruit.departure || '출발지 미정'
      const destName = recruit.destPoint || recruit.dest || recruit.destination || '목적지 미정'
      const timeInfo = recruit.time || recruit.startTime || '시간 미정'

      const rideInfoPayload = {
        driver: { name: '매칭 대기중', car: '-', plate: '-', type: '택시' },
        route: { start: startName, dest: destName, startTime: timeInfo, endTime: '-' },
        payment: { total: 0, mine: 0, status: '결제 대기' },
      }

      recruitStore.setRideInfo(rideInfoPayload)
      recruitStore.setJoined(recruitIdx)

      alert('성공적으로 참여했습니다!')
      router.push(`/chat/${recruitIdx}`)
    }
  } catch (error) {
    console.log("🚨 채팅방 참여 API 에러:", error)
    alert("참여 중 서버 오류가 발생했습니다. 다시 시도해주세요.")
  }

}

// 모집글 생성 함수
const handleCreateSubmit = async (formData) => {
  if (myStatus.value !== 'IDLE') {
    alert('이미 진행 중인 모집이 있습니다.')
    return
  }

  // 오늘 날짜 객체 생성 후, 입력받은 시간('HH:mm') 세팅
  const targetDate = new Date()
  if (formData.time) {
    const [hours, minutes] = formData.time.split(':')
    targetDate.setHours(Number(hours), Number(minutes), 0, 0)
  }

  // formData를 백엔드 Dto에 맞게 변환
  const reqData = {
    startPointName: formData.startPoint || formData.start,
    startLat: formData.startLat || formData.lat || formData.y,
    startLng: formData.startLng || formData.lng || formData.x,
    destPointName: formData.destPoint || formData.dest,
    destLat: formData.destLat,
    destLng: formData.destLng,
    departureTime: targetDate.toISOString(),
    maxCapacity: formData.max || 4,
    description: formData.description,
  }

  try {
    console.log('백엔드로 전송되는 모집글 데이터:', reqData)
    const res = await api.registerRecruit(reqData)

    const newRecruit = res.data.result

    if (newRecruit && newRecruit.idx) {
      recruitStore.setOwner(newRecruit.idx)
      displayRoute.value = `${newRecruit.startPointName} → ${newRecruit.destPointName}`

      if (authStore.user) {
        authStore.user.status = 'OWNER'
      }
    }

    isCreateModalOpen.value = false
    alert("모집이 시작되었습니다!")
  } catch (error) {
    console.log("🚨 모집글 등록 에러 발생 : ", error)
    alert("모집글 등록 중 오류가 발생했습니다. 다시 시도해주세요.")
  }
}

// 모집글 나가기 함수
const handleLeaveRecruit = async () => {
  if (!confirm("정말 이 모집에서 나가시겠습니까?")) return;

  try {
    const res = await api.leaveRecruit(selectedRecruit.value.id);
    if (res.data.result) {
      alert("성공적으로 방에서 나왔습니다.");
      // ⭐️ API 성공 시 스토어 수동 초기화 보장
      recruitStore.clear();
      if (authStore.user) authStore.user.status = 'IDLE';
    }
  } catch (e) {
    alert("오류가 발생했습니다.");
  }
}

// 모집글 등록 시 상태 동기화 함수
const syncRecruitStatus = () => {
  const user = authStore.user

  console.log('현재 유저 상태:', user?.status)

  if (!user || !user.idx) {
    return
  }

  const myIdx = user.idx

  // 전체 모집글 리스트를 순회하며 내가 어디 속해있는지 찾기
  for (const room of recruitList.value) {
    // 방장이면
    if (room.ownerId === myIdx) {
      recruitStore.setOwner(room.id)
      displayRoute.value = `${room.start} → ${room.dest}`
      user.status = 'OWNER'
      return
    }

    // 참여자이면
    const isParticipant = room.participationList?.some(p => p.userIdx === myIdx || p.useridx === myIdx)
    if (isParticipant) {
      recruitStore.setJoined(room.id)
      displayRoute.value = `${room.start} → ${room.dest}`
      user.status = 'JOINED'
      return
    }
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
// 타이머 변수 선언 (디바운싱용)
let mapSearchTimeout = null

// 화면 기반 모집글 검색 핸들러
const handleSearchRecruits = (bounds) => {
  // 디바운싱: 0.3초 안에 다시 요청이 오면 기존 요청 취소!
  if (mapSearchTimeout) clearTimeout(mapSearchTimeout)

  mapSearchTimeout = setTimeout(async () => {
    try {
      //  백엔드 API 호출
      const res = await api.searchRecruits(bounds)
      const targetData = res.data.result

      console.log('📍 [화면 이동] 백엔드에서 불러온 방 목록:', targetData)

      if (Array.isArray(targetData)) {
        let mappedData = targetData.map((item) => ({
          ...item,
          id: item.idx,
          start: item.startPointName,
          dest: item.destPointName,
          time: formatTime(item.departureTime),
          cur: item.currentCapacity,
          max: item.maxCapacity
        }))

        // 내 방이 화면 밖으로 나가서 잘렸을 경우를 대비해 내 방 정보는 강제 유지
        if (myRecruitId.value) {
          const myRoom = recruitList.value.find(r => r.id === myRecruitId.value)
          // 새로 받아온 데이터(화면 안)에 내 방이 없다면 배열에 끼워 넣기
          if (myRoom && !mappedData.find(r => r.id === myRoom.id)) {
            mappedData.push(myRoom)
          }
        }

        // 리스트 갈아끼우기 (watch 발동 -> 상태 재검사 -> 마커 다시 그림)
        recruitList.value = mappedData.filter((item) => item.startLat && item.startLng)

        console.log('✅ [프론트엔드] 화면에 그려질 최종 방 목록:', recruitList.value)
      } else {
        recruitList.value = []
      }

    } catch (error) {
      console.error("지도 검색 에러:", error)
    }
  }, 300) // 0.3초 대기
}

// 모집 리스트 조회 (API)
const fetchRecruits = async () => {
  isLoading.value = true
  isError.value = false

  try {
    // 모집 리스트 조회 후 res에 담아줌
    const res = await api.getRecruitList()

    // 응답 데이터에서 배열에 담긴 result 담기
    const targetData = res.data.result;

    if (Array.isArray(targetData)) {
      const mappedData = targetData.map((item) => ({
        ...item,
        id: item.idx,
        start: item.startPointName,
        dest: item.destPointName,
        time: formatTime(item.departureTime),
        cur: item.currentCapacity,
        max: item.maxCapacity
      }))

      recruitList.value = mappedData.filter((item) => item.startLat && item.startLng)
    } else {
      recruitList.value = [];
    }


  } catch (error) {
    console.log('fetchRecruits 에러 : ', error)
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
    const data = JSON.parse(event.data)
    if (!data || typeof data !== 'object') return

    // 백엔드에서 메시지가 이중 포장되어 왔을 경우 한번 벗기기
    let realType = data.type
    let realPayload = data.payload

    if (data.payload && data.payload.type && data.payload.payload !== undefined) {
      realType = data.payload.type
      realPayload = data.payload.payload
    }

    console.log(`📩 소켓 수신 완료 (실제 처리 타입: ${realType})`)

    // 신규 모집글 등록
    if (realType === 'newRecruit' && realPayload) {
      const item = realPayload
      const mappedItem = {
        ...item,
        id: item.idx,
        start: item.startPointName,
        dest: item.destPointName,
        time: formatTime(item.departureTime),
        cur: item.currentCapacity,
        max: item.maxCapacity
      }

      const isExist = recruitList.value.some(r => r.id === mappedItem.id)
      if (!isExist) {
        recruitList.value = [mappedItem, ...recruitList.value]
      }
    }

    // 모집글 업데이트 (누군가 참여하거나 나갔을 때)
    else if (realType === 'updateRecruit' && realPayload) {
      const item = realPayload
      const mappedItem = {
        ...item,
        id: item.idx,
        start: item.startPointName,
        dest: item.destPointName,
        time: formatTime(item.departureTime),
        cur: item.currentCapacity,
        max: item.maxCapacity
      }

      const idx = recruitList.value.findIndex(r => r.id === mappedItem.id)
      if (idx !== -1) {
        recruitList.value[idx] = mappedItem
      } else {
        recruitList.value.unshift(mappedItem)
      }

      // 배열 참조를 완전히 갱신
      recruitList.value = [...recruitList.value]
    }

    // 모집글 삭제 (방장이 폭파했을 때)
    else if (realType === 'deleteRecruit' && realPayload) {
      const deletedId = Number(realPayload)

      if (myRecruitId.value === deletedId) {
        alert("방장에 의해 모집이 취소되어 대기 상태로 전환합니다.")
        recruitStore.clear()
        if (authStore.user) {
          authStore.user.status = "IDLE"
        }
      }

      // 리스트에서 해당 방 제거
      recruitList.value = recruitList.value.filter(r => r.id !== deletedId)

      // 상세 패널을 열어서 보고있는 경우 
      if (selectedRecruit.value?.id === deletedId) {
        isDetailOpen.value = false
        selectedRecruit.value = null

        if (myRecruitId.value !== deletedId) {
          alert("방장에 의해 모집이 취소되었습니다.")
        }
      }
    }

    // 기사님 위치 수신
    else if (realType === 'driverLocation') {
      mapComponent.value?.updateDriverMarker(realPayload)
    }

    // 경로 데이터 수신
    else if (realType === 'drivingPath') {
      mapComponent.value?.drawPath(realPayload)
    }

  } catch (e) {
    console.error('🚨 소켓 데이터 파싱 에러:', e)
  }
}

/**
 * ==============================================================================
 * 7. LIFECYCLE (생명주기 훅)
 * ==============================================================================
 */
watch(() => recruitList.value, () => {
  syncRecruitStatus()
}, { deep: true })

onMounted(async () => {
  // 비로그인 접근 차단
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // 소켓 연결 시작
  const wsUrl = 'ws://localhost:8080/ws'
  connect(wsUrl, handleSocketMessage)

  // 초기 데이터 로드
  // await fetchRecruits()

  // 유저의 Status 확인
  syncRecruitStatus()

  console.log(`현재 상태: ${myStatus.value}, 방 ID: ${myRecruitId.value}`)
})
</script>

<template>
  <div class="relative w-full h-full">
    <Map ref="mapComponent" :recruit-list="recruitList" :center-offset="mapCenterOffset"
      @update-location="handleLocationUpdate" @marker-click="handleSelectRecruit"
      @update-visible-list="handleVisibleListUpdate" @bounds-changed="handleSearchRecruits" />

    <div class="absolute inset-0 z-10 flex p-4 pointer-events-none">
      <div class="hidden md:block w-20 shrink-0 h-full"></div>

      <div class="flex h-full items-center">
        <Transition name="slide-fade">
          <div v-show="isListPanelOpen"
            class="pointer-events-auto h-full shadow-xl z-20 ml-4 rounded-3xl overflow-hidden">
            <RecruitListPanel :recruit-list="displayRecruitList" :is-open="true" :selected-id="selectedRecruit?.id"
              :is-socket-connected="isConnected" @expand="isPanelOpen = true" @select="handleSelectRecruit"
              @search="handleKeywordSearch" />
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

    <MapControls :nickname="authStore.user?.nickname" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut"
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
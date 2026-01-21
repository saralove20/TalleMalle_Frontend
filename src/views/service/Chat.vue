<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API -> 컴포넌트)
 * ==============================================================================
 */
import { ref, reactive, onMounted, onUnmounted, provide } from 'vue'
import { storeToRefs } from 'pinia'

// Stores & API
import { useAuthStore } from '@/stores/auth'
import { useRecruitStore } from '@/stores/recruit'
import api from '@/api/chat'

// Components
import ChatPanel from '@/components/chat/ChatPanel.vue'
import RideSidebar from '@/components/chat/RideSidebar.vue'
import ProfileModal from '@/components/chat/ProfileModal.vue'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const authStore = useAuthStore()
const recruitStore = useRecruitStore()
const { user } = storeToRefs(authStore)
const { recruitId } = storeToRefs(recruitStore)

// 하위 컴포넌트(Header, MemberList)에서 내 이름을 쓸 수 있도록 전달
const myUserName = ref('익명')
provide('myUserName', myUserName)

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언)
 * ==============================================================================
 */
// WebSocket 관련
const isConnected = ref(false)
let socket = null

// 사용자 정보
const myUserId = ref(`user_${Math.floor(Math.random() * 1000)}`)
const myUserImg = ref('')

// 데이터 관련
const messages = ref([]) // 채팅 메시지 목록
const usersData = ref({}) // 참여자 정보 (User Map)
const rideInfo = ref(null) // 여정 정보

// UI 상태
const isLoading = ref(false)
const isProfileModalOpen = ref(false)

// 프로필 모달 데이터
const currentProfile = reactive({
  id: '',
  name: '',
  lv: '',
  img: '',
  meta: '',
  bio: '',
  score: 0,
  rank: '',
  stats: { time: 0, silent: 0 },
  reviews: [],
  isBlocked: false,
})

/**
 * ==============================================================================
 * 4. METHODS - UI INTERACTION (화면 조작 및 기능 처리)
 * ==============================================================================
 */
// 메시지 전송 처리
const handleSendMessage = (textToSend) => {
  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  // Optimistic Update (낙관적 업데이트)
  messages.value.push({
    id: Date.now(),
    type: 'me',
    text: textToSend,
    time: timeStr,
  })

  // 실제 서버 전송
  if (socket && isConnected.value) {
    const payload = {
      userId: myUserId.value,
      userName: myUserName.value,
      userImg: myUserImg.value,
      text: textToSend,
      timestamp: now.toISOString(),
    }
    socket.send(JSON.stringify(payload))
  } else {
    messages.value.push({
      id: Date.now() + 1,
      type: 'system',
      text: '⚠️ 메시지를 전송할 수 없습니다 (연결 끊김)',
    })
  }
}

// 이미지 전송 처리
const handleSendImage = (imageData) => {
  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  // 1. 내 화면에 이미지 표시
  messages.value.push({
    id: Date.now(),
    type: 'image',
    isMe: true,
    text: imageData,
    time: timeStr,
  })

  // 2. 소켓 전송
  if (socket && isConnected.value) {
    const payload = {
      type: 'image',
      userId: myUserId.value,
      userName: myUserName.value,
      userImg: myUserImg.value,
      text: imageData,
      timestamp: now.toISOString(),
    }
    socket.send(JSON.stringify(payload))
  }
}

// 프로필 모달 열기
const handleOpenProfile = (userId) => {
  const data = usersData.value[userId] || usersData.value['Unknown']
  Object.assign(currentProfile, {
    id: userId,
    ...data,
    isBlocked: false,
  })
  isProfileModalOpen.value = true
}

/**
 * ==============================================================================
 * 5. METHODS - DATA & NETWORK (데이터 통신 및 소켓)
 * ==============================================================================
 */
// 초기 데이터 조회 (API)
const fetchInitialData = async () => {
  isLoading.value = true
  try {
    // 스토어에 여정 정보가 있는지 확인
    const storeRideInfo = recruitStore.currentRideInfo

    // API 병렬 호출
    const [historyData, participantsData, apiRideDetail] = await Promise.all([
      api.getChatHistory(),
      api.getChatParticipants(),
      !storeRideInfo ? api.getRideDetail() : Promise.resolve(null),
    ])

    messages.value = historyData || []
    usersData.value = participantsData || {}

    // 스토어 데이터 우선 적용, 없으면 API 데이터 사용
    rideInfo.value = storeRideInfo || apiRideDetail || null

    // Unknown 유저 안전장치
    if (!usersData.value['Unknown']) {
      usersData.value['Unknown'] = {
        name: '알수없음',
        lv: 'LV. 1',
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
        meta: '정보 없음',
        bio: '',
        score: 50,
        rank: '-',
        stats: { time: 0, silent: 0 },
        reviews: [],
      }
    }
  } catch (error) {
    // console.error('fetchInitialData 실패:', error)
    messages.value = [
      { id: 1, type: 'date', text: 'Today' },
      { id: 2, type: 'system', text: `⚠️ 데이터를 불러오는데 실패했습니다: ${error.message}` },
    ]
  } finally {
    isLoading.value = false
  }
}

// WebSocket 연결 설정
const connectWebSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) return

  const wsUri = import.meta.env.VITE_WS_URL
  socket = new WebSocket(wsUri)

  // 연결 성공
  socket.addEventListener('open', () => {
    // console.log('WEBSOCKET CONNECTED')
    isConnected.value = true

    // 입장 메시지 전송
    const enterMsg = {
      type: 'enter',
      userId: myUserId.value,
      userName: myUserName.value,
      userImg: myUserImg.value,
      text: '입장했습니다.',
      user: {
        name: myUserName.value,
        img: myUserImg.value,
        lv: 'LV. 5', // TODO: 실제 데이터 연동
        meta: '방금 접속',
        bio: '반갑습니다!',
        score: 50,
        rank: '일반',
        stats: { time: 0, silent: 0 },
        reviews: [],
      },
    }
    socket.send(JSON.stringify(enterMsg))

    window.addEventListener('beforeunload', sendLeaveMessage)
  })

  // 메시지 수신
  socket.addEventListener('message', (e) => {
    try {
      const parsedData = JSON.parse(e.data)

      // [수정 1] 글로벌 타입 필터링 (여기가 핵심입니다!)
      // DriverPage에서 쓰는 타입들이 들어오면 아예 무시합니다.
      const ignoreTypes = ['driverLocation', 'drivingPath', 'newRecruit', 'createRecruit']
      if (parsedData.type && ignoreTypes.includes(parsedData.type)) return

      // [수정 2] payload 추출
      const payload = parsedData.payload !== undefined ? parsedData.payload : parsedData
      handleSocketMessage(payload)
    } catch (err) {
      handleSocketMessage(e.data)
    }
  })

  // 연결 종료
  socket.addEventListener('close', () => {
    // console.log('WEBSOCKET CLOSED')
    isConnected.value = false
    window.removeEventListener('beforeunload', sendLeaveMessage)
  })

  // 에러 발생
  socket.addEventListener('error', (err) => {
    // console.error('WEBSOCKET ERROR', err)
    isConnected.value = false
  })
}

// 수신된 메시지 처리 핸들러
const handleSocketMessage = (data) => {
  if (!socket) return

  // 이중 인코딩 처리
  if (typeof data === 'string') {
    try {
      if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
        const doubleParsed = JSON.parse(data)
        if (typeof doubleParsed === 'object' && doubleParsed !== null) {
          data = doubleParsed
        }
      }
    } catch (e) {}
  }
  // 1. [내용물 검사] 지도 데이터 특유의 속성(Key)이 있으면 즉시 차단
  // 스크린샷의 데이터 구조: { lat, lng } 또는 { startLat, destLat, nickname }
  if (data.lat !== undefined || data.lng !== undefined || data.startLat !== undefined || data.bearing !== undefined) {
    return
  }

  // 2. [타입 검사] DriverPage에서 사용하는 타입명이 있다면 차단
  const ignoreTypes = ['driverLocation', 'drivingPath', 'newRecruit', 'createRecruit']
  if (data.type && ignoreTypes.includes(data.type)) return

  // 3. [방 번호 검사] recruitId가 있는데 내 방과 다르면 차단
  if (data.recruitId && String(data.recruitId) !== String(recruitId.value)) return

  // 4. [필수 데이터 검사] 채팅 메시지의 자격 요건 확인
  // 텍스트(text)도 없고, 이미지(image) 타입도 아니면 채팅으로 인정하지 않음
  // (이 부분이 없으면 {lat:37...} 같은 객체가 강제로 채팅창에 뜸)
  const hasText = data.text || data.msg || data.message || data.content
  const isSpecialType = ['image', 'enter', 'leave', 'system'].includes(data.type)

  if (!hasText && !isSpecialType) return
  // ============================================================

  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  let textContent = ''
  let userId = 'Unknown'
  let userName = null
  let userImg = null
  let msgType = data.type || 'other'

  if (typeof data === 'object' && data !== null) {
    textContent = data.text || data.msg || data.message || data.content
    // [중요 수정] 텍스트가 없다고해서 JSON.stringify(data)를 하는 코드를 삭제했습니다.
    // 위 필터링을 통과했더라도 텍스트가 없으면 빈 문자열로 둡니다.
    if (!textContent && msgType !== 'image') {
       return // 텍스트도 없고 이미지도 아니면 그리지 않음
    }
    
    userId = data.userId || data.sender || 'Unknown'
    userName = data.userName || data.name
    userImg = data.userImg || data.img
  } else {
    textContent = String(data)
  }

  // 1. 퇴장 처리
  if (msgType === 'leave') {
    if (usersData.value[userId]) {
      delete usersData.value[userId]
      // console.log(`[ChatView] 유저 퇴장: ${userName} (${userId})`)
    }
    return
  }

  // 2. 내가 보낸 메시지 무시
  if (userId === myUserId.value) return

  // 3. 유저 정보 갱신/등록
  if (userId !== 'Unknown' && !usersData.value[userId]) {
    const newUserData = data.user || {}
    usersData.value[userId] = {
      name: userName || '이름 없음',
      img: userImg || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      lv: newUserData.lv || 'LV. 1',
      meta: newUserData.meta || '정보 없음',
      bio: newUserData.bio || '안녕하세요!',
      score: newUserData.score || 50,
      rank: newUserData.rank || '-',
      stats: newUserData.stats || { time: 0, silent: 0 },
      reviews: newUserData.reviews || [],
    }
  }

  // 4. 입장(enter) 시 Handshake
  if (msgType === 'enter') {
    if (socket && isConnected.value) {
      const existMsg = {
        type: 'exist',
        userId: myUserId.value,
        userName: myUserName.value,
        userImg: myUserImg.value,
        text: '',
      }
      socket.send(JSON.stringify(existMsg))
    }
    return
  }

  // 5. exist 메시지 무시
  if (msgType === 'exist') return

  // 6. 메시지 목록 추가
  const senderInfo = usersData.value[userId] || usersData.value['Unknown']
  const displayUser = {
    ...senderInfo,
    name: userName || senderInfo.name,
    img: userImg || senderInfo.img,
  }

  messages.value.push({
    id: Date.now() + Math.random(),
    type: msgType,
    userId: userId,
    text: textContent,
    time: timeStr,
    user: displayUser,
  })
}

// 퇴장 메시지 전송 (내부용)
const sendLeaveMessage = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const leaveMsg = {
      type: 'leave',
      userId: myUserId.value,
      userName: myUserName.value,
    }
    socket.send(JSON.stringify(leaveMsg))
  }
}

/**
 * ==============================================================================
 * 6. LIFECYCLE (생명주기 훅)
 * ==============================================================================
 */
onMounted(async () => {
  // 1. 내 정보 설정
  if (user.value) {
    myUserId.value = user.value.id || user.value.userId
    myUserName.value = user.value.name || user.value.nickname || user.value.userName || '익명'
    myUserImg.value = user.value.img || user.value.profileImage || user.value.userImg || ''
  } else {
    console.warn('[auth] 로그인 사용자 정보가 없습니다. localStorage USERINFO 확인 필요')
  }

  // 2. 초기 데이터 로드
  await fetchInitialData()

  // 3. 웹소켓 연결
  connectWebSocket()
})

onUnmounted(() => {
  sendLeaveMessage()
  if (socket) {
    socket.close()
  }
})
</script>

<template>
  <div class="h-full flex gap-4 p-4 overflow-hidden relative">
    <div class="hidden md:block w-20 shrink-0"></div>

    <main class="flex-1 flex gap-6 overflow-hidden h-[calc(100vh-2rem)]">
      <div
        v-if="isLoading"
        class="flex-1 flex items-center justify-center bg-white/50 rounded-[2.5rem]"
      >
        <p class="text-slate-500 font-bold animate-pulse">대화 내용을 불러오는 중...</p>
      </div>

      <ChatPanel
        v-else
        :messages="messages"
        :ride-info="rideInfo"
        :is-connected="isConnected"
        @send-message="handleSendMessage"
        @send-image="handleSendImage"
        @open-profile="handleOpenProfile"
      />

      <RideSidebar
        :user-profiles="usersData"
        :ride-info="rideInfo"
        @open-profile="handleOpenProfile"
      />
    </main>

    <ProfileModal
      :is-open="isProfileModalOpen"
      :profile="currentProfile"
      @close="isProfileModalOpen = false"
    />
  </div>
</template>

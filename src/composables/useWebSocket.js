/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, onUnmounted } from 'vue'

/**
 * ==============================================================================
 * 2. GLOBAL STATE (싱글톤: 앱 전체에서 소켓 상태 공유)
 * ==============================================================================
 */
// Socket 인스턴스를 관리할 변수
const ws = ref(null)
const isConnected = ref(false)

// 재연결을 위한 타이머 ID 저장소
let reconnectTimer = null

/**
 * ==============================================================================
 * 3. COMPOSABLE DEFINITION
 * ==============================================================================
 */
export function useWebSocket() {

    /**
     * ==============================================================================
     * 4. METHODS - SOCKET LOGIC
     * ==============================================================================
     */
    // 소켓 연결 함수
    const connect = (url, onMessageCallback) => {
        // 이미 연결되어 있다면 패스
        if (ws.value?.readyState === WebSocket.OPEN) {
            return
        }

        // 소켓 객체 생성
        ws.value = new WebSocket(url)

        // 연결 성공 시
        ws.value.onopen = () => {
            // console.log(`✅ Socket Connected : ${url}`)
            isConnected.value = true

            // 연결 성공되면 재연결 타이머 해제
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
        }

        // [이벤트] 메시지 수신 시 
        ws.value.onmessage = (event) => {
            // 콜백이 없으면 무시
            if (!onMessageCallback) {
                return
            }
            // event.data가 있는지 검증
            if (event.data) {
                onMessageCallback(event)
            }
        }

        // 에러 발생 시
        ws.value.onerror = (error) => {
            console.error("❌ Socket Error : ", error)
            isConnected.value = false
            // 에러 발생 시 재연결 시도 유도
            ws.value.close()
        }

        // 연결 종료 시
        ws.value.onclose = () => {
            // console.log("⚠️ Socket disConnected")
            isConnected.value = false
            ws.value = null

            // 의도적으로 끈 게 아니면 3초 뒤 재연결 시도
            if (!reconnectTimer) {
                // console.log("🔄 3초 뒤 재연결을 시도합니다...")
                reconnectTimer = setTimeout(() => {
                    connect(url, onMessageCallback)
                }, 3000)
            }
        }
    }

    // 메시지 전송 함수
    const sendMessage = (data) => {
        if (ws.value && isConnected.value) {
            ws.value.send(JSON.stringify(data))
        } else {
            console.warn("🚫 소켓이 연결되지 않아 메세지를 보낼 수 없습니다.")
        }
    }

    // 연결 해제 함수
    const disconnect = () => {
        // 재연결 타이머 중단
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }

        // 소켓 종료
        if (ws.value) {
            ws.value.close()
            ws.value = null
        }
        isConnected.value = false
    }

    /**
     * ==============================================================================
     * 5. LIFECYCLE
     * ==============================================================================
     */
    // 컴포넌트가 사라질 때 자동 연결 해제
    onUnmounted(() => {
        disconnect()
    })

    /**
     * ==============================================================================
     * 6. RETURN
     * ==============================================================================
     */
    return {
        isConnected,
        connect,
        sendMessage,
        disconnect
    }
}
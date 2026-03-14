import api from '@/plugins/axiosinterceptor'

/**
 * ==============================================================================
 * API METHODS
 * ==============================================================================
 */

/**
 * 이전 채팅 내역 가져오기
 * @returns {Promise<Array>} 채팅 메시지 배열
 */
const getChatHistory = async (recruitId) => {
  const response = await api.get(`/chat/${recruitId}/messages`)
  return response.data
}

/**
 * 채팅방 참여자 목록 가져오기
 * @returns {Promise<Object>} 사용자 ID를 키로 갖는 유저 정보 객체
 */
const getChatParticipants = async () => {
  const response = await api.get('/json/participants')
  return response.data
}

/**
 * 여정 상세 정보 가져오기
 * @returns {Promise<Object>} 여정 정보 객체
 */
const getRideDetail = async (recruitId) => {
  const response = await api.get(`/recruits/${recruitId}`)
  return response.data
}

export default {
  getChatHistory,
  getChatParticipants,
  getRideDetail,
}

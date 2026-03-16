/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import api from '@/plugins/axiosinterceptor'

/**
 * ==============================================================================
 * 5. METHODS - API SERVICE METHODS (공지사항 및 FAQ 관련 API)
 * ==============================================================================
 */

/**
 * 공지사항 작성
 * @param {Object} req - 등록할 공지사항 데이터 (title, contents, tag, is_pinned 등)
 * @returns {Promise<Object>} 서버 처리 결과 및 생성된 게시글 정보
 */
const createNotice = async (req) => {
  const res = await api.post('/notices', req)
  return res.data
}

/**
 * 공지사항 수정
 * @param {String|Number} noticeId - 공지사항 고유 식별자
 * @param {Object} req - 수정할 공지사항 데이터 (title, contents, tag, is_pinned 등)
 */
const updateNotice = async (noticeId, req) => {
  const res = await api.patch(`/notices/${noticeId}`, req)
  return res.data
}

/**
 * 공지사항 전체 목록 조회
 * @param {Object} req - 필터링이나 페이지네이션 관련 파라미터
 * @returns {Promise<Array>} 공지사항 리스트 데이터
 */
const noticeList = async (req) => {
  const res = await api.get('/notices', req)
  return res.data
}

/**
 * 특정 공지사항 상세 데이터 조회
 * @param {String|Number} noticeId - 공지사항 고유 식별자
 * @returns {Promise<Object>} 해당 ID의 공지사항 상세 객체
 */
const getNoticeDetail = async (noticeId) => {
  const res = await api.get('/notices/' + noticeId)
  
  return res.data
}

/**
 * FAQ(자주 묻는 질문) 목록 조회
 * @param {Object} req - 요청 파라미터
 * @returns {Promise<Array>} FAQ 리스트 데이터
 */
const faqList = async (req) => {
  const res = await api.get('/json/faq', req)
  return res.data
}

export default { createNotice, updateNotice, noticeList, getNoticeDetail, faqList }
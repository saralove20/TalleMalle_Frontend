import api from '@/plugins/axiosinterceptor'

// 프로필 정보 조회 API
const profile = async () => {
  return await api.get('/profile', { withCredentials: true })
}

const update = async (req) => {
  return await api.put('/profile', req, { withCredentials: true })
}

// Presigned URL 발급 API (백엔드 명세 반영: POST /profile/image/presign)
const getPresignedUrl = async (req) => {
  return await api.post('/image/presign', req, {
    withCredentials: true
  })
}

// 탑승 기록 조회 API
const history = async (req) => {
  return await api.get('/json/history', req)
}

// 리뷰 데이터 조회 API
const review = async (req) => {
  return await api.get('/json/reviews', req)
}

// 결제 수단 목록 조회 API
const payment = async (req) => {
  return await api.get('/json/payment', req)
}

export default { profile, update, history, review, payment, getPresignedUrl }

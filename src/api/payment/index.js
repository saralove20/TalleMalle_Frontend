import api from '@/plugins/axiosinterceptor'

const key = async () => {
  return await api.get('/payment/key', { withCredentials: true })
}

const list = async () => {
  return await api.get('/payment/list', { withCredentials: true })
}
const enroll = async (customerKey, authKey) => {
  return await api.get('/payment/enroll', {
    params: { customerKey, authKey },
    withCredentials: true
  })
}

export default {
  key,
  list,
  enroll,
}

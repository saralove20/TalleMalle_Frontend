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

const revoke = async (billingIdx) => {
  return await api.post(`/payment/revoke/${billingIdx}`, {}, { withCredentials: true })
}

export default {
  key,
  list,
  enroll,
  revoke,
}

/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import api from '@/plugins/axiosinterceptor'

/**
 * ==============================================================================
 * 2. METHODS - API SERVICE METHODS
 * ==============================================================================
 */
const login = async (req) => {
  return await api.post('/driver/login', req)
}

const signup = async (req) => {
  return await api.post('/driver/signup', req)
}

const getCallList = async () => {
  return await api.get('/call/list')
}


const getCallDetail = async (callIdx) => {
  return await api.get(`/call/read/${callIdx}`)
}

const getMyCall = async () => {
  return await api.get('/call/readmycall')
}

/**
 * 콜 수락
 * method: PATCH
 * url: /driver/accept/{callIdx}
 * @param {Number} callIdx
 */
const acceptCall = async (callIdx) => {
  return await api.patch(`/call/accept/${callIdx}`)
}


/**
 * 콜 취소
 * method: PATCH
 * url: /driver/cancel/{callIdx}
 * @param {Number} callIdx
 */
const cancelCall = async (callIdx) => {
  return await api.patch(`/call/cancel/${callIdx}`)
}

const getCallHistory = async () => {
  return await api.get('/call/history')
}

export default { getCallList, getCallDetail, getMyCall, acceptCall, cancelCall, getCallHistory, login, signup }

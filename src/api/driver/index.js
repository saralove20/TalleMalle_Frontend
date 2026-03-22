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

const getCallList = async (params = {}) => {
  return await api.get('/call/list', {
    params: { page: 0, size: 20, ...params },
  })
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

const startDriving = async (callIdx) => {
  return await api.patch(`/call/driving/${callIdx}`)
}

const completeCall = async (callIdx) => {
  return await api.patch(`/call/complete/${callIdx}`)
}

const getCallHistory = async (params = {}) => {
  return await api.get('/call/history', {
    params: { page: 0, size: 20, ...params },
  })
}

const getSettlement = async (callIdx) => {
  return await api.get(`/call/settlement/${callIdx}`)
}

export default { getCallList, getCallDetail, getMyCall, acceptCall, cancelCall, startDriving, completeCall, getCallHistory, getSettlement, login, signup }

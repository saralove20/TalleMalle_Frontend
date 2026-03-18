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
  return await api.post('/user/login', req)
}

const signup = async (req) => {
  return await api.post('/user/signup', req)
}

const extraSignup = async (req) => {
  return await api.patch('/user/signup/extra', req)
}

const verifyIdentity = async (identityVerificationId) => {
  return await api.post('/user/verify-identity', { identityVerificationId })
}

const emailDoubleCheck = async (email) => {
  return await api.get('/user/signup/check-email', { params: { email: email } })
}

const nicknameDoubleCheck = async (nickname) => {
  return await api.get('/user/signup/check-nickname', { params: { nickname: nickname } })
}

export default { login, signup, extraSignup, verifyIdentity, emailDoubleCheck, nicknameDoubleCheck }
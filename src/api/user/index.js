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

export default { login, signup, extraSignup }
/**
 * ==============================================================================
 * 1. IMPORTS & CONFIG
 * ==============================================================================
 */
import api from '@/plugins/axiosinterceptor'

/**
 * ==============================================================================
 * 2. API DEFINITIONS (함수 정의)
 * ==============================================================================
 */
const getRecruitList = async () => {
    return await api.get('/recruit')
}

const registerRecruit = async (data) => {
    return await api.post('/recruit', data)
}

const joinRecruit = async (recruitIdx) => {
    return await api.post(`/recruit/join/${recruitIdx}`)
}

const leaveRecruit = async (recruitIdx) => {
    return await api.delete(`/recruit/${recruitIdx}/leave`)
}

const searchRecruits = async (params) => {
    return await api.get("/recruit/search", { params })
}

/**
 * ==============================================================================
 * 3. EXPORT
 * ==============================================================================
 */
export default {
    getRecruitList, registerRecruit, joinRecruit, searchRecruits, leaveRecruit
}
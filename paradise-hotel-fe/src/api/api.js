import axios from 'axios'

const STORAGE_KEY = 'paradise_auth'

export const api = axios.create({
  baseURL: '/api'
})

// Attach token on every request (works on refresh)
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const saved = JSON.parse(raw)
      if (saved?.token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${saved.token}`
      }
    } catch {

    }
  }
  return config
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
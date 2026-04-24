import { useEffect, useMemo, useState } from 'react'
import AuthContext from './AuthContext.jsx'
import { api, setAuthToken } from '../api/api.js'

const STORAGE_KEY = 'paradise_auth'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const init = async () => {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) {
      try {
        const saved = JSON.parse(raw)
        if (saved?.token) {
          setToken(saved.token)
          setAuthToken(saved.token)

          // hydrate user on refresh
          const res = await api.get('/auth/me')
          setUser(res.data.user)
        }
      } catch {
        // corrupted storage or invalid/expired token
        localStorage.removeItem(STORAGE_KEY)
        setAuthToken(null)
        setToken(null)
        setUser(null)
      }
    }

    setLoading(false)
  }

  init()
}, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token }))
      setAuthToken(token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setAuthToken(null)
      setUser(null)
    }
  }, [token])

  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async ({ name, email, password }) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
  }

  const refreshMe = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    setToken(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      refreshMe,
      logout
    }),
    [token, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
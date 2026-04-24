import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from './useAuth.js'

export default function RequireAuth() {
  const { token, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!token) return <Navigate to='/login' replace state={{ from: location }} />

  return <Outlet />
}
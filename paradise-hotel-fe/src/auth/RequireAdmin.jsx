import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from './useAuth.js'

export default function RequireAdmin() {
  const { user, loading, token } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!token) return <Navigate to='/login' replace state={{ from: location }} />
  // just wait for hydration
  if (!user) return null
  if (user.role !== 'admin') return <Navigate to='/' replace />

  return <Outlet />
}
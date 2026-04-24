import { Navigate, Outlet } from 'react-router-dom'
import useAuth from './useAuth.js'

export default function RequireAdmin() {
  const { user, loading, token } = useAuth()

  if (loading) return null
  if (!token) return <Navigate to='/login' replace />
  if (user?.role !== 'admin') return <Navigate to='/' replace />

  return <Outlet />
}
import { Link } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'

export default function Navbar() {
  const { user, token, logout } = useAuth()

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
      <Link to='/'>Home</Link>
      <Link to='/about'>About</Link>
      <Link to='/search'>Search rooms</Link>

      {token ? (
        <>
          <Link to='/reservations'>My reservations</Link>
          {user?.role === 'admin' ? <Link to='/admin/dashboard'>Admin</Link> : null}
          <button type='button' onClick={logout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to='/register'>Register</Link>
          <Link to='/login'>Login</Link>
        </>
      )}
    </nav>
  )
}
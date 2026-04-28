import { Link as RouterLink } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function Navbar() {
  const { user, token, logout } = useAuth()

  return (
    <AppBar position='static' color='transparent' elevation={0}>
      <Toolbar sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Paradise Hotel
        </Typography>

        <Stack direction='row' spacing={1}>
          <Button component={RouterLink} to='/' color='inherit'>
            Home
          </Button>
          <Button component={RouterLink} to='/about' color='inherit'>
            About
          </Button>
          <Button component={RouterLink} to='/search' color='inherit'>
            Search rooms
          </Button>

          {token ? (
            <>
              <Button component={RouterLink} to='/reservations' color='inherit'>
                My Reservations
              </Button>
              <Button onClick={logout} color='inherit' variant='outlined'>
                Logout
              </Button>
              {user?.role === 'admin' ? (
                <Button component={RouterLink} to='/admin/dashboard' color='inherit'>
                  Admin
                </Button>
              ) : null} 
            </>
          ) : (
            <>
              <Button component={RouterLink} to='/register' color='inherit'>
                Register
              </Button>
              <Button component={RouterLink} to='/login' color='inherit' variant='contained'>
                Login
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
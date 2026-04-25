import { NavLink } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'

const linkStyle = ({ isActive }) => ({
  textDecoration: 'none'
})

export default function AdminNav() {
  return (
    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
      <NavLink to='/admin/dashboard' style={linkStyle}>
        {({ isActive }) => (
          <Button variant={isActive ? 'contained' : 'outlined'} size='small'>
            Dashboard
          </Button>
        )}
      </NavLink>

      <NavLink to='/admin/locations' style={linkStyle}>
        {({ isActive }) => (
          <Button variant={isActive ? 'contained' : 'outlined'} size='small'>
            Locations
          </Button>
        )}
      </NavLink>

      <NavLink to='/admin/rooms' style={linkStyle}>
        {({ isActive }) => (
          <Button variant={isActive ? 'contained' : 'outlined'} size='small'>
            Rooms
          </Button>
        )}
      </NavLink>
    </Stack>
  )
}
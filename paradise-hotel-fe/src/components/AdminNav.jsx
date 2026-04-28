import { useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Paper from '@mui/material/Paper'

const tabs = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Locations', path: '/admin/locations' },
  { label: 'Rooms', path: '/admin/rooms' },
  { label: 'Reservations', path: '/admin/reservations' }
]

export default function AdminNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const current = tabs.findIndex((t) => location.pathname.startsWith(t.path))
  const value = current === -1 ? 0 : current

  return (
    <Paper variant='outlined' sx={{ overflowX: 'auto' }}>
      <Tabs
        value={value}
        onChange={(_, newValue) => navigate(tabs[newValue].path)}
        variant='scrollable'
        scrollButtons='auto'
      >
        {tabs.map((t) => (
          <Tab key={t.path} label={t.label} />
        ))}
      </Tabs>
    </Paper>
  )
}
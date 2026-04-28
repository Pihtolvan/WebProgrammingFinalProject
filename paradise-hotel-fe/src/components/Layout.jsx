import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Box from '@mui/material/Box'

export default function Layout() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Navbar />
      <Outlet />
    </Box>
  )
}
import { useEffect, useState } from 'react'
import PageContainer from '../../components/PageContainer.jsx'
import { api } from '../../api/api.js'
import AdminNav from '../../components/AdminNav.jsx'

import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'

function StatCard({ label, value }) {
  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography color='text.secondary' variant='body2'>
          {label}
        </Typography>
        <Typography variant='h5'>{value}</Typography>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      setError('')
      setLoading(true)
      try {
        const res = await api.get('/admin/dashboard')
        setData(res.data)
      } catch (err) {
        const message = err.response?.data?.message ?? 'Failed to load admin dashboard.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>Admin dashboard</Typography>
        <AdminNav />

        {error ? <Alert severity='error'>{error}</Alert> : null}

        {loading ? (
          <Typography color='text.secondary'>Loading...</Typography>
        ) : data ? (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Total reservations' value={data.summary.totalReservations} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Active reservations' value={data.summary.activeReservations} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Cancelled reservations' value={data.summary.cancelledReservations} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Users' value={data.summary.totalUsers} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Locations' value={data.summary.totalLocations} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard label='Rooms' value={data.summary.totalRooms} />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant='h6'>Reservations by month (last 6)</Typography>
            <Stack spacing={1}>
              {data.reservationsByMonth.map((row) => (
                <Typography key={row.month} color='text.secondary'>
                  {row.month}: {row.count}
                </Typography>
              ))}
            </Stack>

            <Divider />

            <Typography variant='h6'>Reservations by status</Typography>
            <Stack spacing={1}>
              {data.reservationsByStatus.map((row) => (
                <Typography key={row.status} color='text.secondary'>
                  {row.status}: {row.count}
                </Typography>
              ))}
            </Stack>

            <Divider />

            <Typography variant='h6'>Top locations (by reservations)</Typography>
            <Stack spacing={1}>
              {data.reservationsByLocation.map((row) => (
                <Typography key={row.name} color='text.secondary'>
                  {row.name}: {row.count}
                </Typography>
              ))}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </PageContainer>
  )
}
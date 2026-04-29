import { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer.jsx'
import { api } from '../api/api.js'
import useAuth from '../auth/useAuth.js'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'

export default function MyReservationsPage() {
  const { token, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])
  const [cancelId, setCancelId] = useState(null)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/reservations/me')
      setReservations(res.data.reservations ?? [])
    } catch (err) {
      setReservations([])
      setError(err.response?.data?.message ?? 'Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!token) {
      setLoading(false)
      setReservations([])
      setError('Authentication required.')
      return
    }

    load()
  }, [authLoading, token])

  const cancelReservation = async (id) => {
    setError('')
    try {
      await api.delete(`/reservations/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to cancel reservation.')
    }
  }

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant='h4' sx={{ fontWeight: 800 }}>
            My reservations
          </Typography>
          <Typography color='text.secondary'>
            Manage your bookings and review details.
          </Typography>
        </Stack>

        {error ? <Alert severity='error'>{error}</Alert> : null}

        {loading ? (
          <Typography color='text.secondary'>Loading…</Typography>
        ) : reservations.length === 0 ? (
          <Paper variant='outlined' sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
            <Stack spacing={1.5}>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                No reservations yet
              </Typography>
              <Typography color='text.secondary'>
                Start by searching for available rooms and book your stay.
              </Typography>
              <Button href='/search' variant='contained' sx={{ alignSelf: 'center' }}>
                Search rooms
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={2}>
            <Typography color='text.secondary'>
              You have {reservations.length} reservation{reservations.length === 1 ? '' : 's'}.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
              }}
            >
              {reservations.map((r) => (
                <Paper
                  key={r.id}
                  variant='outlined'
                  sx={{ p: 3, borderRadius: 5, height: '100%' }}
                >
                  <Stack spacing={1.5} sx={{ height: '100%' }}>
                    <Stack spacing={0.5}>
                      <Typography variant='h6' sx={{ fontWeight: 700 }}>
                        {r.locationName}
                      </Typography>
                      <Typography color='text.secondary'>
                        {r.locationCity}
                      </Typography>
                    </Stack>

                    <Typography color='text.secondary'>
                      {r.roomName} • {r.roomType}
                    </Typography>

                    <Divider />

                    <Typography>
                      {r.checkIn} → {r.checkOut}
                    </Typography>

                    <Typography color='text.secondary'>
                      Guests: {r.guests}
                    </Typography>

                    <Stack direction='row' spacing={1}>
                      <Chip
                        label={r.status}
                        color={r.status === 'active' ? 'success' : 'default'}
                        size='small'
                      />
                    </Stack>

                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant='outlined'
                      color='error'
                      disabled={r.status !== 'active'}
                      onClick={() => setCancelId(r.id)}
                    >
                      Cancel reservation
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        )}
      </Stack>

      <Dialog open={cancelId !== null} onClose={() => setCancelId(null)}>
        <DialogTitle>Cancel reservation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>Keep</Button>
          <Button
            color='error'
            variant='contained'
            onClick={async () => {
              const id = cancelId
              setCancelId(null)
              await cancelReservation(id)
            }}
          >
            Cancel reservation
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}

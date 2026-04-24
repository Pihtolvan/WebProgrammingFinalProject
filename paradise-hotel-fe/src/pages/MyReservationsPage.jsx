import { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer.jsx'
import { api } from '../api/api.js'
import useAuth from '../auth/useAuth.js'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

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
      const message = err.response?.data?.message ?? 'Failed to load reservations.'
      setError(message)
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
      const message = err.response?.data?.message ?? 'Failed to cancel reservation.'
      setError(message)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>My reservations</Typography>

        {error ? <Alert severity='error'>{error}</Alert> : null}

        {loading ? (
          <Typography color='text.secondary'>Loading...</Typography>
        ) : reservations.length === 0 ? (
          <Typography color='text.secondary'>No reservations yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {reservations.map((r) => (
              <Card key={r.id} variant='outlined'>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant='h6'>
                      {r.locationName} ({r.locationCity})
                    </Typography>
                    <Typography color='text.secondary'>
                      {r.roomName} • {r.roomType}
                    </Typography>

                    <Divider />

                    <Typography>
                      {r.checkIn} → {r.checkOut} • Guests: {r.guests}
                    </Typography>

                    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                      <Chip label={r.status} size='small' />
                    </Stack>

                    <Button
                      variant='outlined'
                      color='error'
                      disabled={r.status !== 'active'}
                      onClick={() => setCancelId(r.id)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
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
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageContainer from '../components/PageContainer.jsx'
import { api } from '../api/api.js'
import useAuth from '../auth/useAuth.js'

import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'

function groupRoomsByLocation(rooms) {
  const map = new Map()

  for (const room of rooms) {
    const locationId = room.location?.id ?? room.locationId
    if (!map.has(locationId)) {
      map.set(locationId, {
        location: room.location,
        rooms: []
      })
    }
    map.get(locationId).rooms.push(room)
  }

  const grouped = Array.from(map.values())
  grouped.sort((a, b) => {
    const r1 = a.location?.rating ?? 0
    const r2 = b.location?.rating ?? 0
    if (r1 !== r2) return r2 - r1
    return String(a.location?.name ?? '').localeCompare(String(b.location?.name ?? ''))
  })

  for (const g of grouped) {
    g.rooms.sort((a, b) => (a.pricePerNight ?? 0) - (b.pricePerNight ?? 0))
  }

  return grouped
}

export default function SearchRoomsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()

  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    city: '',
    rating: '',
    freeParking: false,
    wellnessCenter: false,
    search: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [snack, setSnack] = useState({ open: false, message: '' })

  const grouped = useMemo(() => groupRoomsByLocation(rooms), [rooms])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const buildParams = () => {
    const params = new URLSearchParams()

    params.set('checkIn', form.checkIn)
    params.set('checkOut', form.checkOut)
    params.set('guests', String(form.guests || 1))

    if (form.search.trim()) params.set('search', form.search.trim())
    if (form.city.trim()) params.set('city', form.city.trim())
    if (form.rating !== '') params.set('rating', String(form.rating))
    if (form.freeParking) params.set('freeParking', 'true')
    if (form.wellnessCenter) params.set('wellnessCenter', 'true')

    return params
  }

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return 'Please select check-in and check-out dates.'
    if (new Date(form.checkIn) >= new Date(form.checkOut)) return 'Check-out must be after check-in.'
    const guests = Number(form.guests)
    if (Number.isNaN(guests) || guests < 1) return 'Guests must be at least 1.'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const msg = validate()
    if (msg) return setError(msg)

    try {
      setLoading(true)
      const params = buildParams()
      const res = await api.get(`/rooms/availability?${params.toString()}`)
      setRooms(res.data.rooms ?? [])
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to load available rooms.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const reserveRoom = async (roomId) => {
    setError('')

    if (!token) {
      navigate('/login', { state: { from: location } })
      return
    }

    const msg = validate()
    if (msg) return setError(msg)

    const payload = {
      roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: Number(form.guests || 1)
    }

    try {
      await api.post('/reservations', payload)
      setSnack({ open: true, message: 'Reservation created successfully. Redirecting…' })
      navigate('/reservations', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to create reservation.'
      setError(message)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>Search rooms</Typography>

        {error ? <Alert severity='error'>{error}</Alert> : null}

        <Box component='form' onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Check-in'
                name='checkIn'
                type='date'
                value={form.checkIn}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label='Check-out'
                name='checkOut'
                type='date'
                value={form.checkOut}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label='Guests'
                name='guests'
                type='number'
                value={form.guests}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label='City (optional)'
                name='city'
                value={form.city}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label='Min rating (1-5)'
                name='rating'
                type='number'
                value={form.rating}
                onChange={handleChange}
                inputProps={{ min: 1, max: 5, step: 0.1 }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label='Search hotel name (optional)'
                name='search'
                value={form.search}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={<Checkbox name='freeParking' checked={form.freeParking} onChange={handleChange} />}
                  label='Free parking'
                />

                <FormControlLabel
                  control={<Checkbox name='wellnessCenter' checked={form.wellnessCenter} onChange={handleChange} />}
                  label='Wellness center'
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Button type='submit' variant='contained' disabled={loading}>
                {loading ? 'Searching...' : 'Search availability'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {rooms.length === 0 ? (
          <Typography color='text.secondary'>
            No rooms loaded yet. Select dates and click “Search availability”.
          </Typography>
        ) : (
          <Stack spacing={3}>
            <Typography color='text.secondary'>
              Found {rooms.length} available room{rooms.length === 1 ? '' : 's'}.
            </Typography>

            {grouped.map((group) => (
              <Card key={group.location?.id ?? group.location?.name} variant='outlined'>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant='h5'>{group.location?.name}</Typography>
                      <Typography color='text.secondary'>
                        {group.location?.city} • {group.location?.address}
                      </Typography>

                      <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Chip label={`Rating: ${group.location?.rating ?? 'N/A'}`} size='small' />
                        {group.location?.hasFreeParking ? <Chip label='Free parking' size='small' /> : null}
                        {group.location?.hasWellnessCenter ? <Chip label='Wellness center' size='small' /> : null}
                      </Stack>
                    </Stack>

                    <Divider />

                    <Grid container spacing={2}>
                      {group.rooms.map((room) => (
                        <Grid item xs={12} md={6} key={room.id}>
                          <Card variant='outlined'>
                            <CardContent>
                              <Stack spacing={1}>
                                <Typography variant='h6'>{room.name}</Typography>
                                <Typography color='text.secondary'>
                                  {room.type} • Capacity: {room.capacity}
                                </Typography>
                                <Typography>€{room.pricePerNight} / night</Typography>

                                <Button variant='contained' onClick={() => reserveRoom(room.id)}>
                                  Reserve
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ open: false, message: '' })}
          message={snack.message}
        />
      </Stack>
    </PageContainer>
  )
}
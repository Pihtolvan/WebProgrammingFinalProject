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
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

const isHttpUrl = (v) => {
  const s = String(v ?? '').trim()
  return s.startsWith('http://') || s.startsWith('https://')
}

const fallbackLocationImg = (locationId) => `https://picsum.photos/seed/location-${locationId}/1200/900`

const getLocationImageSrc = (location) => {
  const id = location?.id ?? 'unknown'
  return isHttpUrl(location?.imageUrl) ? location.imageUrl : fallbackLocationImg(id)
}

const groupRoomsByLocation = (rooms) => {
  const byId = new Map()

  for (const room of rooms) {
    const locationId = room.location?.id ?? room.locationId
    const entry = byId.get(locationId) ?? { location: room.location, rooms: [] }
    entry.rooms.push(room)
    byId.set(locationId, entry)
  }

  const grouped = [...byId.values()]

  // sort locations by rating desc, then name
  grouped.sort((a, b) => {
    const r = (b.location?.rating ?? 0) - (a.location?.rating ?? 0)
    if (r !== 0) return r
    return String(a.location?.name ?? '').localeCompare(String(b.location?.name ?? ''))
  })

  // sort rooms by price asc
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

  const grouped = useMemo(() => groupRoomsByLocation(rooms), [rooms])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (!form.checkIn || !form.checkOut) return 'Please select check-in and check-out dates.'
    if (new Date(form.checkIn) >= new Date(form.checkOut)) return 'Check-out must be after check-in.'
    const guests = Number(form.guests)
    if (Number.isNaN(guests) || guests < 1) return 'Guests must be at least 1.'
    return ''
  }

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('checkIn', form.checkIn)
    p.set('checkOut', form.checkOut)
    p.set('guests', String(form.guests || 1))

    if (form.search.trim()) p.set('search', form.search.trim())
    if (form.city.trim()) p.set('city', form.city.trim())
    if (form.rating !== '') p.set('rating', String(form.rating))
    if (form.freeParking) p.set('freeParking', 'true')
    if (form.wellnessCenter) p.set('wellnessCenter', 'true')
    return p
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const msg = validate()
    if (msg) return setError(msg)

    try {
      setLoading(true)
      const res = await api.get(`/rooms/availability?${buildParams().toString()}`)
      setRooms(res.data.rooms ?? [])
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load available rooms.')
    } finally {
      setLoading(false)
    }
  }

  const reserveRoom = async (roomId) => {
    setError('')

    if (!token) return navigate('/login', { state: { from: location } })

    const msg = validate()
    if (msg) return setError(msg)

    try {
      await api.post('/reservations', {
        roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests || 1)
      })
      navigate('/reservations', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create reservation.')
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant='h4' sx={{ fontWeight: 800 }}>
            Search rooms
          </Typography>
          <Typography color='text.secondary'>
            Select your dates and guests, then filter by city, rating and amenities.
          </Typography>
        </Stack>

        {error ? <Alert severity='error'>{error}</Alert> : null}

        <Paper variant='outlined' sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 6 }}>
          <Box component='form' onSubmit={onSubmit}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(12, 1fr)' },
                alignItems: 'center'
              }}
            >
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 3' } }}>
                <TextField
                  label='Check-in'
                  name='checkIn'
                  type='date'
                  value={form.checkIn}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 3' } }}>
                <TextField
                  label='Check-out'
                  name='checkOut'
                  type='date'
                  value={form.checkOut}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 2' } }}>
                <TextField
                  label='Guests'
                  name='guests'
                  type='number'
                  value={form.guests}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ input: { inputProps: { min: 1 } } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 4' } }}>
                <TextField label='Hotel name' name='search' value={form.search} onChange={handleChange} fullWidth />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 4' } }}>
                <TextField label='City' name='city' value={form.city} onChange={handleChange} fullWidth />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto', md: 'span 2' } }}>
                <TextField
                  label='Min rating'
                  name='rating'
                  type='number'
                  value={form.rating}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ input: { inputProps: { min: 1, max: 5, step: 0.1 } } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControlLabel
                    control={<Checkbox name='freeParking' checked={form.freeParking} onChange={handleChange} />}
                    label='Free parking'
                  />
                  <FormControlLabel
                    control={<Checkbox name='wellnessCenter' checked={form.wellnessCenter} onChange={handleChange} />}
                    label='Wellness center'
                  />
                </Stack>
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={loading}
                  fullWidth
                  sx={{
                    py: 1.2,
                    borderRadius: 999,
                    alignSelf: 'center', 
                    mx: { xs: 0, md: 'auto' }
                  }}
                >
                  {loading ? 'Searching…' : 'Search availability'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Divider />

        {rooms.length === 0 ? (
          <Typography color='text.secondary'>
            No rooms loaded yet. Select dates and click “Search availability”.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Typography color='text.secondary'>
              Found {rooms.length} available room{rooms.length === 1 ? '' : 's'}.
            </Typography>

            <Stack spacing={2}>
              {grouped.map((group) => {
                const loc = group.location
                const imgSrc = getLocationImageSrc(loc)
                const fallback = fallbackLocationImg(loc?.id ?? 'unknown')

                return (
                  <Paper key={loc?.id ?? loc?.name} variant='outlined' sx={{ p: { xs: 4, sm: 4.5 }, borderRadius: 6 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        <Stack spacing={1.1} sx={{ minWidth: 0 }}>
                          <Typography variant='h5' sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                            {loc?.name}
                          </Typography>

                          <Typography color='text.secondary' sx={{ wordBreak: 'break-word' }}>
                            {loc?.city} • {loc?.address}
                          </Typography>

                          <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                            <Chip label={`★ ${loc?.rating ?? '—'}`} size='small' variant='outlined' color='primary' />
                            {loc?.hasFreeParking ? <Chip label='Free parking' size='small' /> : null}
                            {loc?.hasWellnessCenter ? <Chip label='Wellness center' size='small' /> : null}
                          </Stack>

                          {loc?.description ? (
                            <Typography
                              color='text.secondary'
                              variant='body2'
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {loc.description}
                            </Typography>
                          ) : null}
                        </Stack>

                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            borderRadius: 6,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default'
                          }}
                        >
                          <Box
                            component='img'
                            src={imgSrc}
                            alt={loc?.name ?? 'Hotel'}
                            loading='lazy'
                            onError={(e) => {
                              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback
                            }}
                            sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                          />
                        </Box>
                      </Box>

                      <Divider />

                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                        {group.rooms.map((room) => (
                          <Paper
                            key={room.id}
                            variant='outlined'
                            sx={{ p: { xs: 3.5, sm: 4 }, borderRadius: 5, height: '100%', boxSizing: 'border-box' }}
                          >
                            <Stack spacing={1.75} sx={{ height: '100%' }}>
                              <Stack direction='row' sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, minWidth: 0 }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant='h6'
                                    sx={{ fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={room.name}
                                  >
                                    {room.name}
                                  </Typography>
                                  <Typography color='text.secondary'>
                                    {room.type} • Capacity: {room.capacity}
                                  </Typography>
                                </Box>

                                <Chip label={`€${room.pricePerNight} / night`} color='primary' variant='outlined' sx={{ flexShrink: 0 }} />
                              </Stack>

                              {room.description ? (
                                <Typography
                                  color='text.secondary'
                                  variant='body2'
                                  sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                >
                                  {room.description}
                                </Typography>
                              ) : null}

                              <Box sx={{ flex: 1 }} />

                              <Button variant='contained' onClick={() => reserveRoom(room.id)} sx={{ alignSelf: 'flex-start' }}>
                                Reserve
                              </Button>
                            </Stack>
                          </Paper>
                        ))}
                      </Box>
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>
          </Stack>
        )}
      </Stack>
    </PageContainer>
  )
}
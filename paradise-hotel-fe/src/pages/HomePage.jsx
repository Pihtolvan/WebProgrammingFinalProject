import PageContainer from '../components/PageContainer.jsx'
import { api } from '../api/api.js'
import { Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'


export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    const load = async () => {
      setError('')
      setLoading(true)
      try {
        const res = await api.get('/locations')
        const locations = res.data.locations ?? []
        const top = [...locations].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4)
        setFeatured(top)
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load locations.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Paper
          variant='outlined'
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(47,111,237,0.10) 0%, rgba(0,163,180,0.08) 100%)'
          }}
        >
          <Stack spacing={2} sx={{ maxWidth: 720 }}>
            <Typography variant='h3' sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Paradise Hotel
            </Typography>

            <Typography color='text.secondary' sx={{ fontSize: { xs: 16, sm: 18 } }}>
              Find top-rated locations and book your stay in minutes.
            </Typography>

            <Stack direction='row' spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              <Button component={RouterLink} to='/search' variant='contained'>
                Search rooms
              </Button>
              <Button component={RouterLink} to='/about' variant='outlined'>
                About
              </Button>
            </Stack>

            <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', pt: 0.5 }}>
              <Chip label='Fast booking' size='small' />
              <Chip label='Free parking' size='small' />
              <Chip label='Wellness center' size='small' />
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant='h5' sx={{ fontWeight: 800 }}>
            Featured locations
          </Typography>
          <Typography color='text.secondary'>
            Some of our top-rated hotels.
          </Typography>
        </Box>

        {error ? <Alert severity='warning'>{error}</Alert> : null}

        {loading ? (
          <Typography color='text.secondary'>Loading…</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
            }}
          >
            {featured.map((loc) => (
              <Paper key={loc.id} variant='outlined' sx={{ p: 2.5, borderRadius: 4 }}>
                <Stack spacing={1.25}>
                  <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant='h6' sx={{ lineHeight: 1.2 }}>
                        {loc.name}
                      </Typography>
                      <Typography color='text.secondary'>{loc.city}</Typography>
                    </Box>

                    <Chip label={`★ ${loc.rating?.toFixed?.(1) ?? loc.rating ?? '—'}`} color='primary' variant='outlined' />
                  </Stack>

                  <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {loc.hasFreeParking ? <Chip size='small' label='Free parking' /> : null}
                    {loc.hasWellnessCenter ? <Chip size='small' label='Wellness center' /> : null}
                  </Stack>

                  <Typography color='text.secondary'>{loc.address}</Typography>

                  <Button component={RouterLink} to='/search' variant='contained' sx={{ alignSelf: 'flex-start' }}>
                    Search rooms
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        <Paper variant='outlined' sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 6 }}>
          <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Stack spacing={0.5}>
              <Typography variant='h6' sx={{ fontWeight: 800 }}>
                Ready to book your stay?
              </Typography>
              <Typography color='text.secondary'>Check availability for your dates.</Typography>
            </Stack>
            <Button component={RouterLink} to='/search' variant='contained'>
              Search available rooms
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </PageContainer>
  )
}
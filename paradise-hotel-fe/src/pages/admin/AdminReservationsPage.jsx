import { useEffect, useMemo, useState } from 'react'
import PageContainer from '../../components/PageContainer.jsx'
import AdminNav from '../../components/AdminNav.jsx'
import { api } from '../../api/api.js'

import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import DeleteIcon from '@mui/icons-material/Delete'

function StatusChip({ status }) {
  const s = String(status ?? '').toLowerCase()
  const color = s === 'active' ? 'success' : s === 'cancelled' ? 'default' : 'warning'
  return <Chip size='small' label={status ?? '—'} color={color} variant={s === 'cancelled' ? 'outlined' : 'filled'} />
}

function formatRange(checkIn, checkOut) {
  if (!checkIn && !checkOut) return '—'
  if (!checkIn) return `→ ${checkOut}`
  if (!checkOut) return `${checkIn} →`
  return `${checkIn} → ${checkOut}`
}

export default function AdminReservationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])

  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const [cancelId, setCancelId] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/admin/reservations')
      setReservations(res.data.reservations ?? [])
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to load reservations.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reservations
    return reservations.filter((r) => String(r.status).toLowerCase() === statusFilter)
  }, [reservations, statusFilter])

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const confirmCancel = async () => {
    if (!cancelId) return
    setCancelError('')
    setCancelLoading(true)
    try {
      // Backend allows admin to cancel via this endpoint too
      await api.delete(`/reservations/${cancelId}`)
      setCancelId(null)
      await load()
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to cancel reservation.'
      setCancelError(message)
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>Reservations</Typography>
        <AdminNav />

        {error ? <Alert severity='error'>{error}</Alert> : null}

        <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel id='status-filter-label'>Status</InputLabel>
            <Select
              labelId='status-filter-label'
              label='Status'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='cancelled'>Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Typography color='text.secondary'>
            Showing {filtered.length} / {reservations.length}
          </Typography>
        </Stack>

        {loading ? (
          <Typography color='text.secondary'>Loading...</Typography>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell width={44} />
                  <TableCell>Guest</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((r) => {
                  const expanded = expandedId === r.id
                  const isActive = String(r.status).toLowerCase() === 'active'

                  const locationLabel = r.locationName
                    ? `${r.locationName}${r.locationCity ? ` (${r.locationCity})` : ''}`
                    : '—'

                  return (
                    <>
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <IconButton size='small' onClick={() => toggleExpanded(r.id)} aria-label='expand'>
                            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>

                        <TableCell>{r.guestName ?? '—'}</TableCell>
                        <TableCell>{locationLabel}</TableCell>
                        <TableCell>{formatRange(r.checkIn, r.checkOut)}</TableCell>
                        <TableCell>{r.guests ?? '—'}</TableCell>
                        <TableCell>
                          <StatusChip status={r.status} />
                        </TableCell>

                        <TableCell align='right'>
                          <IconButton
                            aria-label='cancel'
                            color='error'
                            disabled={!isActive}
                            title={isActive ? 'Cancel reservation' : 'Only active reservations can be cancelled'}
                            onClick={() => setCancelId(r.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      <TableRow key={`${r.id}-details`}>
                        <TableCell sx={{ py: 0 }} colSpan={7}>
                          <Collapse in={expanded} timeout='auto' unmountOnExit>
                            <Box sx={{ px: 2, py: 2 }}>
                              <Typography variant='subtitle2'>Details</Typography>
                              <Divider sx={{ my: 1 }} />

                              <Stack spacing={0.5}>
                                <Typography color='text.secondary'>Reservation ID: {r.id}</Typography>
                                <Typography color='text.secondary'>Guest email: {r.guestEmail ?? '—'}</Typography>
                                <Typography color='text.secondary'>
                                  Room: {r.roomName ?? '—'} ({r.roomType ?? '—'})
                                </Typography>
                                <Typography color='text.secondary'>Created at: {r.createdAt ?? '—'}</Typography>
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  )
                })}

                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color='text.secondary'>No reservations.</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={cancelId !== null} onClose={() => (cancelLoading ? null : setCancelId(null))}>
          <DialogTitle>Cancel reservation?</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {cancelError ? <Alert severity='error'>{cancelError}</Alert> : null}
              <Typography color='text.secondary'>
                This will set the reservation status to <b>cancelled</b>.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={cancelLoading} onClick={() => setCancelId(null)}>
              Close
            </Button>
            <Button color='error' variant='contained' disabled={cancelLoading} onClick={confirmCancel}>
              {cancelLoading ? 'Cancelling…' : 'Cancel reservation'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </PageContainer>
  )
}
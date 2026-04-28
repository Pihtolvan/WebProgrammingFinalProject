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

function StatusChip({ status }) {
  const s = String(status ?? '').toLowerCase()
  const color = s === 'active' ? 'success' : s === 'cancelled' ? 'default' : 'warning'
  return <Chip size='small' label={status ?? '—'} color={color} variant={s === 'cancelled' ? 'outlined' : 'filled'} />
}

export default function AdminReservationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])

  const [statusFilter, setStatusFilter] = useState('all')

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
                  <TableCell>ID</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.checkIn ?? '—'}</TableCell>
                    <TableCell>{r.checkOut ?? '—'}</TableCell>
                    <TableCell>{r.guests ?? '—'}</TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color='text.secondary'>No reservations.</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </PageContainer>
  )
}
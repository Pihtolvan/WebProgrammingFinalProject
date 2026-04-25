import { useEffect, useMemo, useState } from 'react'
import PageContainer from '../../components/PageContainer.jsx'
import { api } from '../../api/api.js'
import AdminNav from '../../components/AdminNav.jsx'

import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const emptyForm = {
  name: '',
  type: '',
  capacity: 1,
  pricePerNight: '',
  description: '',
  imageUrl: '',
  locationId: ''
}

function normalizeRoomForm(form) {
  return {
    name: form.name.trim(),
    type: form.type.trim(),
    capacity: Number(form.capacity),
    pricePerNight: Number(form.pricePerNight),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    locationId: Number(form.locationId)
  }
}

export default function AdminRoomsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rooms, setRooms] = useState([])
  const [locations, setLocations] = useState([])

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const [deleteId, setDeleteId] = useState(null)

  const title = useMemo(() => (editing ? 'Edit room' : 'Add room'), [editing])

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const [roomsRes, locationsRes] = await Promise.all([
        api.get('/admin/rooms'),
        api.get('/admin/locations')
      ])

      setRooms(roomsRes.data.rooms ?? [])
      setLocations(locationsRes.data.locations ?? [])
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to load rooms.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setOpenForm(true)
  }

  const openEdit = (room) => {
    setEditing(room)
    setForm({
      name: room.name ?? '',
      type: room.type ?? '',
      capacity: room.capacity ?? 1,
      pricePerNight: room.pricePerNight ?? '',
      description: room.description ?? '',
      imageUrl: room.imageUrl ?? '',
      locationId: room.locationId ?? ''
    })
    setFormError('')
    setOpenForm(true)
  }

  const onChange = (e) => {
    setFormError('')
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.type.trim()) return 'Type is required.'
    if (!form.description.trim()) return 'Description is required.'

    const capacity = Number(form.capacity)
    if (!Number.isFinite(capacity) || capacity < 1) return 'Capacity must be at least 1.'

    const price = Number(form.pricePerNight)
    if (!Number.isFinite(price) || price <= 0) return 'Price per night must be a positive number.'

    const locationId = Number(form.locationId)
    if (!Number.isFinite(locationId)) return 'Location is required.'

    return ''
  }

  const save = async () => {
    setFormError('')
    const msg = validate()
    if (msg) return setFormError(msg)

    const payload = normalizeRoomForm(form)

    try {
      if (editing) {
        await api.put(`/admin/rooms/${editing.id}`, payload)
      } else {
        await api.post('/admin/rooms', payload)
      }
      setOpenForm(false)
      await load()
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to save room.'
      setFormError(message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setError('')
    try {
      await api.delete(`/admin/rooms/${deleteId}`)
      setDeleteId(null)
      await load()
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to delete room.'
      setError(message)
    }
  }

  const locationNameById = (id) => {
    const loc = locations.find((l) => l.id === id)
    return loc ? `${loc.name} (${loc.city})` : `#${id}`
  }

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h4'>Rooms</Typography>
          <Button variant='contained' onClick={openCreate}>
            Add room
          </Button>
        </Stack>
        <AdminNav />

        {error ? <Alert severity='error'>{error}</Alert> : null}

        {loading ? (
          <Typography color='text.secondary'>Loading...</Typography>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>€ / night</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.pricePerNight}</TableCell>
                    <TableCell>{room.location?.name ?? locationNameById(room.locationId)}</TableCell>
                    <TableCell align='right'>
                      <IconButton aria-label='edit' onClick={() => openEdit(room)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label='delete' color='error' onClick={() => setDeleteId(room.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color='text.secondary'>No rooms.</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth='sm' fullWidth>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {formError ? <Alert severity='error'>{formError}</Alert> : null}

              <TextField label='Name' name='name' value={form.name} onChange={onChange} fullWidth />
              <TextField label='Type' name='type' value={form.type} onChange={onChange} fullWidth />

              <TextField
                label='Capacity'
                name='capacity'
                type='number'
                value={form.capacity}
                onChange={onChange}
                inputProps={{ min: 1 }}
                fullWidth
              />

              <TextField
                label='Price per night (€)'
                name='pricePerNight'
                type='number'
                value={form.pricePerNight}
                onChange={onChange}
                inputProps={{ min: 1, step: 1 }}
                fullWidth
              />

              <TextField
                label='Location'
                name='locationId'
                select
                value={form.locationId}
                onChange={onChange}
                fullWidth
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                  </MenuItem>
                ))}
              </TextField>

              <Divider />

              <TextField
                label='Description'
                name='description'
                value={form.description}
                onChange={onChange}
                fullWidth
                multiline
                minRows={3}
              />

              <TextField
                label='Image URL (optional)'
                name='imageUrl'
                value={form.imageUrl}
                onChange={onChange}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Close</Button>
            <Button variant='contained' onClick={save}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
          <DialogTitle>Delete room?</DialogTitle>
          <DialogContent>
            <Typography color='text.secondary'>
              This will remove the room. If there are reservations linked, the server may reject the request.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button color='error' variant='contained' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </PageContainer>
  )
}
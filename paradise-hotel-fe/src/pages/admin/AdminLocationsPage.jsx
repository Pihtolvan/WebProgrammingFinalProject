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
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const emptyForm = {
  name: '',
  city: '',
  address: '',
  description: '',
  rating: '',
  hasFreeParking: false,
  hasWellnessCenter: false
}

function normalizeLocationForm(form) {
  const n = Number(form.rating)
  const rating = Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : null

  return {
    name: form.name.trim(),
    city: form.city.trim(),
    address: form.address.trim(),
    description: form.description.trim(),
    rating,
    hasFreeParking: Boolean(form.hasFreeParking),
    hasWellnessCenter: Boolean(form.hasWellnessCenter)
  }
}

export default function AdminLocationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const [deleteId, setDeleteId] = useState(null)

  const title = useMemo(() => (editing ? 'Edit location' : 'Add location'), [editing])

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/admin/locations')
      setLocations(res.data.locations ?? [])
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to load locations.'
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

  const openEdit = (loc) => {
    setEditing(loc)
    setForm({
      name: loc.name ?? '',
      city: loc.city ?? '',
      address: loc.address ?? '',
      description: loc.description ?? '',
      rating: loc.rating ?? '',
      hasFreeParking: Boolean(loc.hasFreeParking),
      hasWellnessCenter: Boolean(loc.hasWellnessCenter)
    })
    setFormError('')
    setOpenForm(true)
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.address.trim()) return 'Address is required.'
    if (!form.description.trim()) return 'Description is required.'
    const r = Number(form.rating)
    if (!Number.isFinite(r)) return 'Rating is required and must be a number (0-5).'
    if (r < 0 || r > 5) return 'Rating must be between 0 and 5.'
    return ''
  }

  const save = async () => {
    setFormError('')
    const msg = validate()
    if (msg) return setFormError(msg)

    const payload = normalizeLocationForm(form)

    try {
      if (editing) {
        await api.put(`/admin/locations/${editing.id}`, payload)
      } else {
        await api.post('/admin/locations', payload)
      }
      setOpenForm(false)
      await load()
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to save location.'
      setFormError(message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setError('')
    try {
      await api.delete(`/admin/locations/${deleteId}`)
      setDeleteId(null)
      await load()
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to delete location.'
      setError(message)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h4'>Locations</Typography>
          <Button variant='contained' onClick={openCreate}>
            Add location
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
                  <TableCell>City</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Free parking</TableCell>
                  <TableCell>Wellness</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell>{loc.name}</TableCell>
                    <TableCell>{loc.city}</TableCell>
                    <TableCell>{loc.rating ?? '—'}</TableCell>
                    <TableCell>{loc.hasFreeParking ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{loc.hasWellnessCenter ? 'Yes' : 'No'}</TableCell>
                    <TableCell align='right'>
                      <IconButton aria-label='edit' onClick={() => openEdit(loc)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label='delete' color='error' onClick={() => setDeleteId(loc.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color='text.secondary'>No locations.</Typography>
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
              <TextField label='City' name='city' value={form.city} onChange={onChange} fullWidth />
              <TextField label='Address' name='address' value={form.address} onChange={onChange} fullWidth />

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
                label='Rating (0-5)'
                name='rating'
                type='number'
                value={form.rating}
                onChange={onChange}
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText='Enter a value between 0 and 5'
                fullWidth
              />

              <Divider />

              <FormControlLabel
                control={<Checkbox name='hasFreeParking' checked={form.hasFreeParking} onChange={onChange} />}
                label='Free parking'
              />
              <FormControlLabel
                control={<Checkbox name='hasWellnessCenter' checked={form.hasWellnessCenter} onChange={onChange} />}
                label='Wellness center'
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
          <DialogTitle>Delete location?</DialogTitle>
          <DialogContent>
            <Typography color='text.secondary'>
              This will remove the location. If there are rooms/reservations linked, the server may reject the request.
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
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'
import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required'
    if (!form.email.trim()) return 'Email is required'
    if (!form.email.includes('@')) return 'Email must be valid'
    if (!form.password.trim()) return 'Password is required'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const msg = validate()
    if (msg) return setError(msg)

    try {
      setSubmitting(true)
      await register(form)
      navigate('/login')
    } catch (err) {
      const message = err.response?.data?.message ?? 'Registration failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={3} sx={{ textAlign: 'center' }}>
        <Stack spacing={0.5}>
          <Typography variant='h4' sx={{ fontWeight: 800 }}>
            Register
          </Typography>
          <Typography color='text.secondary'>
            Create your account to make reservations.
          </Typography>
        </Stack>

        <Paper variant='outlined' sx={{ p: 3, borderRadius: 5 }}>
          <Stack component='form' spacing={2} onSubmit={onSubmit}>
            {error && <Alert severity='error'>{error}</Alert>}
            
            <TextField label='Name' name='name' value={form.name} onChange={handleChange} fullWidth />
            <TextField label='Email' name='email' value={form.email} onChange={handleChange} fullWidth />
            <TextField label='Password' name='password' type='password' value={form.password} onChange={handleChange} fullWidth
              helperText='Minimum 6 characters'/>

            <Button type='submit' variant='contained' disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
            <Button component={RouterLink} to='/login'>
              Already have an account? Login
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </PageContainer>
  )
}
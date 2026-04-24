import { useState } from 'react'
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'
import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm] = useState({
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
    if (!form.email.trim()) return 'Email is required'
    if (!form.email.includes('@')) return 'Email must be valid'
    if (!form.password.trim()) return 'Password is required'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const msg = validate()
    if (msg) return setError(msg)

    try {
      setSubmitting(true)
      await login(form)

      const from = location.state?.from?.pathname
      navigate(from || '/search', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message ?? 'Login failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Typography variant='h4' sx={{ mb: 2 }}>
        Login
      </Typography>

      {error ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack component='form' spacing={2} onSubmit={onSubmit}>
        <TextField label='Email' name='email' value={form.email} onChange={handleChange} fullWidth />
        <TextField
          label='Password'
          name='password'
          type='password'
          value={form.password}
          onChange={handleChange}
          fullWidth
        />

        <Button type='submit' variant='contained' disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </Button>

        <Button component={RouterLink} to='/register'>
          Need an account? Register
        </Button>
      </Stack>
    </PageContainer>
  )
}
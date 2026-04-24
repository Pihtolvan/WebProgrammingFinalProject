import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { Link as RouterLink } from 'react-router-dom'

export default function HomePage() {
  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h3'>Paradise Hotel</Typography>
        <Typography color='text.secondary'>
          Find the perfect room and book in minutes.
        </Typography>

        <Button component={RouterLink} to='/search' variant='contained'>
          Search rooms
        </Button>
      </Stack>
    </PageContainer>
  )
}
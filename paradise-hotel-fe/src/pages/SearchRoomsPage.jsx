import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function SearchRoomsPage() {
  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>Search rooms</Typography>
        <Typography color='text.secondary'>
          Coming next: date range, guests, filters, and available rooms list.
        </Typography>
      </Stack>
    </PageContainer>
  )
}
import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

export default function AboutPage() {
  return (
    <PageContainer maxWidth='md'>
      <Stack spacing={3}>
        <Paper variant='outlined' sx={{ p: { xs: 3, sm: 4 }, borderRadius: 6 }}>
          <Stack spacing={1.5}>
            <Typography variant='h4' sx={{ fontWeight: 800 }}>
              About Paradise Hotel
            </Typography>
            <Typography color='text.secondary'>
              Paradise Hotel is a fictional hotel brand.
              This application provides a complete frontend experience for guests and administrators.
            </Typography>

            <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', pt: 0.5 }}>
              <Chip size='small' label='React' />
              <Chip size='small' label='MUI' />
              <Chip size='small' label='Axios' />
              <Chip size='small' label='JWT auth' />
            </Stack>
          </Stack>
        </Paper>

        <Paper variant='outlined' sx={{ p: { xs: 3, sm: 4 }, borderRadius: 6 }}>
          <Stack spacing={2}>
            <Typography variant='h6' sx={{ fontWeight: 800 }}>
              What you can do
            </Typography>

            <Stack spacing={1}>
              <Typography>
                • Create an account and log in
              </Typography>
              <Typography>
                • Search available rooms by dates and guests
              </Typography>
              <Typography>
                • Filter locations by city, rating, free parking and wellness center
              </Typography>
              <Typography>
                • Create and cancel reservations
              </Typography>
              <Typography>
                • Use the admin area to manage locations, rooms, and view reservations & dashboard stats
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </PageContainer>
  )
}
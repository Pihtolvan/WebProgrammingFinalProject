import PageContainer from '../components/PageContainer.jsx'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function AboutPage() {
  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant='h4'>About</Typography>
        <Typography>
          This is a React frontend that consumes the Paradise Hotel public API.
        </Typography>
      </Stack>
    </PageContainer>
  )
}
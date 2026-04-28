import Container from '@mui/material/Container'
import Box from '@mui/material/Box'

export default function PageContainer({ children, maxWidth = 'lg' }) {
  return (
    <Container maxWidth={maxWidth}>
      <Box sx={{ py: { xs: 3, sm: 4 } }}>{children}</Box>
    </Container>
  )
}
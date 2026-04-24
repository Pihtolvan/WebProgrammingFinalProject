import Container from '@mui/material/Container'
import Box from '@mui/material/Box'

export default function PageContainer({ children }) {
  return (
    <Container maxWidth='sm'>
      <Box sx={{ py: 4 }}>{children}</Box>
    </Container>
  )
}
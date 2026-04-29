import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2F6FED' },
    secondary: { main: '#00A3B4' },
    background: {
      default: '#F3F7FF',
      paper: '#FFFFFF'
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(',')
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#FFFFFF'
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          overflowWrap: 'anywhere'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
})
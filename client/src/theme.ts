import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0A8754', // Green
      light: '#4CAF50',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFD700', // Gold
      light: '#FFF176',
      dark: '#F57F17',
      contrastText: '#000000',
    },
    background: {
      default: '#FFFFFF', // White
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E7D32',
      secondary: '#0A8754',
    },
    success: {
      main: '#0A8754',
      light: '#4CAF50',
      dark: '#2E7D32',
    },
    warning: {
      main: '#FFD700',
      light: '#FFF176',
      dark: '#F57F17',
    },
  },
  typography: {
    fontFamily: '"Calibri", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(10,135,84,0.1)',
          borderRadius: 12,
          border: '1px solid rgba(10,135,84,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(10,135,84,0.2)',
          background: 'linear-gradient(135deg, #0A8754 0%, #2E7D32 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(10,135,84,0.2)',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FFF8 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,215,0,0.1)',
          color: '#0A8754',
          border: '1px solid rgba(255,215,0,0.3)',
        },
      },
    },
  },
});

export default theme;
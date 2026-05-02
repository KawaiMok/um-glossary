import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AppBar, Box, Button, Container, CssBaseline, Stack, Toolbar, Typography } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import EntryDetailPage from './pages/EntryDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import ImportPage from './pages/ImportPage'
import RecentPage from './pages/RecentPage'
import SearchPage from './pages/SearchPage'

function App() {
  // MUI 淺色主題：白底＋藍色主色，語意化 palette（對比、層級一致）
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2563eb',
        dark: '#1d4ed8',
        light: '#3b82f6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
      },
      background: {
        default: '#f1f5f9',
        paper: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
      },
      divider: '#e2e8f0',
      error: { main: '#dc2626' },
      warning: { main: '#d97706' },
      success: { main: '#059669' },
      info: { main: '#0284c7' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "'Inter', 'Noto Sans TC', system-ui, -apple-system, sans-serif",
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#0f172a',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: '#0f172a',
      },
      h6: {
        fontWeight: 600,
        color: '#0f172a',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.55,
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'none',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 0 rgba(15, 23, 42, 0.06)',
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1.25, py: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              UM Glossary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              中英詞彙查詢平台（支援 Excel 檢驗上傳與多工作表匯入）
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <NavButton to="/search" label="搜尋" />
              <NavButton to="/favorites" label="收藏" />
              <NavButton to="/recent" label="最近" />
              <NavButton to="/import" label="匯入" />
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/entry/:id" element={<EntryDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="/import" element={<ImportPage />} />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

function NavButton({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Button
          variant={isActive ? 'contained' : 'outlined'}
          color="primary"
          size="small"
          sx={{
            borderRadius: 999,
            px: 2,
            minHeight: 40,
            borderColor: isActive ? 'primary.main' : 'rgba(37, 99, 235, 0.35)',
            color: isActive ? 'primary.contrastText' : 'primary.main',
            bgcolor: isActive ? 'primary.main' : 'transparent',
            boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.28)' : 'none',
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: isActive ? 'primary.dark' : 'rgba(37, 99, 235, 0.06)',
            },
          }}
        >
          {label}
        </Button>
      )}
    </NavLink>
  )
}

export default App

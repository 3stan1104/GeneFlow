import { useMemo, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography,
  IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Tooltip, Button, CircularProgress,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SchoolIcon from '@mui/icons-material/School'
import GroupIcon from '@mui/icons-material/Group'
import { signOut } from 'firebase/auth'
import LoginPage from './pages/LoginPage'
import StudentsPage from './pages/StudentsPage'
import UsersPage from './pages/UsersPage'
import { auth } from './firebase'
import { useSession } from './context/SessionContext'

const drawerWidth = 260
const navItems = [
  { id: 'students', label: 'Student Play Time', icon: <SchoolIcon fontSize="small" />, path: '/students' },
  { id: 'users', label: 'Manage Users', icon: <GroupIcon fontSize="small" />, path: '/users' },
]

function App() {
  const {
    user, setUser, initializing, themeMode,
    toggleThemeMode,
  } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: '#1A73E8' },
          background: {
            default: themeMode === 'light' ? '#f5f7fb' : '#0f111a',
            paper: themeMode === 'light' ? '#ffffff' : '#161823',
          },
        },
        shape: { borderRadius: 12 },
      }),
    [themeMode],
  )

  const handleLoginSuccess = (userData) => {
    setUser({ uid: userData.uid, email: userData.email, displayName: userData.displayName })
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Failed to sign out', error)
    }
    navigate('/students')
  }

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev)
  const handleNavClick = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          GeneFlow
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Teacher Dashboard
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={location.pathname === item.path}
            onClick={() => handleNavClick(item.path)}
            sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
    </Box>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {initializing ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : !user ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} mode={themeMode} onToggleMode={toggleThemeMode} />
      ) : (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppBar
            position="fixed"
            color="default"
            elevation={0}
            sx={{
              width: { md: `calc(100% - ${drawerWidth}px)` },
              ml: { md: `${drawerWidth}px` },
              borderBottom: 1,
              borderColor: 'divider',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                GeneFlow
              </Typography>
              <Tooltip title="Toggle theme">
                <IconButton color="inherit" onClick={toggleThemeMode} sx={{ mr: 1 }}>
                  {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign out">
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                  Logout
                </Button>
              </Tooltip>
            </Toolbar>
          </AppBar>
          <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              open
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 4 },
              width: { md: `calc(100% - ${drawerWidth}px)` },
              mt: 8,
            }}
          >
            <Routes>
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/" element={<Navigate to="/students" replace />} />
            </Routes>
          </Box>
        </Box>
      )}
    </ThemeProvider>
  )
}

export default App

import { useMemo, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography,
  IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Tooltip, CircularProgress, Avatar, Menu, MenuItem,
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
import UnauthorizedPage from './pages/UnauthorizedPage'
import { auth } from './firebase'
import { useSession } from './context/SessionContext'

const drawerWidth = 260
const navItems = [
  { id: 'students', label: 'My Students', icon: <SchoolIcon fontSize="small" />, path: '/students' },
  { id: 'users', label: 'Manage Users', icon: <GroupIcon fontSize="small" />, path: '/users' },
]

function App() {
  const {
    user, setUser, initializing, themeMode,
    toggleThemeMode,
  } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const menuOpen = Boolean(anchorEl)

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: true,
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
    handleMenuClose()
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Failed to sign out', error)
    }
    navigate('/students')
  }

  // Get initials for avatar
  const getInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(' ')
      return names.map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev)
  const handleNavClick = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
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
      ) : user.role !== 'admin' ? (
        <UnauthorizedPage onGoHome={handleLogout} />
      ) : (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppBar
            position="fixed"
            color="default"
            elevation={0}
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
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
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  GeneFlow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teacher Dashboard
                </Typography>
              </Box>
              <Tooltip title="Toggle theme">
                <IconButton color="inherit" onClick={toggleThemeMode} sx={{ mr: 1 }}>
                  {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Account">
                <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    {getInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                slotProps={{
                  paper: {
                    elevation: 3,
                    sx: {
                      minWidth: 200,
                      mt: 1.5,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {getInitials()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {user?.displayName || 'Adviser'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email || '—'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
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

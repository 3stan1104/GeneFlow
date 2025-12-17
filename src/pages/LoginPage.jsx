import { useState } from 'react'
import {
    Alert, Box, Button, CircularProgress, IconButton, InputAdornment,
    Paper, Stack, TextField, Tooltip, Typography, Fab, Snackbar,
} from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

function LoginPage({ onLoginSuccess, mode = 'light', onToggleMode }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [setupLoading, setSetupLoading] = useState(false)
    const [setupMessage, setSetupMessage] = useState('')
    const [setupSnackbarOpen, setSetupSnackbarOpen] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setLoading(true)
        try {
            const credentials = await signInWithEmailAndPassword(auth, email.trim(), password)
            const user = credentials.user
            // Role checking is handled by App.jsx - non-admins will see UnauthorizedPage
            onLoginSuccess(user)
        } catch (err) {
            setError(err.message ?? 'Unable to login with the provided credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                background: mode === 'light' ? 'linear-gradient(120deg, #e3f2fd, #f5f7fb)' : 'linear-gradient(120deg, #07090f, #111320)',
            }}
        >
            <IconButton
                onClick={onToggleMode}
                color="inherit"
                sx={{ position: 'fixed', top: 16, right: 16, bgcolor: 'background.paper' }}
            >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <Paper elevation={12} sx={{ maxWidth: 420, width: '100%', p: { xs: 4, md: 5 }, borderRadius: 4 }}>
                <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                    <Stack spacing={1} textAlign="center">
                        <Typography variant="overline" color="primary">
                            Welcome Back
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            GeneFlow Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in with your credentials to continue.
                        </Typography>
                    </Stack>

                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        fullWidth
                        required
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                                            <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />

                    <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2 }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                </Stack>
            </Paper>

            <Snackbar open={setupSnackbarOpen} autoHideDuration={4000} onClose={() => setSetupSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSetupSnackbarOpen(false)} severity={setupMessage?.toLowerCase().startsWith('created') ? 'success' : 'info'} sx={{ width: '100%' }}>
                    {setupMessage || 'Operation completed'}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default LoginPage

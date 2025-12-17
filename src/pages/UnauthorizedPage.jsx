import { Box, Typography, Button, Paper } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import HomeIcon from '@mui/icons-material/Home'

function UnauthorizedPage({ onGoHome }) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 3,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    textAlign: 'center',
                    p: { xs: 4, sm: 6 },
                    maxWidth: 440,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                    }}
                >
                    <LockOutlinedIcon sx={{ fontSize: 60, color: 'white' }} />
                </Box>

                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Access Denied
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    You don't have permission to access this page. This area is restricted to authorized administrators only.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<HomeIcon />}
                    onClick={onGoHome}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Go Back Home
                </Button>
            </Paper>
        </Box>
    )
}

export default UnauthorizedPage

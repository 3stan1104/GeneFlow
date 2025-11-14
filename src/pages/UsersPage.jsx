import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Alert, Box, Button, Chip, Paper, Stack, Typography, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton, Snackbar,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import LockResetIcon from '@mui/icons-material/LockReset'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { collection, addDoc, } from 'firebase/firestore'
import { db } from '../firebase'
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://geneflow-letran.vercel.app'

function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [open, setOpen] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

    const handleDelete = useCallback(async (uid) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/delete?uid=${uid}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete user')
            setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' })
            fetchUsers()
        } catch (err) {
            console.error('Failed to delete user', err)
            setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' })
        }
    }, [fetchUsers])

    const handleResetPassword = useCallback(async (email) => {
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/resetPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            if (!response.ok) throw new Error('Failed to generate reset link')
            const data = await response.json()
            setSnackbar({ open: true, message: 'Password reset link generated', severity: 'success' })
            console.log('Reset link:', data.resetLink)
        } catch (err) {
            console.error('Failed to reset password', err)
            setSnackbar({ open: true, message: 'Failed to generate reset link', severity: 'error' })
        }
    }, [])

    const columns = useMemo(
        () => [
            { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 240 },
            {
                field: 'status',
                headerName: 'Status',
                flex: 0.5,
                minWidth: 120,
                renderCell: (params) => {
                    const status = (params.value ?? 'active').toLowerCase()
                    const color = status === 'active' ? 'success' : status === 'disabled' ? 'error' : 'default'
                    return <Chip size="small" color={color} label={status.replace(/^./, (c) => c.toUpperCase())} />
                },
            },
            {
                field: 'emailVerified',
                headerName: 'Verified',
                flex: 0.4,
                minWidth: 100,
                renderCell: (params) => (
                    <Chip
                        size="small"
                        color={params.value ? 'success' : 'default'}
                        label={params.value ? 'Yes' : 'No'}
                    />
                ),
            },
            {
                field: 'lastLogin',
                headerName: 'Last Login',
                flex: 0.8,
                minWidth: 180,
                valueFormatter: (params) => {
                    if (!params.value) return '—'
                    const date = new Date(params.value)
                    if (Number.isNaN(date.getTime())) return '—'
                    return date.toLocaleString()
                },
            },
            {
                field: 'actions',
                headerName: 'Actions',
                flex: 0.6,
                minWidth: 120,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={0.5}>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleResetPassword(params.row.email)}
                            aria-label="reset password"
                            title="Send password reset link"
                        >
                            <LockResetIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(params.row.id)}
                            aria-label="delete user"
                            title="Delete user"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                ),
            },
        ],
        [handleDelete, handleResetPassword],
    )

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/getAll`)
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }
            const payload = await response.json()
            const mappedUsers = (payload.users || []).map((user) => ({
                id: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                disabled: user.disabled,
                status: user.status,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            }))
            setUsers(mappedUsers)
        } catch (err) {
            console.error('Failed to load users', err)
            setError('Unable to fetch users from the admin service right now.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    return (
        <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Manage Users
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track collaborator access, roles, and status in real time.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                        Add Student
                    </Button>
                </Stack>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper sx={{ height: 520, width: '100%' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
                />
            </Paper>

            {/* Add Student Dialog */}
            <AddStudentDialog openStateHook={[open, setOpen]} onAdded={() => setSnackbar({ open: true, message: 'Student added', severity: 'success' })} />

            {/* Snackbar feedback */}
            <SnackbarController snackbarStateHook={[snackbar, setSnackbar]} />
        </Stack>
    )
}

export default UsersPage

function AddStudentDialog({ openStateHook, onAdded }) {
    const [open, setOpen] = openStateHook
    const [name, setName] = useState('')
    const [studentNumber, setStudentNumber] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleClose = () => setOpen(false)

    const handleSubmit = async () => {
        if (!name.trim()) return
        setSubmitting(true)
        try {
            await addDoc(collection(db, 'students'), {
                name: name.trim(),
                studentNumber: studentNumber.trim() || null,
                progress: 0,
                score: 0,
                createdAt: new Date(),
            })
            setName('')
            setStudentNumber('')
            setOpen(false)
            onAdded?.()
        } catch (err) {
            console.error('Failed to add student', err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Add Student
                <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                    <TextField label="Student Number" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} fullWidth />
                    <Typography variant="caption" color="text.secondary">
                        Progress and score start at 0 and update automatically as students advance.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={submitting || !name.trim()}>
                    {submitting ? 'Saving…' : 'Add Student'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

function SnackbarController({ snackbarStateHook }) {
    const [snackbar, setSnackbar] = snackbarStateHook
    const handleClose = () => setSnackbar({ ...snackbar, open: false })
    return (
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity={snackbar.severity} onClose={handleClose} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
    )
}

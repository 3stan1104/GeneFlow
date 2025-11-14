import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Snackbar,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import {
    collection,
    addDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://geneflow-letran.vercel.app'

function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [open, setOpen] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

    const columns = useMemo(
        () => [
            { field: 'name', headerName: 'Full Name', flex: 1, minWidth: 180 },
            { field: 'email', headerName: 'Email', flex: 1.1, minWidth: 220 },
            { field: 'role', headerName: 'Role', flex: 0.6, minWidth: 140 },
            {
                field: 'status',
                headerName: 'Status',
                flex: 0.5,
                minWidth: 140,
                renderCell: (params) => {
                    const status = (params.value ?? 'inactive').toLowerCase()
                    const color = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'
                    return <Chip size="small" color={color} label={status.replace(/^./, (c) => c.toUpperCase())} />
                },
            },
            {
                field: 'lastLogin',
                headerName: 'Last Login',
                flex: 0.8,
                minWidth: 200,
                valueFormatter: (params) => {
                    if (!params.value) return '—'
                    const date = new Date(params.value)
                    if (Number.isNaN(date.getTime())) return '—'
                    return date.toLocaleString()
                },
            },
        ],
        [],
    )

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/users`)
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }
            const payload = await response.json()
            const mappedUsers = (payload.users || []).map((user) => ({
                id: user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                lastLogin: user.lastLogin,
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

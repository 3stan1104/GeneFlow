import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Alert, Box, Button, Chip, Paper, Stack, Typography, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton, Snackbar, MenuItem,
} from '@mui/material'
import { auth } from '../firebase'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import { DataGrid, showToolbar } from '@mui/x-data-grid'
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://geneflow-letran.vercel.app'
const MIN_PASSWORD_LENGTH = 6
const SECTION_OPTIONS = ['Harvey', 'Heisenberg', 'Fermat', 'Ampere']
const SECTION_CURRICULUM_MAP = {
    Harvey: 'LSHS',
    Heisenberg: 'LSHS',
    Fermat: 'BEC',
    Ampere: 'BEC',
}

function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [open, setOpen] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            // include current user's ID token if available to authenticate admin API requests
            let headers = { 'Content-Type': 'application/json' }
            try {
                const current = auth.currentUser
                if (current) {
                    const token = await current.getIdToken(true)
                    if (token) headers.Authorization = `Bearer ${token}`
                }
            } catch (tokenErr) {
                console.warn('Failed to obtain ID token for fetchUsers', tokenErr)
            }

            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/getAll`, { headers })
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }
            const payload = await response.json()
            const mappedUsers = (payload.users || []).map((user) => ({
                id: user.uid,
                studentNumber: user.uid,
                email: user.email,
                role: user.role || null,
                firstName: user.firstName || null,
                middleName: user.middleName || null,
                lastName: user.lastName || null,
                section: user.section || null,
                curriculum: user.curriculum || null,
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

    const handleDelete = useCallback(async (uid) => {
        try {
            // include ID token for auth
            let headers = {}
            try {
                const current = auth.currentUser
                if (current) {
                    const token = await current.getIdToken(true)
                    if (token) headers.Authorization = `Bearer ${token}`
                }
            } catch (t) {
                console.warn('Failed to get token for delete', t)
            }

            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/delete?uid=${uid}`, {
                method: 'DELETE',
                headers,
            })
            if (!response.ok) throw new Error('Failed to delete user')
            // Optimistically remove the row so the UI updates immediately
            setUsers((prev) => prev.filter((r) => r.id !== uid))
            setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' })
            // Ensure we refresh from server to keep state in sync
            await fetchUsers()
        } catch (err) {
            console.error('Failed to delete user', err)
            setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' })
        }
    }, [fetchUsers])

    // State for confirmation dialog when deleting a user
    const [pendingDelete, setPendingDelete] = useState(null)

    const handleDeleteClick = useCallback((uid) => {
        setPendingDelete(uid)
    }, [])

    const handleCancelDelete = useCallback(() => setPendingDelete(null), [])

    const handleConfirmDelete = useCallback(async () => {
        if (!pendingDelete) return
        const uid = pendingDelete
        setPendingDelete(null)
        await handleDelete(uid)
    }, [pendingDelete, handleDelete])

    const handleEditClick = useCallback((user) => {
        setEditUser(user)
    }, [])

    const handleEditClose = useCallback(() => {
        setEditUser(null)
    }, [])

    const handleResetPassword = useCallback(async (email) => {
        try {
            // include ID token for auth
            let headers = { 'Content-Type': 'application/json' }
            try {
                const current = auth.currentUser
                if (current) {
                    const token = await current.getIdToken(true)
                    if (token) headers.Authorization = `Bearer ${token}`
                }
            } catch (t) {
                console.warn('Failed to get token for resetPassword', t)
            }

            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/resetPassword`, {
                method: 'POST',
                headers,
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
            { field: 'studentNumber', headerName: 'Student Number', flex: 0.8, minWidth: 140 },
            { field: 'firstName', headerName: 'First Name', flex: 0.7, minWidth: 140 },
            { field: 'middleName', headerName: 'Middle Name', flex: 0.6, minWidth: 120 },
            { field: 'lastName', headerName: 'Last Name', flex: 0.8, minWidth: 160 },
            { field: 'section', headerName: 'Section', flex: 0.6, minWidth: 120 },
            { field: 'curriculum', headerName: 'Curriculum', flex: 0.8, minWidth: 140 },
            // {
            //     field: 'emailVerified',
            //     headerName: 'Verified',
            //     flex: 0.4,
            //     minWidth: 100,
            //     renderCell: (params) => (
            //         <Chip
            //             size="small"
            //             color={params.value ? 'success' : 'default'}
            //             label={params.value ? 'Yes' : 'No'}
            //         />
            //     ),
            // },
            {
                field: 'lastLogin',
                headerName: 'Last Activity',
                flex: 0.8,
                minWidth: 180,
                valueFormatter: (value) => {
                    // In MUI X DataGrid v6+, valueFormatter receives the value directly
                    if (value == null) return '—'
                    const date = new Date(value)
                    if (Number.isNaN(date.getTime())) return '—'
                    return date.toLocaleString()
                },
            },
            {
                field: 'role',
                headerName: 'Role',
                flex: 0.5,
                minWidth: 120,
                renderCell: (params) => {
                    const role = (params.value || '').toString()
                    const name = role ? role.replace(/^./, (c) => c.toUpperCase()) : '—'
                    const color = role.toLowerCase() === 'admin' ? 'warning' : role.toLowerCase() === 'student' ? 'info' : 'default'
                    return <Chip size="small" color={color} label={name} />
                },
            },
            {
                field: 'actions',
                headerName: 'Actions',
                flex: 0.5,
                minWidth: 80,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={0} sx={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(params.row)}
                            aria-label="edit user"
                            title="Edit user"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        {/* <IconButton
                            size="medium"
                            color="primary"
                            onClick={() => handleResetPassword(params.row.email)}
                            aria-label="reset password"
                            title="Send password reset link"
                            sx={{ p: 1.25 }}
                        >
                            <LockResetIcon fontSize="small" />
                        </IconButton> */}
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(params.row.id)}
                            aria-label="delete user"
                            title="Delete user"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                ),
            },
        ],
        [handleDeleteClick, handleEditClick, handleResetPassword],
    )

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
                        View, add, and manage user accounts
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                        Add User
                    </Button>
                </Stack>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper sx={{ height: 520, width: '100%', overflowX: 'auto' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    slots={{ showToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
                    sx={{ width: '100%' }}
                />
            </Paper>

            {/* Add Student Dialog */}
            <UserFormDialog
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={() => {
                    setSnackbar({ open: true, message: 'User added', severity: 'success' })
                    fetchUsers()
                }}
                snackbarStateHook={[snackbar, setSnackbar]}
            />

            {/* Edit User Dialog */}
            <UserFormDialog
                open={!!editUser}
                onClose={handleEditClose}
                editUser={editUser}
                onSuccess={() => {
                    setSnackbar({ open: true, message: 'User updated', severity: 'success' })
                    fetchUsers()
                }}
                snackbarStateHook={[snackbar, setSnackbar]}
            />

            {/* Confirm delete dialog */}
            <Dialog open={!!pendingDelete} onClose={handleCancelDelete}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this user?</Typography>
                    {pendingDelete && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            UID: {pendingDelete}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar feedback */}
            <SnackbarController snackbarStateHook={[snackbar, setSnackbar]} />
        </Stack>
    )
}

export default UsersPage

function UserFormDialog({ open, onClose, editUser, onSuccess, snackbarStateHook }) {
    const [, setSnackbar] = snackbarStateHook || []
    const isEditMode = !!editUser

    const [email, setEmail] = useState('')
    const [studentNumber, setStudentNumber] = useState('')
    const [firstName, setFirstName] = useState('')
    const [middleName, setMiddleName] = useState('')
    const [lastName, setLastName] = useState('')
    const [section, setSection] = useState('')
    const [curriculum, setCurriculum] = useState('')
    const [password, setPassword] = useState('')
    const [passwordTouched, setPasswordTouched] = useState(false)
    const [role, setRole] = useState('student')
    const [submitting, setSubmitting] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (editUser) {
            setEmail(editUser.email || '')
            setStudentNumber(editUser.studentNumber || editUser.id || '')
            setFirstName(editUser.firstName || '')
            setMiddleName(editUser.middleName || '')
            setLastName(editUser.lastName || '')
            setSection(editUser.section || '')
            setCurriculum(editUser.curriculum || '')
            setRole(editUser.role || 'student')
            setPassword('')
            setPasswordTouched(false)
        } else {
            resetForm()
        }
    }, [editUser])

    const resetForm = () => {
        setEmail('')
        setStudentNumber('')
        setFirstName('')
        setMiddleName('')
        setLastName('')
        setSection('')
        setCurriculum('')
        setPassword('')
        setPasswordTouched(false)
        setRole('student')
    }

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const passwordTooShort = trimmedPassword.length > 0 && trimmedPassword.length < MIN_PASSWORD_LENGTH
    const isPasswordValid = trimmedPassword.length >= MIN_PASSWORD_LENGTH

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSectionChange = (event) => {
        const selectedSection = event.target.value
        setSection(selectedSection)
        setCurriculum(SECTION_CURRICULUM_MAP[selectedSection] || '')
    }

    const handleSubmit = async () => {
        if (isEditMode) {
            await handleUpdate()
        } else {
            await handleCreate()
        }
    }

    const handleCreate = async () => {
        if (!trimmedEmail || !trimmedPassword || !isPasswordValid) {
            setPasswordTouched(true)
            return
        }
        setSubmitting(true)
        try {
            const body = {
                email: trimmedEmail,
                password: trimmedPassword,
                firstName: firstName.trim() || null,
                middleName: middleName.trim() || null,
                lastName: lastName.trim() || null,
                section: section?.trim() || null,
                curriculum: curriculum?.trim() || null,
                uid: studentNumber.trim() || undefined,
                role: role || 'student',
            }

            let headers = { 'Content-Type': 'application/json' }
            try {
                const current = auth.currentUser
                if (current) {
                    const token = await current.getIdToken(true)
                    if (token) headers.Authorization = `Bearer ${token}`
                }
            } catch (t) {
                console.warn('Failed to get token for create', t)
            }

            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => null)
                const message = err?.error || err?.message || 'Failed to create user'
                setSnackbar?.({ open: true, message, severity: 'error' })
                throw new Error(message)
            }

            resetForm()
            onClose()
            setSnackbar?.({ open: true, message: 'User created', severity: 'success' })
            onSuccess?.()
        } catch (err) {
            console.error('Failed to create user', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdate = async () => {
        if (!editUser?.id) return
        // Validate password if provided
        if (trimmedPassword && trimmedPassword.length < MIN_PASSWORD_LENGTH) {
            setPasswordTouched(true)
            return
        }
        setSubmitting(true)
        try {
            const body = {
                uid: editUser.id,
                firstName: firstName.trim() || null,
                middleName: middleName.trim() || null,
                lastName: lastName.trim() || null,
                section: section?.trim() || null,
                curriculum: curriculum?.trim() || null,
                role: role || 'student',
                ...(trimmedPassword && { password: trimmedPassword }),
            }

            let headers = { 'Content-Type': 'application/json' }
            try {
                const current = auth.currentUser
                if (current) {
                    const token = await current.getIdToken(true)
                    if (token) headers.Authorization = `Bearer ${token}`
                }
            } catch (t) {
                console.warn('Failed to get token for update', t)
            }

            const response = await fetch(`${ADMIN_API_BASE_URL}/api/user/update`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => null)
                const message = err?.error || err?.message || 'Failed to update user'
                setSnackbar?.({ open: true, message, severity: 'error' })
                throw new Error(message)
            }

            resetForm()
            onClose()
            setSnackbar?.({ open: true, message: 'User updated', severity: 'success' })
            onSuccess?.()
        } catch (err) {
            console.error('Failed to update user', err)
        } finally {
            setSubmitting(false)
        }
    }

    const isSubmitDisabled = isEditMode
        ? submitting
        : submitting || !trimmedEmail || !isPasswordValid

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {isEditMode ? 'Edit User' : 'Create User'}
                <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        required={!isEditMode}
                        disabled={isEditMode}
                        helperText={isEditMode ? 'Email cannot be changed' : ''}
                    />
                    <TextField
                        label="Student Number"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        fullWidth
                        disabled={isEditMode}
                        helperText={isEditMode ? 'Student number cannot be changed' : 'Optional: set internal UID (e.g. student number)'}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
                        <TextField label="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} fullWidth />
                        <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField select label="Section" value={section} onChange={handleSectionChange} fullWidth helperText="Select the classroom section">
                            {SECTION_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Curriculum"
                            value={curriculum}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            helperText={section ? 'Automatically set based on section' : 'Choose a section to set curriculum'}
                        />
                    </Stack>
                    <TextField
                        select
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        fullWidth
                        helperText="Select the role for this user"
                    >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                    <TextField
                        label={isEditMode ? 'New Password' : 'Password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        fullWidth
                        required={!isEditMode}
                        type="password"
                        error={passwordTouched && passwordTooShort}
                        helperText={
                            isEditMode
                                ? (passwordTooShort ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` : 'Leave blank to keep current password')
                                : (passwordTouched && passwordTooShort
                                    ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                                    : `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
                        }
                    />
                    {!isEditMode && (
                        <Typography variant="caption" color="text.secondary">
                            Use at least {MIN_PASSWORD_LENGTH} characters so the user can sign in and reset their credentials afterward.
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitDisabled}
                >
                    {submitting ? (isEditMode ? 'Updating…' : 'Creating…') : (isEditMode ? 'Update User' : 'Create User')}
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

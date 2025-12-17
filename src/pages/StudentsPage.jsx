import { useEffect, useMemo, useState } from 'react'
import {
    Alert, Box, Card, CardContent, CircularProgress,
    Stack, Typography, Grid, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton
} from '@mui/material'
import { collection, getDocs } from 'firebase/firestore'
import SchoolIcon from '@mui/icons-material/School'
import ScienceIcon from '@mui/icons-material/Science'
import HealingIcon from '@mui/icons-material/Healing'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import StudentProgressCard from '../components/StudentProgressCard'
import { db } from '../firebase'

function StudentsPage() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [sectionFilter, setSectionFilter] = useState('all')
    const [sortBy, setSortBy] = useState('playTime')
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'students'))
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                data.sort((a, b) => getPlayTimeMinutes(b) - getPlayTimeMinutes(a))
                setStudents(data)
            } catch (err) {
                console.error('Failed to load students', err)
                setError('Unable to fetch student play time right now.')
            } finally {
                setLoading(false)
            }
        }

        fetchStudents()
    }, [])

    // Get unique sections for filter
    const sections = useMemo(() => {
        const sectionSet = new Set(students.map(s => s.section).filter(Boolean))
        return ['all', ...Array.from(sectionSet).sort()]
    }, [students])

    // Filter and sort students
    const filteredStudents = useMemo(() => {
        let result = [...students]

        // Filter by section
        if (sectionFilter !== 'all') {
            result = result.filter(s => s.section === sectionFilter)
        }

        // Sort
        result.sort((a, b) => {
            let aVal, bVal
            switch (sortBy) {
                case 'playTime':
                    aVal = getPlayTimeMinutes(a)
                    bVal = getPlayTimeMinutes(b)
                    break
                case 'cured':
                    aVal = a.mutations?.cured ?? 0
                    bVal = b.mutations?.cured ?? 0
                    break
                case 'failed':
                    aVal = a.mutations?.failed ?? 0
                    bVal = b.mutations?.failed ?? 0
                    break
                default:
                    aVal = getPlayTimeMinutes(a)
                    bVal = getPlayTimeMinutes(b)
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        })

        return result
    }, [students, sectionFilter, sortBy, sortOrder])

    const stats = useMemo(() => {
        if (!students.length) {
            return { averagePlayTime: 0, totalCured: 0, totalFailed: 0 }
        }
        const totalPlayTime = students.reduce((sum, student) => sum + getPlayTimeMinutes(student), 0)
        const totalCured = students.reduce((sum, student) => sum + (student.mutations?.cured ?? 0), 0)
        const totalFailed = students.reduce((sum, student) => sum + (student.mutations?.failed ?? 0), 0)
        return {
            averagePlayTime: Math.round(totalPlayTime / students.length),
            totalCured,
            totalFailed,
        }
    }, [students])

    const formatPlayTime = (minutes) => {
        if (!minutes || Number.isNaN(minutes)) return '0m'
        const totalMinutes = Math.max(0, Math.round(minutes))
        const hours = Math.floor(totalMinutes / 60)
        const mins = totalMinutes % 60
        if (hours && mins) return `${hours}h ${mins}m`
        if (hours) return `${hours}h`
        return `${mins}m`
    }

    function getPlayTimeMinutes(student) {
        if (!student || typeof student !== 'object') return 0
        const candidates = ['playTimeMinutes', 'playtimeMinutes', 'playTime', 'timeSpentMinutes', 'timeSpent']
        for (const key of candidates) {
            const value = student[key]
            if (typeof value === 'number' && !Number.isNaN(value)) {
                return value
            }
        }
        return 0
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Stack spacing={4}>
            <Typography variant="h4" fontWeight={700}>
                My Students
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <SchoolIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Total Students
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {students.length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <TrendingUpIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Avg Play Time
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {formatPlayTime(stats.averagePlayTime)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <HealingIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Total Cured
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main">
                                        {stats.totalCured}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'error.main', color: 'error.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <ScienceIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Total Failed
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="error.main">
                                        {stats.totalFailed}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Section</InputLabel>
                    <Select
                        value={sectionFilter}
                        label="Section"
                        onChange={(e) => setSectionFilter(e.target.value)}
                    >
                        {sections.map((section) => (
                            <MenuItem key={section} value={section}>
                                {section === 'all' ? 'All Sections' : section}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <MenuItem value="playTime">Play Time</MenuItem>
                        <MenuItem value="cured">Cured</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                </FormControl>

                <ToggleButtonGroup
                    value={sortOrder}
                    exclusive
                    onChange={(e, newOrder) => newOrder && setSortOrder(newOrder)}
                    size="small"
                >
                    <ToggleButton value="desc">
                        <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                    </ToggleButton>
                    <ToggleButton value="asc">
                        <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    Showing {filteredStudents.length} of {students.length} students
                </Typography>
            </Stack>

            {/* Student Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)'
                    },
                    gap: 2,
                    width: '100%'
                }}
            >
                {filteredStudents.map((student) => (
                    <Box key={student.id} sx={{ display: 'flex' }}>
                        <StudentProgressCard student={student} />
                    </Box>
                ))}
            </Box>
        </Stack>
    )
}

export default StudentsPage

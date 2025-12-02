import { useEffect, useMemo, useState } from 'react'
import {
    Alert, Box, Card, CardContent, CircularProgress,
    Stack, Typography, Grid
} from '@mui/material'
import { collection, getDocs } from 'firebase/firestore'
import SchoolIcon from '@mui/icons-material/School'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import StudentProgressCard from '../components/StudentProgressCard'
import { db } from '../firebase'

function StudentsPage() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

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

    const stats = useMemo(() => {
        if (!students.length) {
            return { averagePlayTime: 0, averageScore: 0 }
        }
        const totalPlayTime = students.reduce((sum, student) => sum + getPlayTimeMinutes(student), 0)
        const totalScore = students.reduce((sum, student) => sum + (student.score ?? 0), 0)
        return {
            averagePlayTime: Math.round(totalPlayTime / students.length),
            averageScore: Math.round(totalScore / students.length),
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
        const candidates = ['playTimeMinutes', 'playtimeMinutes', 'playTime', 'timeSpentMinutes', 'timeSpent', 'progress']
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
                Student Play Time
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Grid container spacing={3}>
                <Grid xs={12} md={4}>
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
                <Grid xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <TrendingUpIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Average Play Time
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {formatPlayTime(stats.averagePlayTime)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%', p: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                                    <EmojiEventsIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Average Score
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {stats.averageScore}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                    Play Time Overview
                </Typography>
                <Grid container spacing={2} alignItems="stretch">
                    {students.map((student) => {
                        const nameObj = student.name || {}
                        const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(' ').trim() || student.name || 'Unnamed'
                        const studentNumber = student.studentNumber || student.id
                        return (
                            <Grid key={student.id} xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                                <StudentProgressCard
                                    name={fullName}
                                    studentNumber={studentNumber}
                                    score={student.score}
                                    playTimeMinutes={getPlayTimeMinutes(student)}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </Stack>
        </Stack>
    )
}

export default StudentsPage

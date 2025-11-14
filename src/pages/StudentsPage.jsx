import { useEffect, useMemo, useState } from 'react'
import {
    Alert, Box, Card, CardContent, Chip, CircularProgress,
    LinearProgress, Stack, Typography, Grid
} from '@mui/material'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
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
                const studentsQuery = query(collection(db, 'students'), orderBy('progress', 'desc'))
                const snapshot = await getDocs(studentsQuery)
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                setStudents(data)
            } catch (err) {
                console.error('Failed to load students', err)
                setError('Unable to fetch student progress right now.')
            } finally {
                setLoading(false)
            }
        }

        fetchStudents()
    }, [])

    const stats = useMemo(() => {
        if (!students.length) {
            return { averageProgress: 0, averageScore: 0 }
        }
        const totalProgress = students.reduce((sum, student) => sum + (student.progress ?? 0), 0)
        const totalScore = students.reduce((sum, student) => sum + (student.score ?? 0), 0)
        return {
            averageProgress: Math.round(totalProgress / students.length),
            averageScore: Math.round(totalScore / students.length),
        }
    }, [students])

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
                Student Progress
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
                                        Average Progress
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {stats.averageProgress}%
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
                    Progress Overview
                </Typography>
                <Grid container spacing={2}>
                    {students.map((student) => (
                        <Grid key={student.id} xs={12} md={6}>
                            <StudentProgressCard
                                name={student.name}
                                studentNumber={student.studentNumber}
                                score={student.score}
                                progress={student.progress}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Stack>
    )
}

export default StudentsPage

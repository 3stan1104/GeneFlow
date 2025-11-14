import React from 'react'
import { Card, CardContent, Stack, Typography, Avatar, Box, LinearProgress } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'

export default function StudentProgressCard({ name = 'Unnamed', studentNumber = null, score = null, progress = 0 }) {
    const displayScore = typeof score === 'number' ? score : 'N/A'
    const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : 0

    return (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <SchoolIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            ID: {studentNumber ?? 'N/A'}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', minWidth: 72 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {displayScore}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Score
                        </Typography>
                    </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ flex: 1 }}>
                            <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 5 }} />
                        </Box>
                        <Box sx={{ minWidth: 48, textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                                {pct}%
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    )
}

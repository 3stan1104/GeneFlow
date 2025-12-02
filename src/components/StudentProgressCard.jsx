import React from 'react'
import { Card, CardContent, Stack, Typography, Avatar, Box } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'

export default function StudentProgressCard({ name = 'Unnamed', studentNumber = null, score = null, playTimeMinutes = 0 }) {
    const displayScore = typeof score === 'number' ? score : 'N/A'
    const formattedPlayTime = formatPlayTime(playTimeMinutes)

    // Normalize name parts: support either an object { first, middle, last }
    // or a single string like "First Middle Last"
    let firstName = ''
    let middleName = ''
    let lastName = ''
    if (name && typeof name === 'object') {
        firstName = name.first || ''
        middleName = name.middle || ''
        lastName = name.last || ''
    } else if (typeof name === 'string') {
        const parts = name.trim().split(/\s+/)
        if (parts.length === 1) {
            lastName = parts[0]
        } else {
            lastName = parts.slice(-1).join(' ')
            firstName = parts.slice(0, -1).join(' ')
            // if there's more than one first-part, treat middle as later part
            const fm = firstName.split(/\s+/)
            if (fm.length > 1) {
                middleName = fm.slice(1).join(' ')
                firstName = fm[0]
            }
        }
    }
    const middleInitial = middleName ? `${middleName.trim()[0]}.` : ''

    return (
        <Card elevation={2} sx={{ height: 180, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', p: 2, gap: 0.5 }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, mt: 0.5 }}>
                        <SchoolIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} sx={{
                            whiteSpace: 'normal',
                            overflowWrap: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}>
                            {lastName ? `${lastName}` : 'Unnamed'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontWeight: 700, lineHeight: 1 }}>
                            {(firstName || middleInitial) ? `${firstName}${firstName && middleInitial ? ' ' : ''}${middleInitial}` : ''}
                        </Typography>
                        {/* ID on its own row */}
                    </Box>

                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%" sx={{ mt: 1 }}>
                    <Box sx={{ textAlign: 'left', minWidth: 72 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {studentNumber ?? 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Student Number
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left', minWidth: 72 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {displayScore}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Score
                        </Typography>
                    </Box>
                </Stack>
                <Box sx={{ mt: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <AccessTimeFilledIcon color="action" fontSize="small" />
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {formattedPlayTime}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Play Time
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    )
}

function formatPlayTime(minutes) {
    if (typeof minutes !== 'number' || Number.isNaN(minutes)) return '0m'
    const rounded = Math.max(0, Math.round(minutes))
    const hours = Math.floor(rounded / 60)
    const mins = rounded % 60
    if (hours && mins) return `${hours}h ${mins}m`
    if (hours) return `${hours}h`
    return `${mins}m`
}

import React from 'react'
import { Card, CardContent, Stack, Typography, Avatar, Box, Chip, Divider } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ScienceIcon from '@mui/icons-material/Science'
import HealingIcon from '@mui/icons-material/Healing'
import SchoolIcon from '@mui/icons-material/School'

export default function StudentProgressCard({ student }) {
    const {
        name = {},
        id = 'N/A',
        curriculum = 'N/A',
        section = 'N/A',
        playTimeMinutes = 0,
        mutations = { cured: 0, occurred: 0 }
    } = student || {}

    // Format name
    const firstName = name?.first || ''
    const middleName = name?.middle || ''
    const lastName = name?.last || ''
    const middleInitial = middleName ? `${middleName.trim()[0]}.` : ''
    const displayName = lastName || 'Unnamed'
    const subName = [firstName, middleInitial].filter(Boolean).join(' ')

    // Format play time
    const formattedPlayTime = formatPlayTime(playTimeMinutes)

    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderColor: 'primary.light',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
                {/* Header Section */}
                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            width: 52,
                            height: 52,
                            fontSize: '1.25rem',
                            fontWeight: 700
                        }}
                    >
                        {firstName?.[0]?.toUpperCase() || lastName?.[0]?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {displayName}
                        </Typography>
                        {subName && (
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                                {subName}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                            {id}
                        </Typography>
                    </Box>
                </Stack>

                {/* Tags */}
                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                    <Chip
                        icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                        label={curriculum}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                    <Chip
                        label={section}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 24, bgcolor: 'action.hover' }}
                    />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* Stats Grid */}
                <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight={700}>
                                {formattedPlayTime}
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Play Time
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <HealingIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="body2" fontWeight={700} color="success.main">
                                {mutations?.cured || 0}
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Cured
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <ScienceIcon sx={{ fontSize: 14, color: 'error.main' }} />
                            <Typography variant="body2" fontWeight={700} color="error.main">
                                {mutations?.failed || 0}
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Failed
                        </Typography>
                    </Box>
                </Stack>
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

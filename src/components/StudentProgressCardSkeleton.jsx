import React from 'react'
import { Card, CardContent, Stack, Box, Divider, Skeleton } from '@mui/material'

export default function StudentProgressCardSkeleton() {
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
            }}
        >
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
                {/* Header Section */}
                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                    {/* Avatar Skeleton */}
                    <Skeleton
                        variant="circular"
                        width={52}
                        height={52}
                        animation="wave"
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Name Skeleton */}
                        <Skeleton
                            variant="text"
                            width="70%"
                            height={24}
                            animation="wave"
                            sx={{ mb: 0.5 }}
                        />
                        {/* Sub Name Skeleton */}
                        <Skeleton
                            variant="text"
                            width="50%"
                            height={18}
                            animation="wave"
                        />
                        {/* ID Skeleton */}
                        <Skeleton
                            variant="text"
                            width="40%"
                            height={14}
                            animation="wave"
                            sx={{ mt: 0.25 }}
                        />
                    </Box>
                </Stack>

                {/* Tags Skeleton */}
                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                    {/* Curriculum Chip Skeleton */}
                    <Skeleton
                        variant="rounded"
                        width={80}
                        height={24}
                        animation="wave"
                        sx={{ borderRadius: 3 }}
                    />
                    {/* Section Chip Skeleton */}
                    <Skeleton
                        variant="rounded"
                        width={60}
                        height={24}
                        animation="wave"
                        sx={{ borderRadius: 3 }}
                    />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* Stats Grid Skeleton */}
                <Stack direction="row" spacing={1} justifyContent="space-between">
                    {/* Play Time Stat */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <Skeleton variant="circular" width={14} height={14} animation="wave" />
                            <Skeleton variant="text" width={30} height={20} animation="wave" />
                        </Stack>
                        <Skeleton
                            variant="text"
                            width={45}
                            height={12}
                            animation="wave"
                            sx={{ mx: 'auto', mt: 0.5 }}
                        />
                    </Box>
                    {/* Cured Stat */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <Skeleton variant="circular" width={14} height={14} animation="wave" />
                            <Skeleton variant="text" width={20} height={20} animation="wave" />
                        </Stack>
                        <Skeleton
                            variant="text"
                            width={35}
                            height={12}
                            animation="wave"
                            sx={{ mx: 'auto', mt: 0.5 }}
                        />
                    </Box>
                    {/* Failed Stat */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <Skeleton variant="circular" width={14} height={14} animation="wave" />
                            <Skeleton variant="text" width={20} height={20} animation="wave" />
                        </Stack>
                        <Skeleton
                            variant="text"
                            width={35}
                            height={12}
                            animation="wave"
                            sx={{ mx: 'auto', mt: 0.5 }}
                        />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

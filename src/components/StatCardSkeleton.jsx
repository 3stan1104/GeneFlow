import React from 'react'
import { Card, CardContent, Stack, Box, Skeleton } from '@mui/material'

export default function StatCardSkeleton() {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    {/* Icon Skeleton - matches the p: 1.25 circular box */}
                    <Skeleton
                        variant="circular"
                        width={48}
                        height={48}
                        animation="wave"
                        sx={{ flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                        {/* Label Skeleton - overline text */}
                        <Skeleton
                            variant="text"
                            width={100}
                            sx={{ fontSize: '0.75rem', mb: 0.5 }}
                            animation="wave"
                        />
                        {/* Value Skeleton - h5 typography */}
                        <Skeleton
                            variant="text"
                            width={60}
                            sx={{ fontSize: '1.5rem' }}
                            animation="wave"
                        />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

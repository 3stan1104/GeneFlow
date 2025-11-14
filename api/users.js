import { adminAuth } from '../src/firebaseAdmin.js'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

async function listAllUsers(nextPageToken, aggregated = []) {
    const result = await adminAuth.listUsers(1000, nextPageToken)
    const combined = [...aggregated, ...result.users]

    if (result.pageToken) {
        return listAllUsers(result.pageToken, combined)
    }

    return combined
}

export default async function handler(req, res) {
    // Handle preflight
    if (req.method === 'OPTIONS') {
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(204).end()
    }

    // Allow GET only
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const users = await listAllUsers()
        const payload = users.map((userRecord) => ({
            uid: userRecord.uid,
            name: userRecord.displayName || 'Unnamed User',
            email: userRecord.email || 'No email',
            role: userRecord.customClaims?.role || 'member',
            status: userRecord.disabled ? 'disabled' : 'active',
            lastLogin: userRecord.metadata?.lastSignInTime || null,
        }))

        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
        return res.status(200).json({ users: payload })
    } catch (error) {
        console.error('Failed to fetch users from admin SDK', error)
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(500).json({ error: 'Unable to fetch users at this time.' })
    }
}

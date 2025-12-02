import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

async function listAllUsers(auth, nextPageToken, aggregated = []) {
    const result = await auth.listUsers(1000, nextPageToken)
    const combined = [...aggregated, ...result.users]

    if (result.pageToken) {
        return listAllUsers(auth, result.pageToken, combined)
    }

    return combined
}

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const auth = getAdminAuth()
        const users = await listAllUsers(auth)
        const payload = users.map((userRecord) => ({
            uid: userRecord.uid,
            email: userRecord.email || 'No email',
            emailVerified: userRecord.emailVerified || false,
            disabled: userRecord.disabled || false,
            status: userRecord.disabled ? 'disabled' : 'active',
            lastLogin: userRecord.metadata?.lastSignInTime || null,
            createdAt: userRecord.metadata?.creationTime || null,
            // custom claims name parts as top-level keys
            firstName: userRecord.customClaims?.firstName || null,
            middleName: userRecord.customClaims?.middleName || null,
            lastName: userRecord.customClaims?.lastName || null,
            section: userRecord.customClaims?.section || null,
            curriculum: userRecord.customClaims?.curriculum || null,
            // role (e.g. 'student', 'admin') if present in custom claims
            role: userRecord.customClaims?.role || null,
        }))
        return res.status(200).json({ users: payload })
    } catch (error) {
        console.error('Failed to fetch users from admin SDK', error)
        return res.status(500).json({ error: 'Unable to fetch users at this time.' })
    }
}

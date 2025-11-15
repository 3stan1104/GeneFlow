import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'DELETE') {
        res.setHeader('Allow', 'DELETE')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const { uid } = req.query

        if (!uid) {
            return res.status(400).json({ error: 'User UID is required' })
        }

        const auth = getAdminAuth()
        // Prevent deleting the last admin account
        // Fetch the target user to see if they are an admin
        let targetUser
        try {
            targetUser = await auth.getUser(uid)
        } catch (e) {
            if (e?.code === 'auth/user-not-found') {
                return res.status(404).json({ error: 'User not found' })
            }
            throw e
        }

        const targetIsAdmin = !!(targetUser.customClaims && targetUser.customClaims.role === 'admin')

        if (targetIsAdmin) {
            // Count admin users (stop early if more than 1 found)
            let nextPageToken = undefined
            let adminCount = 0
            do {
                const page = await auth.listUsers(1000, nextPageToken)
                for (const u of page.users) {
                    if (u.customClaims && u.customClaims.role === 'admin') {
                        adminCount += 1
                        if (adminCount > 1) break
                    }
                }
                nextPageToken = page.pageToken
                if (adminCount > 1) break
            } while (nextPageToken)

            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin account' })
            }
        }

        await auth.deleteUser(uid)

        return res.status(200).json({ success: true, message: `User ${uid} deleted` })
    } catch (error) {
        console.error('Failed to delete user', error)
        return res.status(500).json({ error: error.message || 'Unable to delete user' })
    }
}

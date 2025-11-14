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
        await auth.deleteUser(uid)

        return res.status(200).json({ success: true, message: `User ${uid} deleted` })
    } catch (error) {
        console.error('Failed to delete user', error)
        return res.status(500).json({ error: error.message || 'Unable to delete user' })
    }
}

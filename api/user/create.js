import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const { email, password, displayName } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const auth = getAdminAuth()
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: displayName || null,
        })

        return res.status(201).json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
        })
    } catch (error) {
        console.error('Failed to create user', error)
        return res.status(500).json({ error: error.message || 'Unable to create user' })
    }
}

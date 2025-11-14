import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const auth = getAdminAuth()
        const resetLink = await auth.generatePasswordResetLink(email)

        return res.status(200).json({
            success: true,
            message: 'Password reset link generated',
            resetLink
        })
    } catch (error) {
        console.error('Failed to generate password reset link', error)
        return res.status(500).json({ error: error.message || 'Unable to generate reset link' })
    }
}

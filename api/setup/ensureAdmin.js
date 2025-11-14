import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

// Unrestricted endpoint: create an admin user (for initial setup)
export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const auth = getAdminAuth()

        const { email: bodyEmail, password: bodyPassword, displayName: bodyDisplayName } = req.body || {}

        const adminEmail = (typeof bodyEmail === 'string' && bodyEmail.trim()) || process.env.SETUP_ADMIN_EMAIL || 'admin@email.dev'
        const adminPassword = (typeof bodyPassword === 'string' && bodyPassword) || '123456'
        const displayName = (typeof bodyDisplayName === 'string' && bodyDisplayName) || process.env.SETUP_ADMIN_DISPLAY_NAME || 'Administrator'

        let created
        try {
            created = await auth.createUser({
                email: adminEmail,
                password: adminPassword,
                displayName,
            })
        } catch (createErr) {
            console.error('Error creating admin user', createErr)
            // If email already exists, return existing user info and still ensure admin claim
            if (createErr?.code === 'auth/email-already-exists') {
                try {
                    const existing = await auth.getUserByEmail(adminEmail)
                    try {
                        await auth.setCustomUserClaims(existing.uid, { role: 'admin' })
                    } catch (claimErr) {
                        console.error('Failed to set admin claim on existing user', claimErr)
                    }
                    return res.status(200).json({ created: false, exists: true, uid: existing.uid, email: existing.email })
                } catch (getErr) {
                    console.error('Failed to fetch existing user after create collision', getErr)
                    return res.status(500).json({ error: 'Failed to create or find admin user' })
                }
            }
            return res.status(500).json({ error: 'Failed to create admin user' })
        }

        // Set admin role claim
        try {
            await auth.setCustomUserClaims(created.uid, { role: 'admin' })
        } catch (claimErr) {
            console.error('Failed to set admin custom claim', claimErr)
            // non-fatal
        }

        return res.status(201).json({ created: true, uid: created.uid, email: created.email })
    } catch (err) {
        console.error('Unhandled error in ensureAdmin', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

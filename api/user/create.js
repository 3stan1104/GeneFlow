import { handleCors } from '../_lib/cors.js'
import { getAdminAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        const { email, password, displayName, firstName, middleName, lastName, uid } = req.body || {}

        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'email, password and displayName are required' })
        }

        const auth = getAdminAuth()
        const createPayload = {
            email,
            password,
            displayName: displayName || null,
        }
        if (uid) createPayload.uid = uid

        const userRecord = await auth.createUser(createPayload)

        // Set custom claims for name parts (top-level keys)
        const customClaims = {
            firstName: firstName || null,
            middleName: middleName || null,
            lastName: lastName || null,
        }

        try {
            await auth.setCustomUserClaims(userRecord.uid, customClaims)
        } catch (claimErr) {
            // Log but don't fail the whole request; return user created but warn
            console.error('Failed to set custom claims for user', userRecord.uid, claimErr)
        }

        return res.status(201).json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            customClaims,
        })
    } catch (error) {
        console.error('Failed to create user', error)
        return res.status(500).json({ error: error.message || 'Unable to create user' })
    }
}

import { handleCors } from '../_lib/cors.js'
import { getAdminAuth, verifyAuth, getAdminFirestore } from '../_lib/auth.js'

async function authenticateRequest(req) {
    // Prefer Firebase ID token (Bearer). If not present, allow an API secret header as fallback.
    try {
        const decoded = await verifyAuth(req)
        return { type: 'token', decoded }
    } catch (err) {
        // try API secret fallback
        const headerSecret = req.headers['x-api-secret'] || req.headers['X-API-SECRET']
        const envSecret = process.env.ADMIN_API_SECRET || process.env.API_SECRET || process.env.VITE_API_SECRET
        if (envSecret && headerSecret && headerSecret === envSecret) {
            return { type: 'secret' }
        }
        return null
    }
}

export default async function handler(req, res) {
    if (handleCors(req, res)) return

    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        res.setHeader('Allow', 'PUT, PATCH')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // Authenticate request
    const authContext = await authenticateRequest(req)
    if (!authContext) {
        return res.status(401).json({ error: 'Unauthorized: Provide a valid Bearer token or X-API-Secret' })
    }

    try {
        const {
            uid,
            firstName,
            middleName,
            lastName,
            section,
            curriculum,
            role,
            password,
        } = req.body || {}

        if (!uid) {
            return res.status(400).json({ error: 'User UID is required' })
        }

        const auth = getAdminAuth()

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' })
            }
            try {
                await auth.updateUser(uid, { password })
            } catch (pwErr) {
                console.error('Failed to update password for user', uid, pwErr)
                return res.status(500).json({ error: 'Failed to update password' })
            }
        }

        // Verify user exists
        let existingUser
        try {
            existingUser = await auth.getUser(uid)
        } catch (e) {
            if (e?.code === 'auth/user-not-found') {
                return res.status(404).json({ error: 'User not found' })
            }
            console.error('Error fetching user', e)
            return res.status(500).json({ error: 'Unable to fetch user' })
        }

        // Build custom claims object, preserving existing claims
        const existingClaims = existingUser.customClaims || {}
        const customClaims = { ...existingClaims }

        if (firstName !== undefined) customClaims.firstName = firstName || null
        if (middleName !== undefined) customClaims.middleName = middleName || null
        if (lastName !== undefined) customClaims.lastName = lastName || null
        if (section !== undefined) customClaims.section = section || null
        if (curriculum !== undefined) customClaims.curriculum = curriculum || null
        if (role !== undefined) customClaims.role = role || null

        // Update custom claims
        try {
            await auth.setCustomUserClaims(uid, customClaims)
        } catch (claimErr) {
            console.error('Failed to update custom claims for user', uid, claimErr)
            return res.status(500).json({ error: 'Failed to update user claims' })
        }

        // Update Firestore student document if it exists
        try {
            const db = getAdminFirestore()
            const studentRef = db.doc(`students/${uid}`)
            const studentDoc = await studentRef.get()

            if (studentDoc.exists) {
                const updateData = {}
                if (firstName !== undefined || middleName !== undefined || lastName !== undefined) {
                    const currentName = studentDoc.data()?.name || {}
                    updateData.name = {
                        first: firstName !== undefined ? (firstName || '') : (currentName.first || ''),
                        middle: middleName !== undefined ? (middleName || '') : (currentName.middle || ''),
                        last: lastName !== undefined ? (lastName || '') : (currentName.last || ''),
                    }
                }
                if (section !== undefined) updateData.section = section || ''
                if (curriculum !== undefined) updateData.curriculum = curriculum || ''

                if (Object.keys(updateData).length > 0) {
                    await studentRef.update(updateData)
                }
            }
        } catch (fsErr) {
            console.error('Failed to update Firestore student document for user', uid, fsErr)
            // non-fatal; claims were updated
        }

        // Return updated user record
        try {
            const updatedUser = await auth.getUser(uid)
            return res.status(200).json({
                user: {
                    uid: updatedUser.uid,
                    email: updatedUser.email,
                    firstName: updatedUser.customClaims?.firstName || null,
                    middleName: updatedUser.customClaims?.middleName || null,
                    lastName: updatedUser.customClaims?.lastName || null,
                    section: updatedUser.customClaims?.section || null,
                    curriculum: updatedUser.customClaims?.curriculum || null,
                    role: updatedUser.customClaims?.role || null,
                },
            })
        } catch (fetchErr) {
            console.error('User updated but failed to fetch authoritative record', fetchErr)
            return res.status(200).json({ uid, message: 'User updated' })
        }
    } catch (error) {
        console.error('Unhandled error updating user', error)
        return res.status(500).json({ error: error?.message || 'Unable to update user' })
    }
}

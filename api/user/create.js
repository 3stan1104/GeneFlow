import { handleCors } from '../_lib/cors.js'
import { getAdminAuth, verifyAuth, getAdminFirestore } from '../_lib/auth.js'

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // Authenticate request
    const authContext = await authenticateRequest(req)
    if (!authContext) {
        return res.status(401).json({ error: 'Unauthorized: Provide a valid Bearer token or X-API-Secret' })
    }

    try {
        const {
            email: rawEmail,
            password: rawPassword,
            firstName,
            middleName,
            lastName,
            section,
            curriculum,
            uid: customUid,
            role,
        } = req.body || {}

        const email = typeof rawEmail === 'string' ? rawEmail.trim() : ''
        const password = typeof rawPassword === 'string' ? rawPassword : ''

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        if (!isValidEmail(email)) {
            console.error('Invalid email payload received during user creation', {
                receivedEmail: rawEmail,
                bodyKeys: typeof req.body === 'object' && req.body ? Object.keys(req.body) : [],
            })
            return res.status(400).json({ error: 'Email must be a valid email address' })
        }

        const auth = getAdminAuth()

        // Check if user already exists by email
        try {
            const existing = await auth.getUserByEmail(email)
            return res.status(200).json({ uid: existing.uid, message: 'User already exists' })
        } catch (e) {
            if (e?.code && e.code !== 'auth/user-not-found') {
                console.error('Error checking existing user by email', e)
                return res.status(500).json({ error: 'Unable to verify existing user' })
            }
            // else user not found -> continue
        }

        // If custom UID provided, ensure it's not already used
        if (customUid) {
            try {
                await auth.getUser(customUid)
                return res.status(409).json({ error: 'Custom UID already exists' })
            } catch (uidErr) {
                if (uidErr?.code && uidErr.code !== 'auth/user-not-found') {
                    console.error('Error checking custom UID', uidErr)
                    return res.status(500).json({ error: 'Unable to verify custom UID' })
                }
                // UID does not exist, OK to proceed
            }
        }

        const createPayload = {
            email,
            password,
        }
        if (customUid) createPayload.uid = customUid

        let userRecord
        try {
            userRecord = await auth.createUser(createPayload)
        } catch (createErr) {
            console.error('Failed to create user', createErr)
            const code = createErr?.code || ''
            if (code === 'auth/email-already-exists') {
                return res.status(409).json({ error: 'Email already exists' })
            }
            if (code === 'auth/invalid-uid') {
                return res.status(400).json({ error: 'Invalid UID format' })
            }
            if (code === 'auth/invalid-password' || code === 'auth/weak-password') {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' })
            }
            if (code === 'auth/missing-password') {
                return res.status(400).json({ error: 'Password is required' })
            }
            return res.status(500).json({ error: createErr?.message || 'Unable to create user' })
        }

        // Build custom claims object (include role if present)
        const customClaims = {}
        if (firstName) customClaims.firstName = firstName
        if (middleName) customClaims.middleName = middleName
        if (lastName) customClaims.lastName = lastName
        if (section) customClaims.section = section
        if (curriculum) customClaims.curriculum = curriculum
        if (role) customClaims.role = role

        if (Object.keys(customClaims).length > 0) {
            try {
                await auth.setCustomUserClaims(userRecord.uid, customClaims)
            } catch (claimErr) {
                console.error('Failed to set custom claims for user', userRecord.uid, claimErr)
                // don't fail the whole request for claim set errors
            }
        }

        // If the created user is a student, create a minimal Firestore student document
        if (role === 'student') {
            try {
                const db = getAdminFirestore()
                await db.doc(`students/${userRecord.uid}`).set({
                    id: userRecord.uid,
                    studentNumber: userRecord.uid,
                    progress: 0,
                    score: 0,
                    name: {
                        first: firstName || null,
                        middle: middleName || null,
                        last: lastName || null,
                    },
                    section: section || null,
                    curriculum: curriculum || null,
                })
            } catch (fsErr) {
                console.error('Failed to create Firestore student document for user', userRecord.uid, fsErr)
                // non-fatal; user was created in Auth, continue
            }
        }

        // Return authoritative user record (reflects custom claims)
        try {
            const authoritative = await auth.getUser(userRecord.uid)
            return res.status(201).json({ user: authoritative })
        } catch (fetchErr) {
            console.error('User created but failed to fetch authoritative record', fetchErr)
            return res.status(201).json({ uid: userRecord.uid })
        }
    } catch (error) {
        console.error('Unhandled error creating user', error)
        return res.status(500).json({ error: error?.message || 'Unable to create user' })
    }
}

import { handleCors } from '../_lib/cors.js'
import { getAdminAuth, getAdminFirestore } from '../_lib/auth.js'

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
        const db = getAdminFirestore()
        const users = await listAllUsers(auth)

        // Fetch lastPlayedAt for all students from Firestore
        // Map by both document ID and the 'id' field inside the document (some may use uid as doc id, others store it in 'id' field)
        const studentsSnapshot = await db.collection('students').get()
        const studentLastPlayedMap = {}
        studentsSnapshot.forEach((doc) => {
            const data = doc.data()
            if (data.lastPlayedAt) {
                // Convert Firestore Timestamp to ISO string
                const timestamp = data.lastPlayedAt.toDate ? data.lastPlayedAt.toDate() : new Date(data.lastPlayedAt)
                const isoDate = timestamp.toISOString()
                // Map by document ID
                studentLastPlayedMap[doc.id] = isoDate
                // Also map by the 'id' field if it exists and is different
                if (data.id && data.id !== doc.id) {
                    studentLastPlayedMap[data.id] = isoDate
                }
            }
        })

        const payload = users.map((userRecord) => {
            const role = userRecord.customClaims?.role || null
            const isStudent = role === 'student'

            // For students, use lastPlayedAt from Firestore; for admins, use Firebase Auth lastSignInTime
            let lastLogin = null
            if (isStudent) {
                lastLogin = studentLastPlayedMap[userRecord.uid] || null
            } else {
                lastLogin = userRecord.metadata?.lastSignInTime || null
            }

            return {
                uid: userRecord.uid,
                email: userRecord.email || 'No email',
                emailVerified: userRecord.emailVerified || false,
                disabled: userRecord.disabled || false,
                status: userRecord.disabled ? 'disabled' : 'active',
                lastLogin,
                createdAt: userRecord.metadata?.creationTime || null,
                // custom claims name parts as top-level keys
                firstName: userRecord.customClaims?.firstName || null,
                middleName: userRecord.customClaims?.middleName || null,
                lastName: userRecord.customClaims?.lastName || null,
                section: userRecord.customClaims?.section || null,
                curriculum: userRecord.customClaims?.curriculum || null,
                // role (e.g. 'student', 'admin') if present in custom claims
                role,
            }
        })
        return res.status(200).json({ users: payload })
    } catch (error) {
        console.error('Failed to fetch users from admin SDK', error)
        return res.status(500).json({ error: 'Unable to fetch users at this time.' })
    }
}

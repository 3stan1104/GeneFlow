import admin from 'firebase-admin'

/**
 * Initialize Firebase Admin SDK for serverless functions
 * Uses environment variables for credentials
 */
function initializeFirebaseAdmin() {
    if (admin.apps.length === 0) {
        const credentials = {
            type: process.env.VITE_FIREBASE_ADMIN_TYPE,
            project_id: process.env.VITE_FIREBASE_ADMIN_PROJECT_ID,
            private_key_id: process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY_ID,
            private_key: process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL,
            client_id: process.env.VITE_FIREBASE_ADMIN_CLIENT_ID,
            auth_uri: process.env.VITE_FIREBASE_ADMIN_AUTH_URI,
            token_uri: process.env.VITE_FIREBASE_ADMIN_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.VITE_FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.VITE_FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
            universe_domain: process.env.VITE_FIREBASE_ADMIN_UNIVERSE_DOMAIN,
        }

        admin.initializeApp({
            credential: admin.credential.cert(credentials),
            projectId: process.env.VITE_FIREBASE_ADMIN_PROJECT_ID,
        })
    }
    return admin
}

/**
 * Verify Firebase Auth ID token from request header
 */
export async function verifyAuth(req) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header')
    }

    const token = authHeader.split('Bearer ')[1]
    const adminInstance = initializeFirebaseAdmin()
    const decodedToken = await adminInstance.auth().verifyIdToken(token)
    return decodedToken
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
    const adminInstance = initializeFirebaseAdmin()
    return adminInstance.auth()
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore() {
    const adminInstance = initializeFirebaseAdmin()
    return adminInstance.firestore()
}

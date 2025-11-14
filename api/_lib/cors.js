/**
 * CORS helper for Vercel serverless functions
 * Adds necessary headers to support cross-origin requests
 */
export function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/**
 * Handle preflight OPTIONS request
 */
export function handleCors(req, res) {
    setCorsHeaders(res)
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return true
    }
    return false
}

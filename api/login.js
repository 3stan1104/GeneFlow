import { adminDb } from '../src/firebaseAdmin.js'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
    // Handle preflight
    if (req.method === 'OPTIONS') {
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(204).end()
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(405).send('Method Not Allowed')
    }

    const { email, password } = req.body || {}
    if (!email || !password) {
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(400).send('Missing credentials')
    }

    try {
        const usersRef = adminDb.collection('users')
        const q = usersRef.where('email', '==', email).where('password', '==', password)
        const querySnapshot = await q.get()

        if (querySnapshot.empty) {
            Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
            return res.status(401).send('Invalid credentials.')
        }

        const studentsRef = adminDb.collection('students')
        const snapshot = await studentsRef.get()
        let tableRows = ''
        let i = 1

        snapshot.forEach((doc) => {
            const data = doc.data()
            tableRows += `
        <tr>
          <td>${i++}</td>
          <td>${data.name}</td>
          <td>${data.studentNumber}</td>
          <td>${data.progress}%</td>
          <td>${data.score}</td>
        </tr>
      `
        })

        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(`
      <h2>Student Progress</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>#</th>
          <th>Student Name</th>
          <th>Student Number</th>
          <th>Progress (%)</th>
          <th>Score</th>
        </tr>
        ${tableRows}
      </table>
    `)
    } catch (error) {
        console.error('Error in /api/login', error)
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
        return res.status(500).send('Error logging in.')
    }
}

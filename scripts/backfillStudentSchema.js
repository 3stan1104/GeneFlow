import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json')
const defaultsPath = path.resolve(__dirname, '..', 'data', 'defaults.json')

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing serviceAccountKey.json. Place it in the project root before running this script.')
    process.exit(1)
}

if (!fs.existsSync(defaultsPath)) {
    console.error('Missing data/defaults.json. Please create it before running this script.')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
})

const db = admin.firestore()
const BATCH_SIZE = 400

/**
 * Ensures all student documents follow the field structure defined in data/defaults.json.
 * This script resets all fields to default values from defaults.json.
 */
async function backfillStudentSchema() {
    const snapshot = await db.collection('students').get()

    if (snapshot.empty) {
        console.log('No student documents found in the students collection.')
        return
    }

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0

    for (const doc of snapshot.docs) {
        const data = doc.data()

        // Use defaults from data/defaults.json
        const updates = {
            ...JSON.parse(JSON.stringify(defaults.student)),
            id: doc.id,
            studentNumber: doc.id,
            character: JSON.parse(JSON.stringify(defaults.character)),
        }

        batch.set(doc.ref, updates)
        writesInBatch += 1
        updatedDocuments += 1
        console.log(`Queued reset for student ${doc.id}`)

        if (writesInBatch >= BATCH_SIZE) {
            await batch.commit()
            console.log(`Committed a batch. ${updatedDocuments} student documents updated so far.`)
            batch = db.batch()
            writesInBatch = 0
        }
    }

    if (writesInBatch > 0) {
        await batch.commit()
    }

    console.log(`\nBackfill complete.`)
    console.log(`- Reset: ${updatedDocuments} student documents to default values`)
}

backfillStudentSchema()
    .then(() => {
        console.log('\nAll done.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Failed to backfill student schema.', error)
        process.exit(1)
    })

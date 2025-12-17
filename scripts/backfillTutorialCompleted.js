import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json')

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing serviceAccountKey.json. Place it in the project root before running this script.')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
})

const db = admin.firestore()
const BATCH_SIZE = 400

async function backfillTutorialFlag() {
    const snapshot = await db.collection('students').get()

    if (snapshot.empty) {
        console.log('No student documents found in the students collection.')
        return
    }

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0

    for (const doc of snapshot.docs) {
        batch.update(doc.ref, { tutorialCompleted: false })
        writesInBatch += 1
        updatedDocuments += 1

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

    console.log(`Backfill complete. Updated ${updatedDocuments} student documents with tutorialCompleted = false.`)
}

backfillTutorialFlag()
    .then(() => {
        console.log('All done.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Failed to backfill tutorialCompleted flag.', error)
        process.exit(1)
    })

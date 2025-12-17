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

// Get default character from defaults.json
const defaultCharacter = defaults.character

/**
 * Migrates character field from old nested structure to new flat structure.
 * 
 * Old structure:
 *   head: { type: "HE00", eyesMouth: "EM00", ears: "E00", hair?: "H00" }
 * 
 * New structure:
 *   head: "HE00"
 *   eyesMouth: "EM00"
 *   ears: "E00"
 *   hair: "H00"
 */
function migrateCharacter(oldCharacter) {
    if (!oldCharacter || typeof oldCharacter !== 'object') {
        return { ...defaultCharacter }
    }

    const newCharacter = {
        gender: oldCharacter.gender || '',
        mutations: Array.isArray(oldCharacter.mutations) ? oldCharacter.mutations : [],
        // Migrate head - check if it's the old nested structure or already flat
        head: '',
        eyesMouth: '',
        ears: '',
        hair: '',
        torso: oldCharacter.torso || '',
        arm: {
            left: oldCharacter.arm?.left || '',
            right: oldCharacter.arm?.right || '',
        },
        hand: {
            left: oldCharacter.hand?.left || '',
            right: oldCharacter.hand?.right || '',
        },
        leg: {
            left: oldCharacter.leg?.left || '',
            right: oldCharacter.leg?.right || '',
        },
        bank: Array.isArray(oldCharacter.bank) ? oldCharacter.bank : [],
    }

    // Check if head is an object (old nested structure) or string (already migrated/new)
    if (oldCharacter.head && typeof oldCharacter.head === 'object') {
        // Old nested structure - extract values
        newCharacter.head = oldCharacter.head.type || ''
        newCharacter.eyesMouth = oldCharacter.head.eyesMouth || ''
        newCharacter.ears = oldCharacter.head.ears || ''
        newCharacter.hair = oldCharacter.head.hair || ''
    } else {
        // Already flat or new structure
        newCharacter.head = oldCharacter.head || ''
        newCharacter.eyesMouth = oldCharacter.eyesMouth || ''
        newCharacter.ears = oldCharacter.ears || ''
        newCharacter.hair = oldCharacter.hair || ''
    }

    return newCharacter
}

/**
 * Updates all student documents to use the new flat character structure.
 * Preserves existing data where possible.
 */
async function migrateCharacterStructure() {
    const snapshot = await db.collection('students').get()

    if (snapshot.empty) {
        console.log('No student documents found in the students collection.')
        return
    }

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0
    let skippedDocuments = 0

    for (const doc of snapshot.docs) {
        const data = doc.data()
        const oldCharacter = data.character

        // Check if migration is needed
        const needsMigration = !oldCharacter ||
            typeof oldCharacter !== 'object' ||
            (oldCharacter.head && typeof oldCharacter.head === 'object') ||
            oldCharacter.eyesMouth === undefined ||
            oldCharacter.ears === undefined ||
            oldCharacter.hair === undefined ||
            oldCharacter.hand === undefined

        if (needsMigration) {
            const newCharacter = migrateCharacter(oldCharacter)
            batch.update(doc.ref, { character: newCharacter })
            writesInBatch += 1
            updatedDocuments += 1
            console.log(`Queued migration for student ${doc.id}`)
        } else {
            skippedDocuments += 1
            console.log(`Skipped student ${doc.id} (already migrated)`)
        }

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

    console.log(`\nCharacter structure migration complete.`)
    console.log(`- Migrated: ${updatedDocuments} student documents`)
    console.log(`- Skipped (already migrated): ${skippedDocuments} student documents`)
    console.log(`- Total processed: ${updatedDocuments + skippedDocuments} student documents`)
}

migrateCharacterStructure()
    .then(() => {
        console.log('\nAll done.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Failed to migrate character structure.', error)
        process.exit(1)
    })

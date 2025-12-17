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

/**
 * Generate random integer between min and max (inclusive)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random mutations data
 * @param {number} maxCured - Maximum cured count (default: 50)
 * @param {number} maxFailed - Maximum failed count (default: 20)
 * @returns {{ cured: number, failed: number }}
 */
function generateRandomMutations(maxCured = 10, maxFailed = 10) {
    return {
        cured: getRandomInt(0, maxCured),
        failed: getRandomInt(0, maxFailed),
    }
}

/**
 * Generate random mutations for all students in the database
 * @param {number} maxCured - Maximum cured count
 * @param {number} maxFailed - Maximum failed count
 */
async function generateRandomMutationsForAllStudents(maxCured = 10, maxFailed = 10) {
    const studentsSnapshot = await db.collection('students').get()

    if (studentsSnapshot.empty) {
        console.log('No students found in the database.')
        return
    }

    console.log(`Found ${studentsSnapshot.size} students. Generating random mutations...`)
    console.log(`Max cured: ${maxCured}, Max failed: ${maxFailed}`)

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0

    for (const doc of studentsSnapshot.docs) {
        const mutations = generateRandomMutations(maxCured, maxFailed)

        // Use dot notation to explicitly overwrite cured and failed values
        batch.update(doc.ref, {
            'mutations.cured': mutations.cured,
            'mutations.failed': mutations.failed,
        })
        writesInBatch += 1
        updatedDocuments += 1
        console.log(`Queued mutations for student ${doc.id}: cured=${mutations.cured}, failed=${mutations.failed}`)

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

    console.log(`\nDone! Updated ${updatedDocuments} student documents with random mutations.`)
}

/**
 * Generate a single random mutations object and print it (for testing)
 */
function testRandomMutations(maxCured = 10, maxFailed = 10) {
    console.log('\n--- Test Random Mutations ---')
    for (let i = 0; i < 5; i++) {
        const mutations = generateRandomMutations(maxCured, maxFailed)
        console.log(`Sample ${i + 1}: cured=${mutations.cured}, failed=${mutations.failed}`)
    }
}

// Parse command line arguments
const args = process.argv.slice(2)

// Parse max cured from --max-cured=50 format
let maxCured = 50
const maxCuredArg = args.find(arg => arg.startsWith('--max-cured='))
if (maxCuredArg) {
    maxCured = parseInt(maxCuredArg.split('=')[1], 10) || 10
}

// Parse max failed from --max-failed=20 format
let maxFailed = 20
const maxFailedArg = args.find(arg => arg.startsWith('--max-failed='))
if (maxFailedArg) {
    maxFailed = parseInt(maxFailedArg.split('=')[1], 10) || 10
}

if (args.includes('--test')) {
    testRandomMutations(maxCured, maxFailed)
} else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/generateRandomMutations.js [options]

Options:
  --max-cured=<number>   Maximum cured count (default: 50)
  --max-failed=<number>  Maximum failed count (default: 20)
  --test                 Run a test to see sample mutations without updating the database
  --help, -h             Show this help message

Examples:
  node scripts/generateRandomMutations.js
  node scripts/generateRandomMutations.js --max-cured=100 --max-failed=30
  node scripts/generateRandomMutations.js --test
`)
} else {
    generateRandomMutationsForAllStudents(maxCured, maxFailed)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Error generating random mutations:', err)
            process.exit(1)
        })
}

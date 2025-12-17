import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'
import { fileURLToPath } from 'url'
import readline from 'readline'

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer)
        })
    })
}

function parseDateTime(day, month, year, time) {
    const [hours, minutes] = time.split(':').map(Number)
    // Month is 0-indexed in JavaScript Date
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function getRandomDateInRange(startDate, endDate) {
    const startTime = startDate.getTime()
    const endTime = endDate.getTime()
    const randomTime = startTime + Math.random() * (endTime - startTime)
    return new Date(randomTime)
}

function formatDate(date) {
    return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

async function adjustLastPlayedAt() {
    console.log('\n=== Adjust Student lastPlayedAt Timestamps ===\n')
    console.log('This script will update the lastPlayedAt field for all students')
    console.log('with a random timestamp within the specified date range.\n')

    // Get START date/time
    console.log('--- START Date/Time ---')
    const startDay = parseInt(await question('Enter START day (1-31): '))
    const startMonth = parseInt(await question('Enter START month (1-12): '))
    const startYear = parseInt(await question('Enter START year (e.g., 2025): '))
    const startTime = await question('Enter START time (HH:MM, 24-hour format, e.g., 08:00): ')

    // Get END date/time
    console.log('\n--- END Date/Time ---')
    const endDay = parseInt(await question('Enter END day (1-31): '))
    const endMonth = parseInt(await question('Enter END month (1-12): '))
    const endYear = parseInt(await question('Enter END year (e.g., 2025): '))
    const endTime = await question('Enter END time (HH:MM, 24-hour format, e.g., 17:00): ')

    // Parse dates
    const startDate = parseDateTime(startDay, startMonth, startYear, startTime)
    const endDate = parseDateTime(endDay, endMonth, endYear, endTime)

    // Validate dates
    if (isNaN(startDate.getTime())) {
        console.error('\nError: Invalid START date/time provided.')
        rl.close()
        process.exit(1)
    }

    if (isNaN(endDate.getTime())) {
        console.error('\nError: Invalid END date/time provided.')
        rl.close()
        process.exit(1)
    }

    if (startDate >= endDate) {
        console.error('\nError: START date/time must be before END date/time.')
        rl.close()
        process.exit(1)
    }

    console.log('\n--- Summary ---')
    console.log(`Start: ${formatDate(startDate)}`)
    console.log(`End:   ${formatDate(endDate)}`)

    const confirm = await question('\nProceed with updating all student documents? (yes/no): ')

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('Operation cancelled.')
        rl.close()
        process.exit(0)
    }

    // Fetch all students
    const snapshot = await db.collection('students').get()

    if (snapshot.empty) {
        console.log('\nNo student documents found in the students collection.')
        rl.close()
        return
    }

    console.log(`\nFound ${snapshot.size} student documents. Updating...\n`)

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0

    for (const doc of snapshot.docs) {
        const randomDate = getRandomDateInRange(startDate, endDate)
        const timestamp = admin.firestore.Timestamp.fromDate(randomDate)

        batch.update(doc.ref, {
            lastPlayedAt: timestamp
        })

        writesInBatch += 1
        updatedDocuments += 1
        console.log(`Queued update for student ${doc.id} -> ${formatDate(randomDate)}`)

        if (writesInBatch >= BATCH_SIZE) {
            await batch.commit()
            console.log(`\nCommitted a batch. ${updatedDocuments} student documents updated so far.\n`)
            batch = db.batch()
            writesInBatch = 0
        }
    }

    if (writesInBatch > 0) {
        await batch.commit()
    }

    console.log(`\n=== Update Complete ===`)
    console.log(`Updated ${updatedDocuments} student documents with random lastPlayedAt timestamps.`)
    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`)

    rl.close()
}

adjustLastPlayedAt().catch((error) => {
    console.error('Error:', error)
    rl.close()
    process.exit(1)
})

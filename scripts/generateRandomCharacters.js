import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json')
const characterPartsPath = path.resolve(__dirname, '..', 'data', 'characterParts.json')

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing serviceAccountKey.json. Place it in the project root before running this script.')
    process.exit(1)
}

if (!fs.existsSync(characterPartsPath)) {
    console.error('Missing data/characterParts.json. Please create it before running this script.')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
const characterParts = JSON.parse(fs.readFileSync(characterPartsPath, 'utf8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
})

const db = admin.firestore()
const BATCH_SIZE = 400

/**
 * Get a random element from an array
 */
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get a random part based on gender sensitivity
 */
function getRandomPart(partConfig, gender) {
    if (partConfig.genderSensitive) {
        const genderKey = gender.toLowerCase()
        return getRandomElement(partConfig[genderKey])
    }
    return getRandomElement(partConfig.options)
}

/**
 * Get a random mutation for a part
 */
function getRandomMutation(partConfig) {
    if (partConfig.mutations && partConfig.mutations.length > 0) {
        return getRandomElement(partConfig.mutations)
    }
    return null
}

/**
 * Generate a random character based on gender, optionally with mutations
 * @param {string} gender - 'Male' or 'Female'
 * @param {number} mutationChance - Chance (0-1) for each mutatable part to be mutated (default: 0)
 * @param {number} maxMutations - Maximum number of mutations allowed (default: 3)
 */
function generateRandomCharacter(gender, mutationChance = 0, maxMutations = 3) {
    const genderLower = gender.toLowerCase()

    const character = {
        gender: gender,
        head: getRandomPart(characterParts.head, gender),
        eyesMouth: getRandomPart(characterParts.eyesMouth, gender),
        ears: getRandomPart(characterParts.ears, gender),
        hair: genderLower === 'female' ? getRandomPart(characterParts.hair, gender) : '',
        torso: getRandomPart(characterParts.torso, gender),
        arm: {
            left: getRandomPart(characterParts.armLeft, gender),
            right: getRandomPart(characterParts.armRight, gender),
        },
        hand: {
            left: getRandomPart(characterParts.handLeft, gender),
            right: getRandomPart(characterParts.handRight, gender),
        },
        leg: {
            left: getRandomPart(characterParts.legLeft, gender),
            right: getRandomPart(characterParts.legRight, gender),
        },
        bank: [],
    }

    // Apply random mutations if mutationChance > 0
    if (mutationChance > 0 && characterParts.mutatableParts) {
        let mutationCount = 0

        for (const partName of characterParts.mutatableParts) {
            if (mutationCount >= maxMutations) break
            if (Math.random() < mutationChance) {
                const partConfig = characterParts[partName]
                const mutation = getRandomMutation(partConfig)

                if (mutation) {
                    // Map part names to character field names
                    const fieldMap = {
                        head: 'head',
                        ears: 'ears',
                        torso: 'torso',
                        armLeft: { parent: 'arm', child: 'left' },
                        armRight: { parent: 'arm', child: 'right' },
                        handLeft: { parent: 'hand', child: 'left' },
                        handRight: { parent: 'hand', child: 'right' },
                        legLeft: { parent: 'leg', child: 'left' },
                        legRight: { parent: 'leg', child: 'right' },
                    }

                    const mapping = fieldMap[partName]

                    if (typeof mapping === 'string') {
                        // Simple field
                        character[mapping] = mutation
                    } else if (mapping && mapping.parent) {
                        // Nested field (arm/leg)
                        character[mapping.parent][mapping.child] = mutation
                    }

                    mutationCount++
                }
            }
        }
    }

    return character
}

/**
 * Generate random characters for all students in the database
 * @param {number} mutationChance - Chance (0-1) for each mutatable part to be mutated
 * @param {number} maxMutations - Maximum number of mutations allowed per character
 */
async function generateRandomCharactersForAllStudents(mutationChance = 0, maxMutations = 3) {
    const snapshot = await db.collection('students').get()

    if (snapshot.empty) {
        console.log('No student documents found in the students collection.')
        return
    }

    let batch = db.batch()
    let writesInBatch = 0
    let updatedDocuments = 0

    for (const doc of snapshot.docs) {
        // Randomly select a gender
        const gender = getRandomElement(characterParts.genders)
        const character = generateRandomCharacter(gender, mutationChance, maxMutations)

        batch.update(doc.ref, { character })
        writesInBatch += 1
        updatedDocuments += 1
        console.log(`Queued random character for student ${doc.id} (${gender})`)

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

    console.log(`\nRandom character generation complete.`)
    console.log(`- Updated: ${updatedDocuments} student documents with random characters`)
}

/**
 * Generate a single random character and print it (for testing)
 */
function testRandomCharacter(withMutations = false) {
    const mutationChance = withMutations ? 0.5 : 0
    const maxMutations = 3

    console.log('\n--- Test Random Character (Male, no mutations) ---')
    console.log(JSON.stringify(generateRandomCharacter('Male', 0, 0), null, 2))

    console.log('\n--- Test Random Character (Female, no mutations) ---')
    console.log(JSON.stringify(generateRandomCharacter('Female', 0, 0), null, 2))

    if (withMutations) {
        console.log('\n--- Test Random Character (Male, with mutations) ---')
        console.log(JSON.stringify(generateRandomCharacter('Male', mutationChance, maxMutations), null, 2))

        console.log('\n--- Test Random Character (Female, with mutations) ---')
        console.log(JSON.stringify(generateRandomCharacter('Female', mutationChance, maxMutations), null, 2))
    }
}

// Parse command line arguments
const args = process.argv.slice(2)

// Parse mutation chance from --mutations=0.3 format
let mutationChance = 0
let maxMutations = 3
const mutationArg = args.find(arg => arg.startsWith('--mutations='))
if (mutationArg) {
    mutationChance = parseFloat(mutationArg.split('=')[1]) || 0
}
const maxMutArg = args.find(arg => arg.startsWith('--max-mutations='))
if (maxMutArg) {
    maxMutations = parseInt(maxMutArg.split('=')[1], 10) || 3
}

if (args.includes('--test')) {
    testRandomCharacter(args.includes('--with-mutations'))
    process.exit(0)
} else if (args.includes('--help')) {
    console.log(`
Usage: node generateRandomCharacters.js [options]

Options:
  --test                    Test mode - print sample characters without updating database
  --with-mutations          (with --test) Include mutation examples in test output
  --mutations=<0-1>         Chance for each mutatable part to have a mutation (default: 0)
  --max-mutations=<n>       Maximum mutations per character (default: 3)
  --help                    Show this help message

Examples:
  node generateRandomCharacters.js                      # Generate random characters (no mutations)
  node generateRandomCharacters.js --mutations=0.3      # 30% chance per part to mutate
  node generateRandomCharacters.js --test               # Test without database update
  node generateRandomCharacters.js --test --with-mutations  # Test with mutation examples
`)
    process.exit(0)
} else {
    if (mutationChance > 0) {
        console.log(`Generating characters with ${mutationChance * 100}% mutation chance (max ${maxMutations} per character)`)
    }
    generateRandomCharactersForAllStudents(mutationChance, maxMutations)
        .then(() => {
            console.log('\nAll done.')
            process.exit(0)
        })
        .catch((error) => {
            console.error('Failed to generate random characters.', error)
            process.exit(1)
        })
}

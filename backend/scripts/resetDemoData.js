import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/user.js'
import Request from '../models/request.js'

// --- Connect DB Function ---
async function connectDb() {
    const uri = process.env.MONGO_URI
    if (!uri) throw new Error('MONGO_URI missing in .env')
    await mongoose.connect(uri)
}

const CENTER_COORDS = [-83.00, 40.00] // [lng, lat] for geospatial

// Helper function to create a coordinate slightly offset from the center
const getOffsetCoords = (index) => {
    // Slight offset for map placement
    const offsetLng = (Math.random() - 0.5) * 0.01 + (index * 0.001)
    const offsetLat = (Math.random() - 0.5) * 0.01 + (index * 0.001)
    return [CENTER_COORDS[0] + offsetLng, CENTER_COORDS[1] + offsetLat]
}


const DEMO_USERS = [
    // Originally provided users, updated with displayName and address
    { email: 'user@example.com', password: 'password123', displayName: 'Chris Johnson', role: 'user', address: '901 Elm St, Anytown' },
    { email: 'emily.bowers@gmail.com', password: 'toyota123', displayName: 'Emily Bowers', role: 'user', address: '302 River Rd, Anytown' },
    { email: 'nealvon.elwell@gmail.com', password: 'pomeranians4Lif3', displayName: 'Nealvon Elwell', role: 'user', address: '710 Pine Ln, Anytown' },
    { email: 'rebecca.jones@aol.com', password: 'beautyqueen1984', displayName: 'Rebecca Jones', role: 'user', address: '456 Oak Ave, Anytown' },
    { email: 'admin@example.com', password: 'adminpass', displayName: 'Admin Jane Doe', role: 'admin', address: '123 Main St, Anytown' },
]


/**
 * Main function to wipe and reseed the database
 */
async function resetDemoData() {
    try {
        await connectDb()
        console.log('Connected to MongoDB for seeding')

        // 1. Clear Existing Data (Idempotency)
        await Promise.all([
            User.deleteMany({}),
            Request.deleteMany({}),
        ])
        console.log('✅ Old data cleared.')


        // 2. Insert Demo Users
        const createdUsers = await User.insertMany(DEMO_USERS)
        console.log(`✅ ${createdUsers.length} demo users inserted.`)

        // 3. Map Users for Request linking
        const userMap = createdUsers.reduce((map, user) => {
            map[user.email] = user
            return map
        }, {})

        // --- Demo Request Data (Updated with full model fields) ---
        const DEMO_REQUESTS = [
            {
                title: 'Need groceries picked up',
                description: 'Looking for someone to grab groceries from the store on my list.',
                category: 'Errand',
                urgency: 'medium',
                location: { address: '901 Elm St, Anytown', coordinates: getOffsetCoords(1) },
                status: 'open',
                createdBy: userMap['user@example.com']._id,
            },
            {
                title: 'Dog walking help (30 mins)',
                description: 'Need a dog walker for my poodle this evening around 6 PM.',
                category: 'Pet Care',
                urgency: 'low',
                location: { address: '123 Main St, Anytown', coordinates: getOffsetCoords(2) },
                status: 'open',
                createdBy: userMap['admin@example.com']._id,
            },
            {
                title: 'Ride to airport tomorrow',
                description: 'Need a ride to the airport tomorrow. I have to be there by 3pm. Will pay for gas!',
                category: 'Other',
                urgency: 'high',
                location: { address: '456 Oak Ave, Anytown', coordinates: getOffsetCoords(3) },
                status: 'open',
                createdBy: userMap['rebecca.jones@aol.com']._id,
            },
            {
                title: 'Need a ride to hospital ASAP!',
                description: 'Need a ride to the hospital asap, I am having terrible back pain! Urgent!',
                category: 'Other',
                urgency: 'high',
                location: { address: '710 Pine Ln, Anytown', coordinates: getOffsetCoords(4) },
                status: 'open',
                createdBy: userMap['nealvon.elwell@gmail.com']._id,
            },
            {
                title: 'Help with leaky pipe under sink',
                description: 'The pipe under my kitchen sink burst. Need a handy person to cap it for now.',
                category: 'Household',
                urgency: 'high',
                location: { address: '302 River Rd, Anytown', coordinates: getOffsetCoords(5) },
                status: 'in_progress',
                createdBy: userMap['emily.bowers@gmail.com']._id,
                acceptedBy: userMap['admin@example.com']._id,
            },
            {
                title: 'Need babysitter this Saturday',
                description: 'Need a babysitter this Saturday (10am-2pm) so that I can get some errands done.',
                category: 'Other',
                urgency: 'medium',
                location: { address: '456 Oak Ave, Anytown', coordinates: getOffsetCoords(6) },
                status: 'open',
                createdBy: userMap['rebecca.jones@aol.com']._id,
            },
            {
                title: 'Need help painting bedroom',
                description: 'Need help painting my house before it rains this weekend. Just one wall.',
                category: 'Household',
                urgency: 'low',
                location: { address: '901 Elm St, Anytown', coordinates: getOffsetCoords(7) },
                status: 'closed',
                createdBy: userMap['user@example.com']._id,
                acceptedBy: userMap['emily.bowers@gmail.com']._id,
                completedBy: userMap['emily.bowers@gmail.com']._id,
                completedAt: new Date(),
            },
            {
                title: 'Tailoring work pants',
                description: 'Need someone to tailor some work pants that I bought (hem/waist).',
                category: 'Other',
                urgency: 'low',
                location: { address: '710 Pine Ln, Anytown', coordinates: getOffsetCoords(8) },
                status: 'open',
                createdBy: userMap['nealvon.elwell@gmail.com']._id,
            },
            {
                title: 'School supply donation request',
                description: 'Looking for donations of school supplies for my third-grade classroom (pencils, paper).',
                category: 'Other',
                urgency: 'medium',
                location: { address: '456 Oak Ave, Anytown', coordinates: getOffsetCoords(9) },
                status: 'open',
                createdBy: userMap['rebecca.jones@aol.com']._id,
            },
            {
                title: 'Yard cleanup this weekend',
                description: 'I need leaves raked and some light weeding done in the front yard.',
                category: 'Yardwork',
                urgency: 'medium',
                location: { address: '123 Main St, Anytown', coordinates: getOffsetCoords(10) },
                status: 'open',
                createdBy: userMap['admin@example.com']._id,
            },
        ]


        // 4. Insert Demo Requests
        const createdRequests = await Request.insertMany(DEMO_REQUESTS)
        console.log(`✅ ${createdRequests.length} demo requests inserted.`)


        const [userCount, reqCount] = await Promise.all([User.countDocuments(), Request.countDocuments()])
        console.log(`\n🌟 Demo data loaded successfully 🌟`)
        console.log(`Users: ${userCount} | Requests: ${reqCount}`)

    } catch (error) {
        console.error('❌ Failed to load demo data:', error)
        process.exit(1)
    } finally {
        // Ensure the connection is closed after the script runs
        await mongoose.disconnect()
        process.exit(0)
    }
}

resetDemoData()
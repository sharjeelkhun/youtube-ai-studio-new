
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper to get random date within last 30 days
function getRandomDate(daysBack = 30) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
    return date.toISOString()
}

async function seedData() {
    console.log('Seeding Analytics Data...')

    // Get a real user ID to attach data to (or just pick the first one)
    const { data: users } = await supabase.from('profiles').select('id').limit(1)
    const userId = users && users[0] ? users[0].id : uuidv4() // Fallback to random ID if no users

    console.log('Using User ID:', userId)

    // 1. Seed Payments (20 items)
    const payments = Array.from({ length: 20 }).map(() => ({
        user_id: userId,
        amount: Math.floor(Math.random() * 5000) + 1000, // 10.00 - 60.00
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'credit_card',
        created_at: getRandomDate(30),
        description: 'Pro Plan Subscription'
    }))

    const { error: payError } = await supabase.from('payments').insert(payments)
    if (payError) console.error('Error seeding payments:', payError)
    else console.log('Seeded 20 payments')

    // 2. Seed AI Content (50 items)
    const contentTypes = ['video_idea', 'video_idea', 'video_idea', 'script_outline', 'script_outline', 'tutorial_idea']

    const content = Array.from({ length: 50 }).map(() => ({
        user_id: userId,
        title: 'AI Generated Title ' + Math.random().toString(36).substring(7),
        description: 'Mock data description',
        type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
        source: 'ai_generated', // CRITICAL for analytics
        status: 'saved',
        created_at: getRandomDate(30),
        metrics: {}, // Add empty json for metrics
        metadata: {}
    }))

    const { error: aiError } = await supabase.from('content_ideas').insert(content)
    if (aiError) console.error('Error seeding AI content:', aiError)
    else console.log('Seeded 50 AI content items')

    console.log('Done!')
}

seedData()

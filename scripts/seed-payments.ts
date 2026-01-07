
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

function getRandomDate(daysBack = 30) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
    return date.toISOString()
}

async function seedPayments() {
    console.log('Seeding Payments ONLY...')

    // Get a real user ID
    const { data: users, error: uError } = await supabase.from('profiles').select('id').limit(1)
    if (uError) console.error("Profile Error", uError)

    const userId = users && users[0] ? users[0].id : null

    if (!userId) {
        console.error("No users found to attach payments to!")
        return
    }

    console.log('Using User ID:', userId)

    const payments = Array.from({ length: 20 }).map(() => ({
        user_id: userId,
        amount: Math.floor(Math.random() * 5000) + 1000,
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'credit_card',
        created_at: getRandomDate(30),
    }))

    const { data, error } = await supabase.from('payments').insert(payments).select()

    if (error) {
        console.error('Error seeding payments:', error)
        console.error('Error Details:', JSON.stringify(error, null, 2))
    } else {
        console.log(`Successfully seeded ${data.length} payments`)
    }
}

seedPayments()

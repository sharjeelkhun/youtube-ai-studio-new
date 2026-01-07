
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('--- DEBUG START ---')
    const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true })
    console.log('Current Payments Count:', count)

    const { data: users, error: uErr } = await supabase.from('profiles').select('id').limit(1)

    if (!users || users.length === 0) {
        console.log('No users found.')
        return
    }

    const userId = users[0].id
    console.log('Using User ID:', userId)

    const payments = Array.from({ length: 20 }).map(() => ({
        user_id: userId,
        amount: Math.floor(Math.random() * 5000) + 1000,
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'credit_card',
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
    }))

    console.log('Seeding 20 payments...')
    const { data, error } = await supabase.from('payments').insert(payments).select()

    if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error, null, 2))
    } else {
        console.log(`INSERT SUCCESS: Seeded ${data.length} payments`)
    }
    console.log('--- DEBUG END ---')
}

main()


import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkData() {
    console.log('Checking Analytics Data...')

    // 1. Payments
    const { count: paymentCount, error: paymentError } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })

    if (paymentError) console.error('Payment Error:', paymentError)
    console.log('Total Payments:', paymentCount || 0)

    // Check recent payments
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentPayments } = await supabase
        .from('payments')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(5)

    console.log('Recent Payments (last 30d):', recentPayments?.length || 0)

    // 2. Subscriptions
    const { count: subCount, error: subError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })

    if (subError) console.error('Subscription Error:', subError)
    console.log('Total Subscriptions:', subCount || 0)

    // 3. AI Content
    const { count: aiCount, error: aiError } = await supabase
        .from('content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'ai_generated')

    if (aiError) console.error('AI Content Error:', aiError)
    console.log('Total AI Content (ai_generated):', aiCount || 0)

    // Check recent AI content
    const { data: recentAI } = await supabase
        .from('content_ideas')
        .select('created_at')
        .eq('source', 'ai_generated')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(5)

    console.log('Recent AI Content (last 30d):', recentAI?.length || 0)

}

checkData()

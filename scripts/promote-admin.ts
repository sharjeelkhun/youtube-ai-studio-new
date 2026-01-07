
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
// Fallback to .env if .env.local doesn't work or for general setup
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function promoteUser(email: string) {
    console.log(`Looking for user with email: ${email}`)

    // 1. Find user in auth (we need their ID)
    // listUsers might be paginated, but hopefully this user is recent or we find them.
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('Error listing users:', authError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error('User not found!')
        return
    }

    console.log(`Found user: ${user.id}`)

    // 2. Update profiles table
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

    if (updateError) {
        console.error('Error updating profile:', updateError)
    } else {
        console.log(`Successfully promoted ${email} to admin!`)
    }
}

const targetEmail = process.argv[2] || 'sharjeelaslam96@gmail.com'
promoteUser(targetEmail)

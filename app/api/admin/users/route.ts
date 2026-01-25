import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    try {
        // 1. Fetch profiles (which contains user metadata we care about)
        // We use supabaseAdmin to bypass RLS policies
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError)
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
        }

        // 2. Fetch subscriptions to attach plan info
        const { data: subscriptions, error: subsError } = await supabaseAdmin
            .from('subscriptions')
            .select('*')

        if (subsError) {
            console.error('Error fetching subscriptions:', subsError)
            // We continue even if subscriptions fail, just treating them as no plan
        }

        // 3. (Optional) Fetch auth users if we need email
        // note: auth.users is not directly accessible via postgrest easily without specific setup
        // For now we rely on the Profile table assuming it has what we need or we accept what we have.
        // If profiles table doesn't have email, we might strictly need access to auth.users list
        // using the admin auth client.

        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

        if (authError) {
            console.error('Error fetching auth users:', authError)
        }

        // Merge data
        const combinedUsers = (profiles as any[]).map(profile => {
            const sub = (subscriptions as any[])?.find(s => s.user_id === profile.id)
            const authUser = (users as any[])?.find(u => u.id === profile.id)

            return {
                id: profile.id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                email: authUser?.email || 'N/A', // Email comes from auth.users
                created_at: profile.created_at,
                plan: sub?.plan_id || 'Free', // Naive plan check
                status: sub?.status || 'inactive',
                last_sign_in: authUser?.last_sign_in_at,
                role: profile.role || 'user'
            }
        })

        return NextResponse.json({ users: combinedUsers })

    } catch (error) {
        console.error('Admin users API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

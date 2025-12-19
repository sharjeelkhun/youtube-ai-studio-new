import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { cancelAtPeriodEnd } = body

        if (typeof cancelAtPeriodEnd !== 'boolean') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Update subscription
        const { data, error } = await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: cancelAtPeriodEnd })
            .eq('user_id', user.id)
            .select()
            .maybeSingle()

        if (error) {
            console.error('Error updating auto-renew:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, subscription: data })
    } catch (error: any) {
        console.error('Error handling request:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

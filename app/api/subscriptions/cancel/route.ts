import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { cancelPayPalSubscription } from '@/lib/paypal'

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get the latest active subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('paypal_subscription_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (subError) {
            console.error('DB Fetch Error:', subError)
            return NextResponse.json({ error: 'Database error fetching subscription' }, { status: 500 })
        }

        if (!subscription?.paypal_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        // 2. Cancel Subscription on PayPal
        try {
            await cancelPayPalSubscription(subscription.paypal_subscription_id, 'User requested cancellation from dashboard');
        } catch (e) {
            console.error('PayPal Cancel Error:', e)
            return NextResponse.json({ error: 'Failed to cancel subscription with PayPal' }, { status: 500 })
        }

        // 3. Update Database
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancel_at_period_end: false // Reset this since it's fully cancelled now
            })
            .eq('user_id', user.id)

        if (updateError) {
            console.error('DB Update Error:', updateError)
            return NextResponse.json({ error: 'Subscription cancelled at PayPal but failed to update local DB' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Subscription cancelled successfully' })

    } catch (error: any) {
        console.error('Error handling request:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

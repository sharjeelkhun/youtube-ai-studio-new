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
        const { subscriptionId, planId, planName } = body

        if (!subscriptionId || !planId || !planName) {
            return NextResponse.json(
                { error: 'Missing required fields: subscriptionId, planId, planName' },
                { status: 400 }
            )
        }

        // Insert or update subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: planName.toLowerCase(), // Use lowercase for consistency
                plan_name: planName,
                status: 'active',
                paypal_subscription_id: subscriptionId,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single()

        if (subError) {
            console.error('Subscription error:', subError)
            return NextResponse.json({ error: subError.message, details: subError }, { status: 500 })
        }

        // Record payment
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                subscription_id: subscription.id,
                amount: planName === 'Starter' ? 0 : planName === 'Professional' ? 49 : 99,
                currency: 'USD',
                status: 'succeeded',
                paypal_transaction_id: subscriptionId,
            })

        if (paymentError) {
            console.error('Payment error:', paymentError)
            // Don't fail the request if payment record fails
        }

        return NextResponse.json({ success: true, subscription })
    } catch (error: any) {
        console.error('Error saving subscription:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

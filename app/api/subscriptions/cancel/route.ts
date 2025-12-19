import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PAYPAL_API = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

async function getPayPalAccessToken() {
    // Debug logging
    console.log('Attempting PayPal Auth...')
    console.log('Client ID exists:', !!CLIENT_ID)
    console.log('Client Secret exists:', !!CLIENT_SECRET)

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Missing PayPal Credentials in environment variables')
        throw new Error('Missing PayPal credentials')
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

    try {
        const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('PayPal Token Error Response:', errorText)
            throw new Error(`PayPal API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.access_token
    } catch (error) {
        console.error('PayPal Fetch Error:', error)
        throw error
    }
}

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

        // 2. Get Access Token
        let accessToken
        try {
            accessToken = await getPayPalAccessToken()
        } catch (e) {
            console.error('PayPal Auth Error:', e)
            return NextResponse.json({ error: 'Failed to authenticate with PayPal. Check server configuration.' }, { status: 500 })
        }

        // 3. Cancel Subscription on PayPal
        const cancelResponse = await fetch(
            `${PAYPAL_API}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'User requested cancellation from dashboard' })
            }
        )

        if (!cancelResponse.ok && cancelResponse.status !== 204) {
            const errorText = await cancelResponse.text()
            console.error('PayPal Cancel Error:', errorText)
            return NextResponse.json({ error: 'Failed to cancel subscription with PayPal' }, { status: 500 })
        }

        // 4. Update Database
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


const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYPAL_API = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getPayPalAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function runSyncManual(userId) {
    console.log(`Running manual sync for user: ${userId}`);

    // 1. Get subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (!subscription || !subscription.paypal_subscription_id) {
        console.log("No subscription found.");
        return;
    }

    // 2. Fetch from PayPal
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscription.paypal_subscription_id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const paypalSub = await response.json();

    // 3. Record last payment
    const lastPayment = paypalSub.billing_info?.last_payment;
    if (lastPayment && lastPayment.amount) {
        const paymentTimeId = lastPayment.time ? new Date(lastPayment.time).getTime() : 'latest';
        const paypalTxId = lastPayment.transaction_id || `SUB-${subscription.paypal_subscription_id}-${paymentTimeId}`;

        console.log(`Target TxId: ${paypalTxId}`);

        const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('paypal_transaction_id', paypalTxId)
            .maybeSingle();

        if (existing) {
            console.log(`Payment already exists: ${existing.id}`);
        } else {
            console.log(`Inserting new payment...`);
            const { error: insError } = await supabase.from('payments').insert({
                user_id: userId,
                subscription_id: subscription.id,
                amount: parseFloat(lastPayment.amount.value),
                currency: lastPayment.amount.currency_code || 'USD',
                status: 'succeeded',
                paypal_transaction_id: paypalTxId,
                plan_name: subscription.plan_name + ' Plan',
                period_start: lastPayment.time,
                period_end: paypalSub.billing_info.next_billing_time
            });

            if (insError) console.error("Insert Error:", insError);
            else console.log("Successfuly inserted!");
        }
    } else {
        console.log("No last payment found in PayPal info.");
    }
}

const userId = 'b5f958b9-36c3-48f0-820c-d77b908ab98f';
runSyncManual(userId);

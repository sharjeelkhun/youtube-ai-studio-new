
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getPayPalSubscription } from '@/lib/paypal';

// Use Service Role Key for administrative tasks
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`[PAYPAL-WEBHOOK] Received event: ${eventType}`);

    try {
        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.UPDATED':
            case 'BILLING.SUBSCRIPTION.RENEWED':
                const subscriptionId = resource.id;
                console.log(`[PAYPAL-WEBHOOK] Updating subscription: ${subscriptionId}`);

                // Fetch latest from PayPal to be sure
                const paypalSub = await getPayPalSubscription(subscriptionId);
                if (paypalSub) {
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: paypalSub.status.toLowerCase() === 'active' ? 'active' : (paypalSub.status.toLowerCase() === 'suspended' ? 'past_due' : 'cancelled'),
                            current_period_start: paypalSub.start_time,
                            current_period_end: paypalSub.billing_info?.next_billing_time,
                            updated_at: new Date().toISOString()
                        })
                        .eq('paypal_subscription_id', subscriptionId);
                }
                break;

            case 'PAYMENT.SALE.COMPLETED':
                const saleSubId = resource.billing_agreement_id;
                if (saleSubId) {
                    console.log(`[PAYPAL-WEBHOOK] Payment completed for: ${saleSubId}`);
                    // Trigger a sync for this subscription
                    const { data: sub } = await supabaseAdmin
                        .from('subscriptions')
                        .select('user_id, id, plan_name')
                        .eq('paypal_subscription_id', saleSubId)
                        .single();

                    if (sub) {
                        const paypalSubForPayment = await getPayPalSubscription(saleSubId);
                        if (paypalSubForPayment) {
                            // Update subscription end date
                            await supabaseAdmin
                                .from('subscriptions')
                                .update({
                                    current_period_end: paypalSubForPayment.billing_info?.next_billing_time,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', sub.id);

                            // Record payment
                            await supabaseAdmin.from('payments').insert({
                                user_id: sub.user_id,
                                subscription_id: sub.id,
                                amount: parseFloat(resource.amount.total),
                                currency: resource.amount.currency,
                                status: 'succeeded',
                                paypal_transaction_id: resource.id,
                                plan_name: sub.plan_name + ' Plan',
                                period_start: paypalSubForPayment.billing_info?.last_payment?.time,
                                period_end: paypalSubForPayment.billing_info?.next_billing_time
                            });
                        }
                    }
                }
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                const cancelledId = resource.id;
                console.log(`[PAYPAL-WEBHOOK] Subscription cancelled: ${cancelledId}`);
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'cancelled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('paypal_subscription_id', cancelledId);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[PAYPAL-WEBHOOK] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

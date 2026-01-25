import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayPalSubscription, cancelPayPalSubscription } from '@/lib/paypal'

export async function POST(request: Request) {
    console.log("[API-SUB-CREATE] POST triggered");
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log("[API-SUB-CREATE] Unauthorized: No user session");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { subscriptionId, planId, planName } = body
        console.log("[API-SUB-CREATE] Request body:", body);

        if (!subscriptionId || !planId || !planName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 1. Get latest active subscription (limit 1 to avoid multiple rows error)
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('paypal_subscription_id, plan_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        // 1. Verify with PayPal FIRST
        console.log("[API-SUB-CREATE] Verifying subscription with PayPal...");
        let paypalSub;
        try {
            paypalSub = await getPayPalSubscription(subscriptionId);
            if (paypalSub) {
                console.log("[API-SUB-CREATE] PayPal Sub Details:", JSON.stringify(paypalSub.billing_info, null, 2));
            } else {
                return NextResponse.json({ error: 'Subscription not found on PayPal' }, { status: 404 });
            }
        } catch (err) {
            console.error("[API-SUB-CREATE] PayPal Verification Error:", err);
            return NextResponse.json({ error: 'Failed to verify subscription with PayPal' }, { status: 500 });
        }

        // 2. ACCOUNT JANITOR: Cancel ALL other active subscriptions for this user
        const { data: allActiveSubs } = await supabase
            .from('subscriptions')
            .select('paypal_subscription_id')
            .eq('user_id', user.id)
            .eq('status', 'active');

        if (allActiveSubs && allActiveSubs.length > 0) {
            console.log(`[API-SUB-CREATE] Janitor: Checking ${allActiveSubs.length} active subscriptions...`);
            for (const sub of allActiveSubs) {
                if (sub.paypal_subscription_id && sub.paypal_subscription_id !== subscriptionId) {
                    console.log("[API-SUB-CREATE] Janitor: Cancelling stale subscription:", sub.paypal_subscription_id);
                    try {
                        await cancelPayPalSubscription(sub.paypal_subscription_id, 'System cleanup: ensuring only one active subscription');
                    } catch (e) {
                        console.error("[API-SUB-CREATE] Janitor Cleanup Error:", e);
                    }
                }
            }
        }

        // 3. Prepare dates and amount from PayPal data if available
        const periodStart = paypalSub?.start_time || new Date().toISOString();
        const periodEnd = paypalSub?.billing_info?.next_billing_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // If it's a revision (same ID) AND plan changed, we might have a $0 prorated charge
        const isRevision = existingSub?.paypal_subscription_id === subscriptionId;
        const lastPaymentAmount = paypalSub?.billing_info?.last_payment?.amount?.value;
        const actualAmount = (isRevision && lastPaymentAmount === undefined) ? 0 : (parseFloat(lastPaymentAmount) || (planName === 'Professional' ? 49 : 99));

        // 4. Upsert subscription
        console.log("[API-SUB-CREATE] Upserting subscription...");
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: planName.toLowerCase(),
                plan_name: planName,
                status: 'active',
                paypal_subscription_id: subscriptionId,
                current_period_start: periodStart,
                current_period_end: periodEnd,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select()
            .maybeSingle()

        if (subError) throw subError;

        // 5. Check if this transaction was already recorded
        const lastPaymentTimeId = paypalSub?.billing_info?.last_payment?.time ? new Date(paypalSub.billing_info.last_payment.time).getTime() : 'initial';
        const paypalTxId = paypalSub?.billing_info?.last_payment?.transaction_id || `SUB-${subscriptionId}-${lastPaymentTimeId}`;

        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('paypal_transaction_id', paypalTxId)
            .maybeSingle();

        // 6. Determine actual amount
        let finalAmount = actualAmount;
        let finalTxId = paypalTxId;

        if (existingPayment || (isRevision && actualAmount === 0)) {
            console.log("[API-SUB-CREATE] Duplicate transaction or $0 revision detected. Recording as $0 switch.");
            finalAmount = 0;
            finalTxId = `SWITCH-${Date.now()}-${paypalTxId}`;
        }

        console.log("[API-SUB-CREATE] Final record: Amount", finalAmount, "TxID", finalTxId);

        const paymentData: any = {
            user_id: user.id,
            subscription_id: subscription.id,
            amount: finalAmount,
            currency: 'USD',
            status: 'succeeded',
            paypal_transaction_id: finalTxId,
            plan_name: planName + ' Plan',
            period_start: periodStart,
            period_end: periodEnd,
        }

        const { error: paymentError } = await supabase.from('payments').insert(paymentData)

        if (paymentError) {
            console.error('[API-SUB-CREATE] Payment record error:', paymentError)
            // Fallback for schema mismatch
            await supabase.from('payments').insert({
                user_id: user.id,
                subscription_id: subscription.id,
                amount: finalAmount,
                currency: 'USD',
                status: 'COMPLETED',
                paypal_transaction_id: finalTxId
            })
        }

        return NextResponse.json({ success: true, subscription })
    } catch (error: any) {
        console.error('[API-SUB-CREATE] Catch-all error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

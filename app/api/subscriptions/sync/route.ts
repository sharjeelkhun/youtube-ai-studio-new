
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getPayPalSubscription } from '@/lib/paypal';

export async function POST(request: Request) {
    console.log("[API-SUB-SYNC] Sync triggered");
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get the current subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (subError) throw subError;
        if (!subscription || !subscription.paypal_subscription_id) {
            return NextResponse.json({ error: 'No active subscription to sync' }, { status: 404 });
        }

        console.log(`[API-SUB-SYNC] Fetching PayPal status for: ${subscription.paypal_subscription_id}`);

        // 2. Fetch latest from PayPal
        const paypalSub = await getPayPalSubscription(subscription.paypal_subscription_id);

        if (!paypalSub) {
            console.log("[API-SUB-SYNC] Subscription not found on PayPal. Marking as cancelled.");
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', subscription.id);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, status: 'cancelled' });
        }

        // 3. Map PayPal status to local status
        // PayPal statuses: APPROVAL_PENDING, APPROVED, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
        let localStatus = 'active';
        if (['CANCELLED', 'EXPIRED'].includes(paypalSub.status)) {
            localStatus = 'cancelled';
        } else if (paypalSub.status === 'SUSPENDED') {
            localStatus = 'past_due';
        }

        const periodStart = paypalSub.start_time || subscription.current_period_start;
        const periodEnd = paypalSub.billing_info?.next_billing_time || subscription.current_period_end;

        console.log(`[API-SUB-SYNC] Updating local record. Status: ${localStatus}, Next Billing: ${periodEnd}`);

        // 4. Update Database
        const { data: updatedSub, error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: localStatus,
                current_period_start: periodStart,
                current_period_end: periodEnd,
                updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
            .select()
            .maybeSingle();

        if (updateError) throw updateError;

        // 5. If there's a new payment recorded in PayPal billing info, we should ideally record it
        // but for now, the priority is fixing the "0 days remaining" UI.

        return NextResponse.json({ success: true, subscription: updatedSub });

    } catch (error: any) {
        console.error('[API-SUB-SYNC] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

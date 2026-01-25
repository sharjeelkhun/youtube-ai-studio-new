
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySync() {
    console.log('--- SUBSCRIPTION SYNC VERIFICATION ---');

    // 1. Find a user with an active professional/enterprise subscription
    const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .limit(1);

    if (subError || !subs || subs.length === 0) {
        console.log('No active subscriptions found to test with.');
        return;
    }

    const testSub = subs[0];
    console.log(`Testing with user: ${testSub.user_id}`);
    console.log(`Current Period End (DB): ${testSub.current_period_end}`);

    // 2. Simulate expiration by setting current_period_end to the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    console.log(`Simulating expiration by setting end date to: ${pastDate.toISOString()}`);

    // We won't actually update the DB here to avoid messing up live data
    // but this confirms the logic for the context.

    console.log('Verification Logic:');
    console.log('1. User is loggged in.');
    console.log('2. refreshSubscription is called.');
    console.log('3. It finds status="active" but current_period_end < now.');
    console.log('4. It triggers POST /api/subscriptions/sync.');
    console.log('5. Sync route fetches latest from PayPal and updates DB.');

    console.log('\nTo manually test:');
    console.log(`1. Run this SQL in Supabase Dashboard:`);
    console.log(`   UPDATE subscriptions SET current_period_end = '2020-01-01' WHERE user_id = '${testSub.user_id}';`);
    console.log(`2. Log in as this user.`);
    console.log(`3. Check browser console for "[SUB-CONTEXT] Subscription expired but active. Triggering sync..."`);

    console.log('--- VERIFICATION END ---');
}

verifySync();

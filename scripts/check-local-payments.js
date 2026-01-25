
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPayments(userId) {
    console.log(`Checking payments for user: ${userId}`);
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const content = JSON.stringify(data, null, 2);
    const fs = require('fs');
    fs.writeFileSync(path.resolve(process.cwd(), 'local_payments_debug.json'), content, 'utf8');
    console.log("Saved response to local_payments_debug.json");
}

const userId = process.argv[2] || 'b5f958b9-36c3-48f0-820c-d77b908ab98f'; // From the user's logs
checkPayments(userId);

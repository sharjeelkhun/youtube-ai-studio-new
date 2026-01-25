
import { getPayPalSubscription } from '../lib/paypal';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugSub(id: string) {
    console.log(`Checking subscription: ${id}`);
    try {
        const sub = await getPayPalSubscription(id);
        console.log(JSON.stringify(sub, null, 2));
    } catch (e) {
        console.error(e);
    }
}

const subId = process.argv[2] || 'I-PYWN61XN11RR';
debugSub(subId);

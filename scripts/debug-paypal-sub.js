
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

async function debugSub(id) {
    console.log(`Checking subscription via Node Fetch: ${id}`);
    try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const sub = await response.json();
        console.log(JSON.stringify(sub, null, 2));
    } catch (e) {
        console.error(e);
    }
}

const subId = process.argv[2] || 'I-PYWN61XN11RR';
debugSub(subId);

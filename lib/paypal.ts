
const PAYPAL_API = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

export async function getPayPalAccessToken() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Missing PayPal credentials');
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal Token Error:', errorText);
        throw new Error(`PayPal API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function getPayPalSubscription(subscriptionId: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        const errorText = await response.text();
        console.error('PayPal Subscription Fetch Error:', errorText);
        throw new Error(`PayPal API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

export async function cancelPayPalSubscription(subscriptionId: string, reason: string = 'User requested cancellation') {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
    });

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error('PayPal Subscription Cancel Error:', errorText);
        throw new Error(`PayPal API Error: ${response.status} ${response.statusText}`);
    }

    return true;
}

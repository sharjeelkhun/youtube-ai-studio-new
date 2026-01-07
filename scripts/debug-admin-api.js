const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

// Node 18+ has global fetch. If older, this might fail, but usually Next.js 14 requires Node 18.


async function test() {
    console.log("Checking Env Vars...")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Existent" : "Missing")
    console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Existent" : "Missing")

    console.log("\nFetching /api/admin/users directly via Supabase Admin (simulation)...")

    // We can't easily hit localhost:3000/api if it depends on headers/cookies etc, 
    // but the route mainly uses supabaseAdmin. 
    // Let's try to strictly import supabaseAdmin and run the query here to see if it works ISOLATED from Next.js.

    // We can't import typescript files directly in node without ts-node.
    // So we will just hit the URL if the server is running.

    try {
        // Need to be careful with fetch if not available
        const res = await fetch('http://localhost:3000/api/admin/users');
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Data Users Length:", data.users ? data.users.length : "undefined");
            console.log("Sample User:", data.users && data.users[0] ? data.users[0] : "None");
        } else {
            console.log("Error body:", await res.text());
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

test();

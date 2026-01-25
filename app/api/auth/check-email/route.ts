import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Search for user by email using Admin API
        // This is safe because it runs on the server with service role
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

        if (error) {
            console.error("[CHECK-EMAIL] Error listing users:", error)
            return NextResponse.json({ error: "Failed to verify email availability" }, { status: 500 })
        }

        const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())

        return NextResponse.json({
            exists: userExists,
            message: userExists ? "Email is already registered" : "Email is available"
        })
    } catch (error) {
        console.error("[CHECK-EMAIL] Unexpected error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 })
    }
}

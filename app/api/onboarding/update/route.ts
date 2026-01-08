import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { step, data, completed } = await request.json()

        const updates: any = {}

        if (step !== undefined) {
            updates.onboarding_step = step
        }

        if (data !== undefined) {
            updates.onboarding_data = data
        }

        if (completed !== undefined) {
            updates.onboarding_completed = completed
            if (completed) {
                updates.onboarding_data = {} // Clear temporary data
            }
        }

        const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

        if (error) {
            console.error("Error updating onboarding:", error)
            return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error in update onboarding:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

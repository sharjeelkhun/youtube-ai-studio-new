"use server"

import { createServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

export async function deleteUser(userId: string) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Unauthorized" }
    }

    // Verify admin role
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: "Forbidden: Admin access required" }
    }

    if (userId === user.id) {
        return { error: "You cannot delete your own account." }
    }

    try {
        console.log(`[Admin] Starting ROBUST deletion for user: ${userId}`)

        // 1. Manually delete references that might not cascade (safety check)

        // A. Content Ideas
        const { error: ideasError } = await supabaseAdmin.from('content_ideas').delete().eq('user_id', userId)
        if (ideasError) console.error("Error cleaning content_ideas:", ideasError)

        // B. Payments
        const { error: paymentError } = await supabaseAdmin.from('payments').delete().eq('user_id', userId)
        if (paymentError) console.error("Error cleaning payments:", paymentError)

        // C. YouTube Channels and dependent data
        const { data: channels } = await supabaseAdmin.from('youtube_channels').select('id').eq('user_id', userId)

        if (channels && channels.length > 0) {
            const channelIds = channels.map(c => c.id)

            // 1. Clean video_tags (linked to videos)
            const { data: videos } = await supabaseAdmin.from('videos').select('id').in('channel_id', channelIds)
            if (videos && videos.length > 0) {
                // Fix TS inference
                const videoItems = videos as any[]
                const videoIds = videoItems.map(v => v.id)
                await supabaseAdmin.from('video_tags').delete().in('video_id', videoIds)

                // Now delete videos
                await supabaseAdmin.from('videos').delete().in('id', videoIds)
            }

            // 2. Clean other channel dependents
            await supabaseAdmin.from('youtube_videos').delete().in('channel_id', channelIds)
            await supabaseAdmin.from('analytics_data').delete().in('channel_id', channelIds)

            // 3. Delete channels
            const { error: chErr } = await supabaseAdmin.from('youtube_channels').delete().eq('user_id', userId)
            if (chErr) console.error("Error cleaning channels:", chErr)
        }

        // D. Subscriptions
        const { error: subError } = await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)
        if (subError) console.error("Error cleaning up subscriptions:", subError)

        // E. Profile
        const { error: profileError, count: profileCount } = await supabaseAdmin
            .from('profiles')
            .delete({ count: 'exact' })
            .eq('id', userId)

        if (profileError) {
            console.error("Error cleaning up profile:", profileError)
            return { error: `Profile deletion failed: ${profileError.message}` }
        }

        console.log(`Deleted ${profileCount} profile(s).`)

        // 2. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            if (authError.message?.toLowerCase().includes("not found") || (authError as any).status === 404) {
                console.log("Auth user already deleted.")
            } else {
                console.error("Error deleting auth user:", authError)
                return { error: `Auth deletion failed: ${authError.message}` }
            }
        }

        // 3. VERIFY DELETION
        // We double check if the profile is truly gone.
        const { data: checkProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle()

        if (checkProfile) {
            console.error("CRITICAL: User was deleted but still exists in DB:", checkProfile)
            return {
                error: "Deletion Verification Failed: User still exists in database. This might be due to RLS policies or Triggers restoring the user. Please check database logs."
            }
        }

        revalidatePath('/admin/users')
        return { success: true, message: `Successfully deleted user (Verified).` }
    } catch (error) {
        console.error("Delete user error:", error)
        return { error: "Failed to delete user (Server Error)" }
    }
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        // 1. Get current user session to verify identity
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id

        // 2. Comprehensive Cleanup Sequence
        // We must delete in reverse dependency order to satisfy foreign key constraints
        console.log(`[DELETE-USER] Starting cleanup for user: ${userId}`)

        // A. Delete Video related data
        // Need to get channel IDs first to find videos
        const { data: channels } = await (supabaseAdmin
            .from('youtube_channels') as any)
            .select('id')
            .eq('user_id', userId)

        const channelIds = (channels as any[])?.map(c => c.id) || []

        if (channelIds.length > 0) {
            // Delete analytics
            await (supabaseAdmin.from('analytics_data') as any).delete().in('channel_id', channelIds)

            // Delete video tags and videos
            const { data: videos } = await (supabaseAdmin.from('videos') as any).select('id').in('channel_id', channelIds)
            const videoIds = (videos as any[])?.map(v => v.id) || []

            if (videoIds.length > 0) {
                await supabaseAdmin.from('video_tags').delete().in('video_id', videoIds)
                await supabaseAdmin.from('videos').delete().in('id', videoIds)
            }

            // Delete youtube_videos
            await supabaseAdmin.from('youtube_videos').delete().in('channel_id', channelIds)

            // Finally delete channels
            await supabaseAdmin.from('youtube_channels').delete().eq('user_id', userId)
        }

        // B. Delete remaining top-level relations
        await supabaseAdmin.from('content_ideas').delete().eq('user_id', userId)
        await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)
        await supabaseAdmin.from('payments').delete().eq('user_id', userId)

        // C. Delete Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.error('[DELETE-USER] Profile deletion error (continuing):', profileError)
        }

        // 3. Delete from Supabase Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('[DELETE-USER] Auth deletion error details:', {
                message: deleteError.message,
                status: deleteError.status,
            })
            return NextResponse.json({
                error: `Auth deletion failed: ${deleteError.message}`
            }, { status: 500 })
        }

        // 4. Log the user out (client side will handle redirect)
        return NextResponse.json({ success: true, message: 'Account deleted successfully' })

    } catch (error) {
        console.error('[DELETE-USER] Unexpected error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 })
    }
}

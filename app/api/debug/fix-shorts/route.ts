import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

// Helper to parse duration
const parseDuration = (iso: string) => {
    try {
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        const h = match?.[1] ? parseInt(match[1], 10) : 0
        const m = match?.[2] ? parseInt(match[2], 10) : 0
        const s = match?.[3] ? parseInt(match[3], 10) : 0
        return h * 3600 + m * 60 + s
    } catch { return 0 }
}

export async function GET() {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return NextResponse.json({ error: 'No session' })

    // 1. Fetch ALL videos
    // We need to check everything because we might need to REMOVE 'short' tag from mislabeled ones
    const { data: videos } = await supabase
        .from('youtube_videos')
        .select('id, title, duration, tags')
        .eq('channel_id', (await supabase.from('youtube_channels').select('id').eq('user_id', session.user.id).single()).data?.id)

    if (!videos?.length) return NextResponse.json({ message: 'No videos found' })

    let fixedCount = 0
    let processedCount = 0
    const updates = []

    // 2. Process in batches
    const BATCH_SIZE = 20
    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (v) => {
            const seconds = parseDuration(v.duration || '')
            let isShort = false

            if (seconds > 0 && seconds <= 60) {
                try {
                    const res = await fetch(`https://www.youtube.com/shorts/${v.id}`, {
                        method: 'HEAD',
                        redirect: 'follow',
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YouTubeAIStudio/1.0;)' }
                    })
                    if (res.url.includes('/shorts/')) {
                        isShort = true
                    }
                } catch (e) {
                    isShort = false
                }
            }

            // Check if tags need update
            const currentTags = v.tags || []
            const hasShortTag = currentTags.includes('short')

            let newTags = [...currentTags]
            let needsUpdate = false

            if (isShort && !hasShortTag) {
                newTags.push('short')
                needsUpdate = true
            } else if (!isShort && hasShortTag) {
                newTags = newTags.filter(t => t !== 'short')
                needsUpdate = true
            }

            if (needsUpdate) {
                updates.push({ id: v.id, tags: newTags })
                fixedCount++
            }
            processedCount++
        }))
    }

    // 3. Apply updates
    if (updates.length > 0) {
        const { error } = await supabase
            .from('youtube_videos')
            .upsert(updates.map(u => ({ id: u.id, tags: u.tags }))) // Upsert by ID to update tags

        if (error) return NextResponse.json({ error: 'Failed to update DB', details: error })

        // Also update channel stats to trigger a refresh logic if needed? 
        // Not strictly necessary as page relies on local state but a refresh helps.
    }

    return NextResponse.json({
        success: true,
        processed: processedCount,
        fixed: fixedCount,
        updates: updates.length > 5 ? updates.slice(0, 5) : updates
    })
}

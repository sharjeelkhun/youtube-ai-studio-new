import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { generateText } from "@/lib/ai-suggestions"
import { createServerClient } from "@/lib/supabase-server"

export const maxDuration = 60 // Allow longer timeout for bulk generation

export async function POST(req: Request) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { location, keywords, template } = await req.json()

        if (!location || !keywords || !Array.isArray(keywords)) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 })
        }

        let processed = 0
        let failed = 0

        // Process sequentially to respect rate limits roughly, or parallel with limit.
        // For simplicity and stability, sequential for now.
        for (const keyword of keywords) {
            try {
                const prompt = `
                    Create a comprehensive, SEO-optimized landing page content for the following:
                    Service/Keyword: "${keyword}"
                    Location: "${location}"
                    Additional Instructions: ${template || "None"}

                    Output structured JSON with the following keys:
                    - title: (Catchy generic title including location, e.g. "Best Plumber in New York")
                    - description: (Meta description, 150-160 chars)
                    - content: (Full HTML body content, use h2, h3, p tags. No markdown code blocks, just semantic HTML)
                    - slug: (URL friendly slug, e.g. plumber-new-york)

                    Make sure the content is high quality, relevant, and at least 300 words.
                `

                // We use the user's client/session for AI generation to track usage if needed, 
                // OR we accept that Admin uses their own quota.
                // generateText requires a supabase client with session to track usage properly.
                // We passed `supabase` (the server client with user session).
                const aiResponseRaw = await generateText(supabase as any, prompt)

                // Parse JSON
                let parsed
                try {
                    // Clean markdown code blocks if present
                    const cleanJson = aiResponseRaw.replace(/```json\n?|\n?```/g, '')
                    parsed = JSON.parse(cleanJson)
                } catch (e) {
                    console.error("Failed to parse AI response", e)
                    // Fallback or retry? for now mark failed
                    failed++
                    continue
                }

                if (!parsed.title || !parsed.content || !parsed.slug) {
                    failed++
                    continue
                }

                // Insert into DB
                const { error: insertError } = await supabaseAdmin
                    .from('seo_pages')
                    .insert({
                        location,
                        keyword,
                        title: parsed.title,
                        description: parsed.description,
                        content: parsed.content,
                        slug: parsed.slug, // You might want to ensure uniqueness (add random string if needed)
                        status: 'published'
                    })

                if (insertError) {
                    // Start duplicate slug handling
                    if (insertError.code === '23505') { // Unique violation
                        const newSlug = `${parsed.slug}-${Math.floor(Math.random() * 1000)}`
                        await supabaseAdmin.from('seo_pages').insert({
                            location,
                            keyword,
                            title: parsed.title,
                            description: parsed.description,
                            content: parsed.content,
                            slug: newSlug,
                            status: 'published'
                        })
                        processed++
                    } else {
                        console.error('Insert error', insertError)
                        failed++
                    }
                } else {
                    processed++
                }

            } catch (err) {
                console.error("Error processing keyword:", keyword, err)
                failed++
            }
        }

        return NextResponse.json({ success: true, processed, failed })

    } catch (error) {
        console.error("Bulk generation error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

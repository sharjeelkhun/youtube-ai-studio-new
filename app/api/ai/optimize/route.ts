import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { title, description } = await request.json()

  if (!title || !description) {
    return new NextResponse(JSON.stringify({ error: 'Title and description are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('ai_provider, ai_api_key, ai_settings')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    return new NextResponse(JSON.stringify({ error: 'AI settings not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // In a real application, you would use the profile.ai_provider and profile.ai_api_key
  // to make a call to the selected AI service.
  // For this example, we'll return a mocked response.

  const optimizedTitle = `🚀 ${title} | AI Optimized 🚀`
  const optimizedDescription = `This is an AI-optimized description for "${title}".\n\n${description}`
  const optimizedTags = ['AI', 'Optimized', 'YouTube']

  return new NextResponse(
    JSON.stringify({
      title: optimizedTitle,
      description: optimizedDescription,
      tags: optimizedTags,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

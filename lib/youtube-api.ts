// Helper functions for YouTube API

/**
 * Makes an authenticated request to the YouTube API
 */
export async function fetchFromYouTubeAPI(endpoint: string, token: string, options: RequestInit = {}, apiKey?: string): Promise<any> {
  if (!token && !apiKey) {
    throw new Error("No YouTube access token or API key provided")
  }

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}${apiKey ? `${separator}key=${apiKey}` : ''}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 401) {
      throw new Error("YouTube token expired")
    }
    if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error("YouTube API quota exceeded")
    }
    throw new Error(`YouTube API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
  }

  return await response.json()
}

// Helper functions for YouTube API

/**
 * Makes an authenticated request to the YouTube API
 */
export async function fetchFromYouTubeAPI(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
  if (!token) {
    throw new Error("No YouTube access token provided")
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid or expired
      throw new Error("YouTube token expired")
    }
    throw new Error(`YouTube API error: ${response.status}`)
  }

  return await response.json()
}

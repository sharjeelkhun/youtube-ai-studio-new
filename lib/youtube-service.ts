import { isPreviewEnvironment } from "./db"

// Check if token is expired
export function isTokenExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return true
  return new Date(expiryDate) <= new Date()
}

export const youtubeService = {
  // Get authorization URL for OAuth flow
  async getAuthUrl(userId: string): Promise<string> {
    try {
      // In preview mode, return a mock URL
      if (isPreviewEnvironment()) {
        return `/connect-channel/callback?preview=true&code=mock_code&state=mock_state`
      }

      const response = await fetch("/api/youtube/connect")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get authorization URL")
      }

      const data = await response.json()

      // Save state to localStorage for verification
      if (data.state) {
        localStorage.setItem("youtube_auth_state", data.state)
      }

      return data.authUrl
    } catch (error: any) {
      console.error("Error getting auth URL:", error)
      throw error
    }
  },

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      // In preview mode, return mock data
      if (isPreviewEnvironment()) {
        return {
          access_token: "mock_access_token",
          refresh_token: "mock_refresh_token",
          expires_in: 3600,
          channelId: "UC123456789",
          channelTitle: "Mock Channel",
        }
      }

      const response = await fetch("/api/youtube/auth-callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to exchange code for tokens")
      }

      return await response.json()
    } catch (error: any) {
      console.error("Error exchanging code for tokens:", error)
      throw error
    }
  },

  // Refresh access token
  async refreshToken(channelId: string, refreshToken: string): Promise<any> {
    try {
      // In preview mode, return mock data
      if (isPreviewEnvironment()) {
        return {
          access_token: "mock_refreshed_access_token",
          expires_in: 3600,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      }

      const response = await fetch("/api/youtube/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId, refreshToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to refresh token")
      }

      return await response.json()
    } catch (error: any) {
      console.error("Error refreshing token:", error)
      throw error
    }
  },

  // Get channel data
  async getChannelData(accessToken: string): Promise<any> {
    try {
      // In preview mode, return mock data
      if (isPreviewEnvironment()) {
        return {
          id: "UC123456789",
          title: "Mock Channel",
          description: "This is a mock channel for preview mode",
          thumbnail: "/placeholder.svg?height=80&width=80",
          subscribers: 10500,
          videos: 42,
          views: 1000000,
        }
      }

      const response = await fetch("/api/youtube/channel", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get channel data")
      }

      return await response.json()
    } catch (error: any) {
      console.error("Error getting channel data:", error)
      throw error
    }
  },
}

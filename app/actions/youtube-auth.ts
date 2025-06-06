"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function initiateYouTubeAuth() {
  const redirectUri = "https://youtube-ai-studio-new.vercel.app/connect-channel"
  const scope = "https://www.googleapis.com/auth/youtube.readonly"

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID || "")
  authUrl.searchParams.append("redirect_uri", redirectUri)
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("scope", scope)
  authUrl.searchParams.append("access_type", "offline")
  authUrl.searchParams.append("prompt", "consent")

  return { url: authUrl.toString() }
}

export async function handleYouTubeCallback(code: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: "https://youtube-ai-studio-new.vercel.app/connect-channel",
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error_description || errorData.error || "Failed to exchange code for tokens")
    }

    const tokenData = await tokenResponse.json()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("No active session")
    }

    // Store the tokens in session storage instead of the database
    sessionStorage.setItem("youtube_access_token", tokenData.access_token)
    sessionStorage.setItem("youtube_refresh_token", tokenData.refresh_token)
    sessionStorage.setItem("youtube_token_expiry", (Math.floor(Date.now() / 1000) + tokenData.expires_in).toString())

    return { success: true }
  } catch (error: any) {
    console.error("Error handling YouTube callback:", error)
    return { success: false, error: error.message }
  }
}

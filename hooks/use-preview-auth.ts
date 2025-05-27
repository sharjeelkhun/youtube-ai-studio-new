"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function usePreviewAuth() {
  const { isPreview } = useAuth()

  useEffect(() => {
    if (isPreview) {
      // Set a cookie to track login state in preview mode
      const handleLogin = () => {
        document.cookie = "preview_logged_in=true; path=/; max-age=86400"
      }

      const handleLogout = () => {
        document.cookie = "preview_logged_in=false; path=/; max-age=0"
      }

      // Listen for auth events
      window.addEventListener("preview-login", handleLogin)
      window.addEventListener("preview-logout", handleLogout)

      return () => {
        window.removeEventListener("preview-login", handleLogin)
        window.removeEventListener("preview-logout", handleLogout)
      }
    }
  }, [isPreview])
}

"use client"

import React, { Suspense } from "react"
import YouTubeCallbackContent from "@/components/youtube-callback-content"

// Wrapper component that handles the useSearchParams call
function YouTubeCallbackInner() {
  return <YouTubeCallbackContent />
}

// Main wrapper with Suspense boundary
export function YouTubeCallbackWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YouTubeCallbackInner />
    </Suspense>
  )
} 
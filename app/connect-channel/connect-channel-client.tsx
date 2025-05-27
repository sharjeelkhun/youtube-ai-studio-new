"use client"

import { useAuth } from "@/contexts/auth-context"

export function ConnectChannelClient() {
  const { session } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Connect YouTube Channel</h1>
      <button
        onClick={async () => {
          const response = await fetch('/api/youtube/connect')
          const data = await response.json()
          if (data.authUrl) {
            window.location.href = data.authUrl
          }
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Connect YouTube Channel
      </button>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DebugButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/supabase-debug")}
      className="fixed bottom-4 right-4 z-50 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    >
      Debug Connection
    </Button>
  )
}

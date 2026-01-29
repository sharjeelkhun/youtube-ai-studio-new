"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageLoader } from "@/components/ui/page-loader"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login")
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return <PageLoader />
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

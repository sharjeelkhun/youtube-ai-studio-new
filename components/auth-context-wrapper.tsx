"use client"

import React, { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"

import { PageLoader } from "@/components/ui/page-loader"

// Wrapper component that handles the useSearchParams call
function AuthContextInner({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// Main wrapper with Suspense boundary
export function AuthContextWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthContextInner>{children}</AuthContextInner>
    </Suspense>
  )
} 
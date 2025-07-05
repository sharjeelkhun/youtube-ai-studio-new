"use client"

import React, { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"

// Wrapper component that handles the useSearchParams call
function AuthContextInner({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// Main wrapper with Suspense boundary
export function AuthContextWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContextInner>{children}</AuthContextInner>
    </Suspense>
  )
} 
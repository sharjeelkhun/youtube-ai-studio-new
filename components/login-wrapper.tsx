"use client"

import React, { Suspense } from "react"
import LoginContent from "@/components/login-content"
import { PageLoader } from "@/components/ui/page-loader"

// Wrapper component that handles the useSearchParams call
function LoginInner() {
  return <LoginContent />
}

// Main wrapper with Suspense boundary
export function LoginWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginInner />
    </Suspense>
  )
} 
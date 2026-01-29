"use client"

import React, { Suspense } from "react"
import ResetPasswordContent from "@/components/reset-password-content"
import { PageLoader } from "@/components/ui/page-loader"

// Wrapper component that handles the useSearchParams call
function ResetPasswordInner() {
  return <ResetPasswordContent />
}

// Main wrapper with Suspense boundary
export function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordInner />
    </Suspense>
  )
} 
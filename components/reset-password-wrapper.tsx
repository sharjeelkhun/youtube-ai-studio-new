"use client"

import React, { Suspense } from "react"
import ResetPasswordContent from "@/components/reset-password-content"

// Wrapper component that handles the useSearchParams call
function ResetPasswordInner() {
  return <ResetPasswordContent />
}

// Main wrapper with Suspense boundary
export function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  )
} 
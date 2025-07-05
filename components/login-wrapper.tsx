"use client"

import React, { Suspense } from "react"
import LoginContent from "@/components/login-content"

// Wrapper component that handles the useSearchParams call
function LoginInner() {
  return <LoginContent />
}

// Main wrapper with Suspense boundary
export function LoginWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginInner />
    </Suspense>
  )
} 
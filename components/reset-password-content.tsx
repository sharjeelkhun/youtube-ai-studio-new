"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function ResetPasswordContent() {
  // Form state
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<{
    password: boolean
    confirmPassword: boolean
  }>({
    password: false,
    confirmPassword: false,
  })

  // Router and params
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auth context
  const { validatePassword, isMockAuth } = useAuth()

  // Validate form fields on change
  useEffect(() => {
    const newError = { password: "", confirmPassword: "" }

    if (touched.password) {
      const isValid = validatePassword(password)
      if (!isValid) {
        newError.password = "Password must be at least 6 characters."
      }
    }

    if (touched.confirmPassword && password !== confirmPassword) {
      newError.confirmPassword = "Passwords do not match"
    }

    if (newError.password || newError.confirmPassword) {
      setError(newError.password || newError.confirmPassword)
    } else {
      setError(null)
    }
  }, [password, confirmPassword, touched, validatePassword])

  // Handle field blur
  const handleBlur = (field: "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    setTouched({
      password: true,
      confirmPassword: true,
    })

    const isValid = validatePassword(password)

    if (!isValid) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (isMockAuth) {
        // Simulate password reset in demo mode
        setSuccess("Password has been reset successfully (simulated)")

        setTimeout(() => {
          router.push("/login?message=Your password has been reset successfully")
        }, 2000)

        return
      }

      const supabase = createClient()
      // Update password
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setSuccess("Password has been reset successfully")

      // Redirect to login
      setTimeout(() => {
        router.push("/login?message=Your password has been reset successfully")
      }, 2000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to reset password")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>

          {isMockAuth && (
            <Alert className="mt-2">
              <AlertDescription>Running in demo mode. Password reset will be simulated.</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                New Password
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={touched.password && !validatePassword(password) ? "border-red-500" : ""}
                disabled={isSubmitting || !!success}
                required
              />
              {touched.password && !validatePassword(password) && (
                <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm New Password
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                className={touched.confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                disabled={isSubmitting || !!success}
                required
              />
              {touched.confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !!success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 
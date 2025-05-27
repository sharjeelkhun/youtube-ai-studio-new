"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  // Auth context
  const { resetPassword, validateEmail, isMockAuth } = useAuth()

  // Validate email on change
  useEffect(() => {
    if (touched) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.valid) {
        setError(emailValidation.error)
      } else {
        setError(null)
      }
    }
  }, [email, touched, validateEmail])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    setTouched(true)
    const emailValidation = validateEmail(email)

    if (!emailValidation.valid) {
      setError(emailValidation.error)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await resetPassword(email)

      if (result.success) {
        setSuccess("Password reset email sent. Please check your inbox.")
        setEmail("")
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error("Password reset error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>

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
              <Label htmlFor="email">
                Email
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={error ? "border-red-500" : ""}
                disabled={isSubmitting}
                required
              />
              {error && touched && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

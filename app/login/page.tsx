"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  // Form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    form?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })

  // Auth context
  const { signIn, session, isLoading, validateEmail, validatePassword, isMockAuth } = useAuth()

  // Router and params
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const redirect = searchParams.get("redirect") || "/dashboard"

  // Redirect if already logged in
  useEffect(() => {
    if (session && !isLoading) {
      router.push(redirect)
    }
  }, [session, router, redirect, isLoading])

  // Validate form fields on change
  useEffect(() => {
    const newErrors: typeof errors = {}

    if (touched.email) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error
      }
    }

    if (touched.password) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.error
      }
    }

    setErrors(newErrors)
  }, [email, password, touched, validateEmail, validatePassword])

  // Handle field blur
  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    setTouched({ email: true, password: true })

    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    const newErrors: typeof errors = {}
    if (!emailValidation.valid) newErrors.email = emailValidation.error
    if (!passwordValidation.valid) newErrors.password = passwordValidation.error

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await signIn(email, password)

      if (!result.success) {
        setErrors({ form: result.error })
      }
    } catch (error) {
      setErrors({ form: "An unexpected error occurred" })
      console.error("Login error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>

          {isMockAuth && (
            <Alert className="mt-2">
              <AlertDescription>Running in demo mode. Authentication will be simulated.</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {errors.form && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errors.form}</AlertDescription>
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
                onBlur={() => handleBlur("email")}
                className={errors.email ? "border-red-500" : ""}
                disabled={isSubmitting}
                required
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Password
                  <span className="text-red-500">*</span>
                </Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={errors.password ? "border-red-500" : ""}
                disabled={isSubmitting}
                required
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  // Form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    form?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<{
    fullName: boolean
    email: boolean
    password: boolean
    confirmPassword: boolean
  }>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  // Auth context
  const { signUp, validateEmail, validatePassword, isMockAuth } = useAuth()
  const router = useRouter()

  // Validate form fields on change
  useEffect(() => {
    const newErrors: typeof errors = {}

    if (touched.fullName && !fullName.trim()) {
      newErrors.fullName = "Please enter your name"
    }

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

    if (touched.confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
  }, [fullName, email, password, confirmPassword, touched, validateEmail, validatePassword])

  // Handle field blur
  const handleBlur = (field: "fullName" | "email" | "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your name"
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await signUp(email, password, fullName)

      if (!result.success) {
        setErrors({ form: result.error })
      }
    } catch (error) {
      setErrors({ form: "An unexpected error occurred" })
      console.error("Signup error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>

          {isMockAuth && (
            <Alert className="mt-2">
              <AlertDescription>Running in demo mode. Account creation will be simulated.</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {errors.form && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
                disabled={isSubmitting}
                required
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
            </div>

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
              <Label htmlFor="password">
                Password
                <span className="text-red-500">*</span>
              </Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
                disabled={isSubmitting}
                required
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

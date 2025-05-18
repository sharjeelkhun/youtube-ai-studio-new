"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from '@/lib/supabase'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { signIn, session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const redirect = searchParams.get("redirect") || "/dashboard"

  useEffect(() => {
    // Validate connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) {
          console.error("Supabase connection error:", error)
          setError("Unable to connect to authentication service")
        }
      } catch (err) {
        console.error("Failed to initialize authentication:", err)
        setError("Authentication service unavailable")
      }
    }
    
    checkConnection()
  }, [])

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session) {
      router.push(redirect)
    }
  }, [session, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (retryCount >= 5) {
      setError("Too many attempts. Please wait a few minutes before trying again.");
      setIsLoading(false);
      return;
    }

    try {
      // Attempt sign in directly using auth context
      await signIn(email, password);
      
    } catch (err: any) {
      console.error("Login error:", err);
      setRetryCount(prev => prev + 1);
      
      const errorMessage = err.message?.toLowerCase() || "";
      
      if (errorMessage.includes("invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("too many requests")) {
        setError("Too many attempts. Please try again later.");
      } else if (!navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
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

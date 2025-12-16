"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Sparkles, Crown } from "lucide-react"
import DotGrid from "@/components/dot-grid"
import { useSearchParams, useRouter } from "next/navigation"



export default function SignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedPlan = searchParams?.get('plan') || null

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { signUp, isLoading, isPreview } = useAuth()

  const planNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await signUp(email, password)
      // After successful signup, redirect to billing if plan was selected
      if (selectedPlan) {
        router.push(`/settings?tab=billing&plan=${selectedPlan}`)
      }
    } catch (err: any) {
      setError("Could not create account. Please try again.")
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />

      {/* Radial Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0000]/10 via-transparent to-transparent" />

      {/* Dot Grid Background */}
      <DotGrid />

      {/* Content */}
      <div className="relative flex items-center justify-center min-h-screen py-6 px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Create an account</CardTitle>
            {isPreview && <CardDescription className="text-center">Preview Mode: Enter any details</CardDescription>}
          </CardHeader>
          <CardContent>
            {selectedPlan && (
              <Alert className="mb-4 border-[#FF0000]/20 bg-[#FF0000]/5">
                <Crown className="h-4 w-4 text-[#FF0000]" />
                <AlertTitle className="text-[#FF0000]">You're signing up for {planNames[selectedPlan] || selectedPlan}</AlertTitle>
                <AlertDescription>
                  Complete your account creation to proceed to checkout
                </AlertDescription>
              </Alert>
            )}
            {isPreview && (
              <Alert className="mb-4">
                <AlertDescription>This is running in preview mode. Any details will work.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
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
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/90 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

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
import { useSearchParams } from "next/navigation"

export default function SignupPage() {
  const searchParams = useSearchParams()
  const selectedPlan = searchParams?.get('plan') || null

  const [signUpSuccess, setSignUpSuccess] = useState(false)
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
      // Store the plan in a cookie as a backup for the redirect
      // This is more robust than localStorage for cross-tab auth flows
      if (selectedPlan) {
        document.cookie = `pending_plan=${selectedPlan}; path=/; max-age=3600; SameSite=Lax`
      }

      await signUp(email, password, selectedPlan)
      setSignUpSuccess(true)
    } catch (err: any) {
      // Show the specific error message from Supabase if available
      setError(err.message || "Could not create account. Please try again.")
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />

      {/* Radial Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0000]/10 via-transparent to-transparent" />

      {/* Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <DotGrid />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-center min-h-screen py-6 px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold tracking-tight">
              {signUpSuccess ? "Success!" : "Create an account"}
            </CardTitle>
            {isPreview && !signUpSuccess && (
              <CardDescription className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Preview Mode: Any details will work
              </CardDescription>
            )}
          </CardHeader>

          {signUpSuccess ? (
            <CardContent className="space-y-6 pt-6 pb-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center shadow-inner">
                  <Sparkles className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">Next Step: Verify Email</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed px-4">
                    We've sent a verification link to <br />
                    <span className="font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded transition-colors break-all">{email}</span>
                  </p>
                  <Alert className="mt-6 border-[#FF0000]/20 bg-[#FF0000]/5 text-left">
                    <Crown className="h-4 w-4 text-[#FF0000]" />
                    <AlertTitle className="text-[#FF0000] font-bold">Action Required</AlertTitle>
                    <AlertDescription className="text-xs">
                      Please click the link in your email to confirm your account and complete your <strong>{planNames[selectedPlan || ''] || 'Starter'}</strong> setup.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
              <div className="pt-6 border-t border-border/50">
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setSignUpSuccess(false)}>
                  Back to signup
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-4 pt-4 pb-6">
                {selectedPlan && (
                  <Alert className="border-[#FF0000]/20 bg-[#FF0000]/5 border-l-4">
                    <Crown className="h-4 w-4 text-[#FF0000]" />
                    <AlertTitle className="text-[#FF0000] font-bold">Plan: {planNames[selectedPlan] || selectedPlan}</AlertTitle>
                    <AlertDescription className="text-xs">
                      Finish creating your account to proceed to the payment step.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="bg-muted/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourbrand.com"
                      required
                      className="bg-muted/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-muted/50 focus:bg-background transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium italic">Requirement: At least 6 characters</p>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up your account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border/50 py-6 bg-muted/20">
                <p className="text-sm text-muted-foreground font-medium">
                  Already a member?{" "}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-bold underline transition-colors">
                    Sign in here
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

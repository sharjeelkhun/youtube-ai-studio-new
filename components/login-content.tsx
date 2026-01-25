"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useSession } from '@/contexts/session-context'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import DotGrid from '@/components/dot-grid'



export default function LoginContent() {
  const { signIn, signInWithGoogle, loading } = useAuth()
  const { session, isLoading } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const pathname = usePathname()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  console.log('Login page - Session state:', {
    hasSession: !!session,
    userId: session?.user?.id,
    isLoading
  })

  useEffect(() => {
    // Only redirect if we have a session and we're on the login page
    if (session && !isLoading && pathname === '/login') {
      console.log('Session detected on login page, redirecting to:', redirectTo)
      window.location.href = redirectTo
    }
  }, [session, isLoading, redirectTo, pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setIsSubmitting(false)
      } else {
        // Sign in successful - force immediate redirect
        console.log('Login successful, forcing redirect to:', redirectTo)
        window.location.href = redirectTo
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="text-sm text-right">
                <Link href="/forgot-password"
                  className="font-medium text-primary hover:text-primary/90">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground italic font-medium">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-background/50 border-border/50 hover:bg-background transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md hover:border-primary/30 group relative overflow-hidden"
                onClick={() => signInWithGoogle()}
                disabled={isSubmitting || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <svg className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                {loading ? 'Connecting...' : 'Continue with Google'}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup"
                  className="font-medium text-primary hover:text-primary/90">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
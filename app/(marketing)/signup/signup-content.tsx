"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Sparkles, Crown, AlertCircle } from "lucide-react"
import DotGrid from "@/components/dot-grid"
import { useSearchParams, useRouter } from "next/navigation"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { toast } from "sonner"
import { PLANS } from "@/lib/pricing"

export function SignupContent() {
    const searchParams = useSearchParams()
    const selectedPlan = searchParams?.get('plan') || null

    const [signUpSuccess, setSignUpSuccess] = useState(false)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [otpCode, setOtpCode] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const { signUp, signInWithGoogle, verifyOtp, resendOtp, isLoading, isPreview } = useAuth()
    const router = useRouter()

    const planName = selectedPlan ? PLANS.find(p => p.id === selectedPlan)?.name || selectedPlan : null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Phone validation
        const phoneRegex = /^\+?[0-9\s-()]+$/
        if (!phoneRegex.test(phone)) {
            setError("Please enter a valid phone number.")
            return
        }

        try {
            // Store the plan in a cookie as a backup for the redirect
            // This is more robust than localStorage for cross-tab auth flows
            if (selectedPlan) {
                document.cookie = `pending_plan=${selectedPlan}; path=/; max-age=3600; SameSite=Lax`
            }

            await signUp(email, password, fullName, phone, selectedPlan)
            setSignUpSuccess(true)
        } catch (err: any) {
            // Show the specific error message from Supabase if available
            setError(err.message || "Could not create account. Please try again.")
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otpCode.length !== 6) {
            setError("Please enter the 6-digit code.")
            return
        }

        setIsVerifying(true)
        setError(null)

        try {
            const { error: verifyError } = await verifyOtp(email, otpCode, 'signup')

            if (verifyError) {
                throw verifyError
            }

            toast.success("Email verified successfully!")
            // Redirect to dash or plan selection/payment
            if (selectedPlan) {
                router.push(`/callback?plan=${selectedPlan}`)
            } else {
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || "Invalid or expired code. Please try again.")
            setIsVerifying(false) // Only stop loading on error, keep loading on success for redirect
        }
    }

    const handleResendOtp = async () => {
        setIsResending(true)
        setError(null)

        try {
            const { error: resendError } = await resendOtp(email, 'signup')

            if (resendError) {
                throw resendError
            }

            toast.success("A new verification code has been sent.")
        } catch (err: any) {
            setError(err.message || "Could not resend code. Please try again later.")
        } finally {
            setIsResending(false)
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
                <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden relative">

                    {/* Global Loader Overlay for Verification Success/Redirect */}
                    {isVerifying && !error && (
                        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-lg font-semibold text-foreground">Verifying & Redirecting...</p>
                        </div>
                    )}

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
                        <CardContent className="space-y-8 pt-8 pb-10">
                            <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="relative">
                                    <div className="absolute -inset-1 rounded-full bg-primary/20 blur animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                                        <Sparkles className="h-10 w-10 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight text-foreground">Verify your email</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        We've sent a 6-digit verification code to <br />
                                        <span className="font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded break-all">{email}</span>
                                    </p>
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 w-full text-left bg-destructive/5 border-destructive/20">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleVerifyOtp} className="w-full space-y-8">
                                    <div className="flex flex-col items-center gap-4">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Enter Verification Code</Label>
                                        <InputOTP
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(value) => setOtpCode(value)}
                                            autoFocus
                                        >
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={0} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                                <InputOTPSlot index={1} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                                <InputOTPSlot index={2} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                            </InputOTPGroup>
                                            <InputOTPSeparator className="text-muted-foreground" />
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={3} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                                <InputOTPSlot index={4} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                                <InputOTPSlot index={5} className="h-12 w-10 md:w-12 text-lg font-bold rounded-lg border-2" />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                                        disabled={isVerifying || otpCode.length !== 6}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify & Continue"
                                        )}
                                    </Button>
                                </form>

                                <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Didn't receive the code?
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-6 font-bold rounded-full border-border/50 hover:bg-secondary transition-colors"
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                    >
                                        {isResending ? (
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        ) : null}
                                        {isResending ? "Resending..." : "Resend Code"}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSignUpSuccess(false)}>
                                    Back to Registration
                                </Button>
                            </div>
                        </CardContent>
                    ) : (
                        <>
                            <CardContent className="space-y-4 pt-4 pb-6">
                                {planName && (
                                    <Alert className="border-[#FF0000]/20 bg-[#FF0000]/5 border-l-4">
                                        <Crown className="h-4 w-4 text-[#FF0000]" />
                                        <AlertTitle className="text-[#FF0000] font-bold">Plan: {planName}</AlertTitle>
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
                                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 000-0000"
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

                                <div className="relative w-full py-4">
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
                                    className="w-full h-11 bg-background/50 border-border/50 hover:bg-background transition-all"
                                    onClick={() => signInWithGoogle()}
                                    disabled={isLoading}
                                >
                                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                    </svg>
                                    Signup with Google
                                </Button>
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

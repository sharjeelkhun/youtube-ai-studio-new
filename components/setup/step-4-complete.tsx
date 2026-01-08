"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Sparkles, Check, ArrowRight, Loader2 } from "lucide-react"

interface Step4CompleteProps {
    onBack: () => void
}

export function Step4Complete({ onBack }: Step4CompleteProps) {
    const { completeOnboarding } = useOnboarding()
    const router = useRouter()
    const [isCompleting, setIsCompleting] = useState(false)

    const handleComplete = async () => {
        setIsCompleting(true)

        try {
            await completeOnboarding()

            // After server state is updated, we do a hard redirect to /dashboard
            // This ensures middleware and RSC cache are fully cleared
            setTimeout(() => {
                window.location.href = "/dashboard"
            }, 1500)
        } catch (err) {
            console.error("Error completing onboarding:", err)
            setIsCompleting(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">You're All Set!</h2>
                <p className="text-muted-foreground text-lg">
                    Your account is configured and ready to use
                </p>
            </div>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Setup Complete</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Plan Selected</p>
                                    <p className="text-sm text-muted-foreground">Your subscription is ready</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">AI Provider Connected</p>
                                    <p className="text-sm text-muted-foreground">Ready to generate suggestions</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">YouTube Channel Linked</p>
                                    <p className="text-sm text-muted-foreground">Analyzing your content</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <h4 className="font-medium mb-2">What happens next?</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Access your personalized dashboard</li>
                            <li>• Get AI-powered video suggestions</li>
                            <li>• View detailed analytics and insights</li>
                            <li>• Optimize your content for better reach</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="outline" size="lg">
                    Back
                </Button>
                <Button onClick={handleComplete} disabled={isCompleting} size="lg" className="min-w-[200px]">
                    {isCompleting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Finalizing...
                        </>
                    ) : (
                        <>
                            Go to Dashboard
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

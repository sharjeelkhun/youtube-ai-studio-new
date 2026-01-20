"use client"

import { useState, useEffect } from "react"
import { Crown, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { PayPalButton } from "@/components/dashboard/billing/paypal-button"
import { useSubscription } from "@/contexts/subscription-context"
import { toast } from "sonner"

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

import { PLANS as CONFIG_PLANS } from "@/lib/pricing"

const PLANS = {
    Starter: {
        ...CONFIG_PLANS.find(p => p.id === 'starter')!,
        id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_STARTER || "starter",
    },
    Professional: {
        ...CONFIG_PLANS.find(p => p.id === 'professional')!,
        id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PROFESSIONAL || "professional",
    },
    Enterprise: {
        ...CONFIG_PLANS.find(p => p.id === 'enterprise')!,
        id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE || "enterprise",
    },
}

interface Step1SelectPlanProps {
    onNext: () => void
}

export function Step1SelectPlan({ onNext }: Step1SelectPlanProps) {
    const { onboardingData, updateOnboardingData } = useOnboarding()
    const { subscription, planName, refreshSubscription, isLoading: isSubLoading } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<string>(onboardingData.selectedPlan || "Starter")
    const [isProcessing, setIsProcessing] = useState(false)

    // Ensure default plan is synced to context
    useEffect(() => {
        if (!onboardingData.selectedPlan) {
            updateOnboardingData({ selectedPlan: "Starter" })
        }
    }, [onboardingData.selectedPlan, updateOnboardingData])

    const handleSelectPlan = (planKey: string) => {
        setSelectedPlan(planKey)
        updateOnboardingData({ selectedPlan: planKey })

        // Update cookie for SubscriptionContext and billing page
        const planId = PLANS[planKey as keyof typeof PLANS].id
        if (planKey === 'Starter') {
            document.cookie = "pending_plan=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        } else {
            document.cookie = `pending_plan=${planId.toLowerCase()}; path=/; max-age=31536000` // 1 year
        }
    }

    const handleSubscriptionSuccess = async (subscriptionID: string, planKey: string) => {
        setIsProcessing(true)
        try {
            const plan = PLANS[planKey as keyof typeof PLANS]
            const response = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: subscriptionID,
                    planId: plan.id,
                    planName: planKey,
                }),
            })

            if (!response.ok) throw new Error('Failed to save subscription')

            await refreshSubscription()
            document.cookie = "pending_plan=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            toast.success("Subscription successful!")
            onNext()
        } catch (error) {
            console.error('Error saving subscription:', error)
            toast.error("Error saving subscription. Please contact support.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleNext = () => {
        if (selectedPlan === 'Starter' || planName.toLowerCase() === selectedPlan.toLowerCase()) {
            onNext()
        }
    }

    const isPaidPlan = selectedPlan !== "Starter"
    const hasActiveSubForSelected = planName.toLowerCase() === selectedPlan.toLowerCase()
    const showPayPal = isPaidPlan && !hasActiveSubForSelected
    const isSynced = onboardingData.selectedPlan === selectedPlan

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, components: "buttons", intent: "subscription", vault: true }}>
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
                    <p className="text-muted-foreground">Select the plan that best fits your needs</p>
                </div>

                {onboardingData.selectedPlan && !isPaidPlan && (
                    <Alert className="border-primary/20 bg-primary/5">
                        <Crown className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary">Plan Pre-Selected</AlertTitle>
                        <AlertDescription className="text-sm">
                            You've already selected the <strong>{onboardingData.selectedPlan}</strong> plan. You can change it below if needed.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(PLANS).map(([key, plan]) => (
                        <Card
                            key={key}
                            className={`relative cursor-pointer transition-all hover:shadow-lg ${selectedPlan === key ? "ring-2 ring-primary shadow-lg" : ""
                                }`}
                            onClick={() => handleSelectPlan(key)}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
                            )}
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg">
                                    {plan.name}
                                    {selectedPlan === key && (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                    {plan.price !== "Free" && <span className="text-muted-foreground">/month</span>}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start text-sm">
                                            <Check className="h-4 w-4 text-primary mr-2 mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 pt-6 border-t">
                    {showPayPal ? (
                        <div className="w-full max-w-md space-y-4">
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium">Complete your {selectedPlan} subscription</p>
                                <p className="text-xs text-muted-foreground">You will be redirected back to complete the setup after payment.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                {isProcessing ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2">Processing...</span>
                                    </div>
                                ) : (
                                    <PayPalButton
                                        planId={PLANS[selectedPlan as keyof typeof PLANS].id}
                                        planKey={selectedPlan}
                                        onSuccess={handleSubscriptionSuccess}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end w-full">
                            <Button
                                onClick={handleNext}
                                disabled={!selectedPlan || isSubLoading || isProcessing || !isSynced}
                                size="lg"
                                className="min-w-[150px]"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    "Continue"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </PayPalScriptProvider>
    )
}

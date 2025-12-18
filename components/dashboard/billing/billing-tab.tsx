"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { PayPalButton } from "./paypal-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"

// Get PayPal configuration from environment variables
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test"
const PAYPAL_MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE || "sandbox" // 'sandbox' or 'live'

// PayPal Plan IDs from environment variables
const PAYPAL_PLAN_IDS = {
    starter: process.env.NEXT_PUBLIC_PAYPAL_PLAN_STARTER || "P-STARTER-ID",
    professional: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PROFESSIONAL || "P-PROFESSIONAL-ID",
    enterprise: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE || "P-ENTERPRISE-ID",
}

const PLANS = {
    Starter: {
        id: PAYPAL_PLAN_IDS.starter,
        name: "Starter",
        price: "Free",
        features: ["Sync last 5–10 videos", "1 AI insight per video", "Basic title & description rewrite", "1 AI-generated thumbnail", "Ads outside core workflow", "Email Support"],
    },
    Professional: {
        id: PAYPAL_PLAN_IDS.professional,
        name: "Professional",
        price: "$49",
        features: ["Full channel sync & analysis", "Unlimited AI insights per video", "Multiple AI suggestions for titles, descriptions, and tags", "Thumbnail guidance & A/B testing", "Competitor analysis & pattern insights", "Priority Support", "Optional: use your own OpenAI/Gemini API key", "No ads"],
    },
    Enterprise: {
        id: PAYPAL_PLAN_IDS.enterprise,
        name: "Enterprise",
        price: "$99",
        features: ["Custom analytics dashboard", "Full AI insights & suggestions across all videos", "Advanced SEO & competitor intelligence", "Dedicated account manager", "Competitor analysis & pattern insights", "Priority Support", "API Access", "Full control over AI models & integrations", "No ads"],
    },
}

export default function BillingTab() {
    const searchParams = useSearchParams()
    const urlPlan = searchParams?.get('plan') || null
    const { subscription, payments, planName, isLoading, isPro, isEnterprise, refreshSubscription } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

    // Auto-select plan from URL parameter
    useEffect(() => {
        if (urlPlan && ['Starter', 'Professional', 'Enterprise'].includes(urlPlan.charAt(0).toUpperCase() + urlPlan.slice(1))) {
            const capitalizedPlan = urlPlan.charAt(0).toUpperCase() + urlPlan.slice(1)
            setSelectedPlan(capitalizedPlan)
        }
    }, [urlPlan])

    const handleSubscriptionSuccess = async (subscriptionID: string, planKey: string) => {
        try {
            // Get the plan details
            const plan = PLANS[planKey as keyof typeof PLANS]

            // Save subscription to database
            const response = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: subscriptionID,
                    planId: plan.id,
                    planName: planKey,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('API Error:', errorData)
                throw new Error(errorData.error || 'Failed to save subscription')
            }

            // Refresh subscription data
            await refreshSubscription()

            // Redirect to dashboard with success message
            window.location.href = '/dashboard?subscription=success&plan=' + planKey
        } catch (error) {
            console.error('Error saving subscription:', error)
            alert('Payment successful but there was an error saving your subscription. Please contact support.')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const isConfigured = PAYPAL_CLIENT_ID !== "test" &&
        PAYPAL_PLAN_IDS.starter !== "P-STARTER-ID" &&
        PAYPAL_PLAN_IDS.professional !== "P-PROFESSIONAL-ID" &&
        PAYPAL_PLAN_IDS.enterprise !== "P-ENTERPRISE-ID"

    return (
        <PayPalScriptProvider
            options={{
                clientId: PAYPAL_CLIENT_ID,
                components: "buttons",
                intent: "subscription",
                vault: true
            }}
        >
            <div className="space-y-6">
                {!isConfigured && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            PayPal is not configured. Please set up your PayPal credentials in environment variables.
                            See <code>PAYPAL_SETUP.md</code> for instructions.
                        </AlertDescription>
                    </Alert>
                )}

                {urlPlan && (
                    <Alert className="border-[#FF0000]/20 bg-[#FF0000]/5">
                        <Sparkles className="h-4 w-4 text-[#FF0000]" />
                        <AlertTitle className="text-[#FF0000]">Complete your {urlPlan.charAt(0).toUpperCase() + urlPlan.slice(1)} subscription</AlertTitle>
                        <AlertDescription>
                            Click the PayPal button below to complete your subscription
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{planName}</div>
                            <p className="text-xs text-muted-foreground">
                                {subscription?.status === 'active' ? 'Active subscription' : 'Free tier'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={subscription?.status === 'active' ? "default" : "secondary"}>
                                {subscription?.status?.toUpperCase() || 'FREE'}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const isCurrent = planName === key
                        return (
                            <Card key={key} className={`flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {plan.name}
                                        {isCurrent && <Badge>Current</Badge>}
                                    </CardTitle>
                                    <CardDescription>
                                        <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                                        {plan.price !== "Free" && <span className="text-muted-foreground">/month</span>}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center">
                                                <Check className="mr-2 h-4 w-4 text-primary" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {isCurrent ? (
                                        <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                                    ) : plan.price === "Free" ? (
                                        <Button className="w-full" variant="outline" disabled>Downgrade</Button>
                                    ) : (
                                        <div className="w-full space-y-2">
                                            {selectedPlan === key ? (
                                                <div className="w-full">
                                                    <PayPalButton
                                                        planId={plan.id}
                                                        planKey={key}
                                                        onSuccess={handleSubscriptionSuccess}
                                                    />
                                                    <Button variant="ghost" size="sm" className="w-full text-xs mt-2" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button className="w-full" onClick={() => setSelectedPlan(key)}>Upgrade</Button>
                                            )}
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                        <CardDescription>View your recent payments and invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>No payment history</AlertTitle>
                                <AlertDescription>
                                    You haven't made any payments yet.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                                        <div>
                                            <p className="font-medium">{payment.currency} ${payment.amount}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(payment.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                                            {payment.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PayPalScriptProvider>
    )
}

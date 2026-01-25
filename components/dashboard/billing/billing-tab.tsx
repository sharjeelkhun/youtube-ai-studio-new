"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { PayPalButton } from "./paypal-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// Get PayPal configuration from environment variables
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

// PayPal Plan IDs from environment variables
const PAYPAL_PLAN_IDS = {
    starter: process.env.NEXT_PUBLIC_PAYPAL_PLAN_STARTER || "",
    professional: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PROFESSIONAL || "",
    enterprise: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE || "",
}



import { PLANS as CONFIG_PLANS } from "@/lib/pricing"

export const PLANS = {
    Starter: {
        ...CONFIG_PLANS.find(p => p.id === 'starter')!,
        id: PAYPAL_PLAN_IDS.starter,
    },
    Professional: {
        ...CONFIG_PLANS.find(p => p.id === 'professional')!,
        id: PAYPAL_PLAN_IDS.professional,
    },
    Enterprise: {
        ...CONFIG_PLANS.find(p => p.id === 'enterprise')!,
        id: PAYPAL_PLAN_IDS.enterprise,
    },
}

// Plan hierarchy level for comparison
export const PLAN_LEVELS = {
    'Starter': 0,
    'Professional': 1,
    'Enterprise': 2
}

export default function BillingTab() {
    const searchParams = useSearchParams()
    const urlPlan = searchParams?.get('plan') || null
    const { subscription, payments, planName, isLoading, refreshSubscription } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Auto-select plan from URL parameter
    useEffect(() => {
        if (urlPlan && ['Starter', 'Professional', 'Enterprise'].includes(urlPlan.charAt(0).toUpperCase() + urlPlan.slice(1))) {
            const capitalizedPlan = urlPlan.charAt(0).toUpperCase() + urlPlan.slice(1)
            setSelectedPlan(capitalizedPlan)
        }
    }, [urlPlan])

    const handleSubscriptionSuccess = async (subscriptionID: string, planKey: string) => {
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
            setSelectedPlan(null)
            document.cookie = "pending_plan=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            toast.success("Plan Updated Successfully!")
        } catch (error) {
            console.error('Error saving subscription:', error)
            toast.error("Error saving subscription. Please contact support.")
        }
    }

    const isConfigured = PAYPAL_CLIENT_ID !== "" && PAYPAL_PLAN_IDS.professional !== ""

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const currentLevel = PLAN_LEVELS[planName as keyof typeof PLAN_LEVELS] || 0

    // Calculate days remaining
    const daysRemaining = subscription?.current_period_end
        ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0

    const handleDowngrade = () => setShowDowngradeDialog(true)

    const confirmDowngrade = async () => {
        try {
            setIsCancelling(true)
            const response = await fetch('/api/subscriptions/cancel', { method: 'POST' })
            if (!response.ok) throw new Error("Failed to cancel")

            toast.success("Subscription Cancelled")
            await refreshSubscription()
            setShowDowngradeDialog(false)
        } catch (error: any) {
            console.error("Cancellation error:", error)
            toast.error("Cancellation Failed")
        } finally {
            setIsCancelling(false)
        }
    }

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, components: "buttons", intent: "subscription", vault: true }}>
            <div className="space-y-6">
                {!isConfigured && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>PayPal is not configured. Check environment variables: NEXT_PUBLIC_PAYPAL_CLIENT_ID, NEXT_PUBLIC_PAYPAL_PLAN_PROFESSIONAL.</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    toast.promise(refreshSubscription(true), {
                                        loading: 'Syncing with PayPal...',
                                        success: 'Dashboard updated!',
                                        error: 'Sync failed'
                                    });
                                }}
                                title="Sync with PayPal"
                            >
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{planName}</div>
                            <p className="text-xs text-muted-foreground mb-4">
                                {subscription?.status === 'active' ? (
                                    <>
                                        {daysRemaining} days remaining in current period
                                        <br />
                                        Renews on {new Date(subscription.current_period_end!).toLocaleDateString()}
                                    </>
                                ) :
                                    subscription?.status === 'cancelled' ? `Ends on ${new Date(subscription.current_period_end!).toLocaleDateString()}` :
                                        'Free tier'}
                            </p>
                            {subscription?.status === 'active' && planName !== 'Starter' && (
                                <div className="space-y-4 mt-4 pt-4 border-t">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="auto-renew"
                                            checked={!subscription?.cancel_at_period_end}
                                            onCheckedChange={async (checked) => {
                                                await fetch('/api/subscriptions/toggle-renew', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ cancelAtPeriodEnd: !checked })
                                                })
                                                await refreshSubscription()
                                            }}
                                        />
                                        <Label htmlFor="auto-renew" className="text-sm font-medium">Auto-renew</Label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 p-0 h-auto font-normal flex justify-start pl-0"
                                        onClick={async () => {
                                            if (confirm("Cancel this subscription immediately? You will still have access until the end of your billing period.")) {
                                                await fetch('/api/subscriptions/cancel', { method: 'POST' });
                                                await refreshSubscription();
                                            }
                                        }}
                                    >
                                        Cancel Subscription
                                    </Button>
                                </div>
                            )}
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

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PayPal ID</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[10px] font-mono break-all text-muted-foreground uppercase">
                                {subscription?.paypal_subscription_id || 'None'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const planLevel = PLAN_LEVELS[key as keyof typeof PLAN_LEVELS]
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
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />{f}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {isCurrent ? (
                                        subscription?.status === 'cancelled' ? (
                                            <div className="w-full">
                                                <PayPalButton planId={plan.id} planKey={key} onSuccess={handleSubscriptionSuccess} />
                                            </div>
                                        ) : (
                                            <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                                        )
                                    ) : key === 'Starter' ? (
                                        <Button className="w-full" variant="outline" onClick={handleDowngrade} disabled={subscription?.status === 'cancelled'}>
                                            {subscription?.status === 'cancelled' ? 'Scheduled to end' : 'Downgrade'}
                                        </Button>
                                    ) : (
                                        <div className="w-full space-y-2">
                                            {selectedPlan === key ? (
                                                <div className="w-full">
                                                    <PayPalButton
                                                        planId={plan.id}
                                                        planKey={key}
                                                        onSuccess={handleSubscriptionSuccess}
                                                        existingSubscriptionId={subscription?.status === 'active' ? subscription.paypal_subscription_id : null}
                                                    />
                                                    <Button variant="ghost" size="sm" className="w-full text-xs mt-2" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button className="w-full" onClick={() => setSelectedPlan(key)}>
                                                    {planLevel < currentLevel ? 'Switch to this' : 'Upgrade'}
                                                </Button>
                                            )}
                                            {planLevel !== currentLevel && (
                                                <p className="text-[10px] text-center text-muted-foreground mt-1">PayPal auto-calculates proration</p>
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
                        <CardDescription>View your recent payments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>No payment history</AlertTitle></Alert>
                        ) : (
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{payment.plan_name}</p>
                                                <Badge variant="outline" className="text-[10px] h-5">{payment.status?.toUpperCase()}</Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {payment.period_start ? new Date(payment.period_start).toLocaleDateString() : 'N/A'} - {payment.period_end ? new Date(payment.period_end).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{payment.currency} ${payment.amount}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Downgrade to Starter?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to return to the Free Starter plan?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDowngrade(); }} className="bg-destructive" disabled={isCancelling}>
                            {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Downgrade"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PayPalScriptProvider>
    )
}

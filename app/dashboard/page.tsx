"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/contexts/session-context'
import { useSubscription } from '@/contexts/subscription-context'
import DashboardContent from '@/components/dashboard/dashboard-content'
import { Loader2, Check, Crown, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { PayPalButton } from '@/components/dashboard/billing/paypal-button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PLANS } from '@/components/dashboard/billing/billing-tab'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

export default function DashboardPage() {
  const { session, isLoading: sessionLoading } = useSession()
  const { isCheckoutRequired, isLoading: subLoading, refreshSubscription, planName } = useSubscription()
  const [isSuccess, setIsSuccess] = useState(false)
  const [successTimeout, setSuccessTimeout] = useState(false)

  const isLoading = sessionLoading || subLoading

  // Get plan details for checkout
  const selectedPlanKeyRaw = (typeof document !== 'undefined' && document.cookie.split('; ').find(row => row.startsWith('pending_plan='))?.split('=')[1]) || 'Professional'
  const selectedPlanKey = selectedPlanKeyRaw.charAt(0).toUpperCase() + selectedPlanKeyRaw.slice(1)
  const plan = PLANS[selectedPlanKey as keyof typeof PLANS] || PLANS.Professional

  // Safety timer to prevent being stuck on success screen forever
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess) {
      timer = setTimeout(() => {
        setSuccessTimeout(true);
      }, 15000); // 15 seconds fallback
    }
    return () => clearTimeout(timer);
  }, [isSuccess]);

  const handleSubscriptionSuccess = async (subscriptionID: string, planKey: string) => {
    console.log("[DASHBOARD-PAGE] handleSubscriptionSuccess triggered for:", planKey, subscriptionID);
    setIsSuccess(true)

    // Manually clear the cookie immediately
    document.cookie = "pending_plan=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
    console.log("[DASHBOARD-PAGE] Cookie cleared");

    try {
      console.log("[DASHBOARD-PAGE] Saving subscription to DB...");
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionID,
          planId: PLANS[planKey as keyof typeof PLANS].id,
          planName: planKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save subscription')
      }

      console.log("[DASHBOARD-PAGE] Subscription saved. Refreshing...");
      await refreshSubscription()
      console.log("[DASHBOARD-PAGE] Refresh complete. Current plan:", planName);
    } catch (err: any) {
      console.error("[DASHBOARD-PAGE] Error saving or refreshing subscription:", err);
    } finally {
      // Small delay for smooth transition
      setTimeout(() => {
        setIsSuccess(false)
        console.log("[DASHBOARD-PAGE] Success state cleared");
      }, 1500);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="space-y-4 w-full max-w-md px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing your subscription status...</p>
          </div>
        </div>
      </div>
    )
  }

  // If we just succeeded, show the success state bridge
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="flex flex-col border-primary shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-500 overflow-hidden">
          <CardContent className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-bounce">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold italic">Unlocking your Studio...</CardTitle>
            <CardDescription className="text-base font-medium">
              Payment confirmed! We're finalising your subscription.
              <br />Your dashboard will appear in a moment.
            </CardDescription>
            <div className="pt-4">
              {successTimeout ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Taking longer than expected? You can try proceeding manually.</p>
                  <Button onClick={() => setIsSuccess(false)} className="group">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If gated, show the checkout card
  if (isCheckoutRequired) {
    return (
      <PayPalScriptProvider
        options={{
          clientId: PAYPAL_CLIENT_ID,
          components: "buttons",
          intent: "subscription",
          vault: true
        }}
      >
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="flex flex-col border-primary shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-500 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 text-center space-y-2 py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Finalize your {plan.name} Plan
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Subscribe to unlock your full AI-powered dashboard
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                {plan.price !== "Free" && <span className="text-muted-foreground font-medium ml-1">/month</span>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-8">
              <ul className="space-y-4 text-sm">
                {plan.features.slice(0, 5).map((feature: string, i: number) => (
                  <li key={i} className="flex items-center font-medium">
                    <Check className="mr-3 h-5 w-5 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-6 pb-8 bg-muted/30 border-t border-border">
              <div className="w-full px-4 text-foreground">
                <PayPalButton
                  planId={plan.id}
                  planKey={selectedPlanKey}
                  onSuccess={handleSubscriptionSuccess}
                />
              </div>
              <p className="text-[11px] text-center text-muted-foreground leading-snug px-8 italic text-balance">
                Secure checkout via PayPal. Cancel anytime from settings after your dashboard is unlocked.
              </p>
            </CardFooter>
          </Card>
        </div>
      </PayPalScriptProvider>
    )
  }

  // Standard locked/unlocked content
  return (
    <div className="min-h-screen">
      <DashboardContent
        userId={session?.user?.id || undefined}
        email={session?.user?.email || ''}
        channelId={session?.user?.user_metadata?.channel_id}
      />
    </div>
  )
}

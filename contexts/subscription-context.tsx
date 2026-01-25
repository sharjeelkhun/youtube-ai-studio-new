"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Payment = Database['public']['Tables']['payments']['Row']

interface SubscriptionContextType {
    subscription: Subscription | null
    payments: Payment[]
    isLoading: boolean
    isPro: boolean
    isEnterprise: boolean
    planName: string
    isCheckoutRequired: boolean
    setCheckoutRequired: (required: boolean) => void
    refreshSubscription: (forceSync?: boolean) => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    subscription: null,
    payments: [],
    isLoading: true,
    isPro: false,
    isEnterprise: false,
    planName: 'Starter',
    isCheckoutRequired: false,
    setCheckoutRequired: () => { },
    refreshSubscription: async () => { },
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCheckoutRequired, setCheckoutRequired] = useState(false)

    const refreshSubscription = async (forceSync = false) => {
        console.log("[SUB-CONTEXT] refreshSubscription triggered. forceSync:", forceSync);
        if (!user) {
            setSubscription(null)
            setPayments([])
            setIsLoading(false)
            setCheckoutRequired(false)
            return
        }

        try {
            // Fetch active subscription
            console.log("[SUB-CONTEXT] Fetching sub from DB...");
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (subError) console.error("[SUB-CONTEXT] Sub query error:", subError);
            console.log("[SUB-CONTEXT] Raw sub from DB:", subData);
            if (subData) {
                const sub = subData as Subscription;
                console.log("[SUB-CONTEXT] Sub status:", sub.status, "ID:", sub.paypal_subscription_id);
            }

            let activeSub: Subscription | null = null;
            if (subData) {
                const sub = subData as Subscription;
                const status = sub.status;
                const isValid =
                    (['active', 'trialing'] as string[]).includes(status) ||
                    (status === 'cancelled' && sub.current_period_end && new Date(sub.current_period_end) > new Date())

                if (isValid) {
                    activeSub = sub;
                    console.log("[SUB-CONTEXT] Active sub confirmed:", activeSub.plan_id);
                } else {
                    console.log("[SUB-CONTEXT] Sub found but invalid/expired status:", status);
                }
            }
            setSubscription(activeSub)

            // Sync with cookie to check for forced checkout
            const cookies = document.cookie.split('; ');
            const pendingPlanCookie = cookies.find(row => row.startsWith('pending_plan='));
            const pendingPlanValue = pendingPlanCookie ? pendingPlanCookie.split('=')[1] : null;

            console.log("[SUB-CONTEXT] Cookie check. pending_plan:", pendingPlanValue);

            // If we have no active sub but a pending PAID plan, checkout is required
            if (!activeSub && pendingPlanValue && ['professional', 'enterprise'].includes(pendingPlanValue.toLowerCase())) {
                console.log("[SUB-CONTEXT] Gating user: checkout required");
                setCheckoutRequired(true);
            } else {
                console.log("[SUB-CONTEXT] Unlocking user: no gated plan or active sub present");
                setCheckoutRequired(false);
            }

            // Fetch payment history
            console.log("[SUB-CONTEXT] Fetching payment history...");
            const { data: payData, error: payError } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (payError) {
                console.error("[SUB-CONTEXT] Payments query error:", payError)
            } else {
                console.log("[SUB-CONTEXT] Payments received:", payData?.length || 0);
                setPayments((payData as Payment[]) || [])
            }

            // AUTO-SYNC LOGIC:
            if (activeSub && activeSub.status === 'active' && activeSub.current_period_end) {
                const now = new Date();
                const periodEnd = new Date(activeSub.current_period_end);

                if (forceSync || now > periodEnd) {
                    console.log("[SUB-CONTEXT] Triggering sync with PayPal...");
                    const res = await fetch('/api/subscriptions/sync', { method: 'POST' });
                    const data = await res.json();

                    if (data.success) {
                        console.log("[SUB-CONTEXT] Sync successful.");
                        if (data.subscription) {
                            setSubscription(data.subscription as Subscription);
                        }

                        // Re-fetch payments to get the newly recorded ones
                        const { data: updatedPayData } = await supabase
                            .from('payments')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })
                            .limit(10);

                        if (updatedPayData) setPayments(updatedPayData as Payment[]);
                    }
                }
            }
        } catch (error) {
            console.error('[SUB-CONTEXT] Error in refreshSubscription:', error)
        } finally {
            setIsLoading(false)
            console.log("[SUB-CONTEXT] Loading state: false");
        }
    }

    useEffect(() => {
        refreshSubscription()
    }, [user])

    const planId = subscription?.plan_id?.toLowerCase()
    const isPro = planId === 'professional' || planId === 'enterprise'
    const isEnterprise = planId === 'enterprise'

    let planName = 'Starter'
    if (planId === 'professional') planName = 'Professional'
    if (planId === 'enterprise') planName = 'Enterprise'

    return (
        <SubscriptionContext.Provider
            value={{
                subscription,
                payments,
                isLoading,
                isPro,
                isEnterprise,
                planName,
                isCheckoutRequired,
                setCheckoutRequired,
                refreshSubscription,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    )
}

export const useSubscription = () => useContext(SubscriptionContext)

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
    refreshSubscription: () => Promise<void>
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

    const refreshSubscription = async () => {
        console.log("[SUB-CONTEXT] refreshSubscription triggered for user:", user?.id);
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
                console.log("[SUB-CONTEXT] Sub status:", subData.status, "ID:", subData.paypal_subscription_id);
            }

            let activeSub: Subscription | null = null;
            if (subData) {
                const isValid =
                    ['active', 'trialing'].includes(subData.status) ||
                    (subData.status === 'cancelled' && subData.current_period_end && new Date(subData.current_period_end) > new Date())

                if (isValid) {
                    activeSub = subData;
                    console.log("[SUB-CONTEXT] Active sub confirmed:", activeSub?.plan_id);
                } else {
                    console.log("[SUB-CONTEXT] Sub found but invalid/expired status:", subData.status);
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
                setPayments(payData || [])
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

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
    refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    subscription: null,
    payments: [],
    isLoading: true,
    isPro: false,
    isEnterprise: false,
    planName: 'Starter',
    refreshSubscription: async () => { },
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshSubscription = async () => {
        if (!user) {
            setSubscription(null)
            setPayments([])
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)

            // Fetch active subscription
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'trialing'])
                .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows

            if (subError) {
                console.error('Error fetching subscription:', subError)
            } else {
                setSubscription(subData)
            }

            // Fetch payment history
            const { data: payData, error: payError } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (payError) {
                console.error('Error fetching payments:', payError)
            } else {
                setPayments(payData || [])
            }
        } catch (error) {
            console.error('Error in refreshSubscription:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshSubscription()
    }, [user])

    const planId = subscription?.plan_id
    const isPro = planId === 'professional' || planId === 'enterprise' // Enterprise includes Pro features
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
                refreshSubscription,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    )
}

export const useSubscription = () => useContext(SubscriptionContext)

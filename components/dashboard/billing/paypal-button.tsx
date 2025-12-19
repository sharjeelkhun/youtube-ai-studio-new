"use client"

import { useState, useEffect } from "react"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { toast } from "sonner"

interface PayPalButtonProps {
    planId: string
    planKey: string
    onSuccess: (subscriptionID: string, planKey: string) => void
    startDate?: string
    existingSubscriptionId?: string | null
}

export function PayPalButton({ planId, planKey, onSuccess, startDate, existingSubscriptionId }: PayPalButtonProps) {
    const [{ options }, dispatch] = usePayPalScriptReducer()

    useEffect(() => {
        dispatch({
            type: "resetOptions",
            value: {
                ...options,
                intent: "subscription",
            },
        } as any)
    }, [planId])

    return (
        <PayPalButtons
            style={{
                shape: "rect",
                color: "gold",
                layout: "horizontal",
                label: "subscribe",
                tagline: false,
                height: 40
            }}
            createSubscription={async (data, actions) => {
                // If we have an existing sub, try to update it (prorated)
                if (existingSubscriptionId) {
                    try {
                        console.log("[PAYPAL] Attempting plan update:", existingSubscriptionId);
                        return await actions.subscription.revise(existingSubscriptionId, {
                            plan_id: planId
                        });
                    } catch (err) {
                        console.warn("[PAYPAL] Update blocked, starting fresh checkout instead.");
                    }
                }

                // Fallback: Just create a new subscription
                const subOptions: any = { plan_id: planId }
                if (startDate) subOptions.start_time = startDate
                return actions.subscription.create(subOptions)
            }}
            onApprove={async (data, actions) => {
                if (data.subscriptionID) {
                    onSuccess(data.subscriptionID, planKey)
                }
            }}
            onError={(err) => {
                console.error("[PAYPAL] Checkout Error:", err);
                toast.error("PayPal checkout failed. If you have an active plan, please wait a moment or try cancelling it first.");
            }}
        />
    )
}

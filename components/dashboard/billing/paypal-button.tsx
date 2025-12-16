"use client"

import { useEffect } from "react"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"

interface PayPalButtonProps {
    planId: string
    planKey: string
    onSuccess: (subscriptionID: string, planKey: string) => void
}

export function PayPalButton({ planId, planKey, onSuccess }: PayPalButtonProps) {
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
                layout: "vertical",
                label: "subscribe",
            }}
            createSubscription={(data, actions) => {
                return actions.subscription.create({
                    plan_id: planId,
                })
            }}
            onApprove={async (data, actions) => {
                if (data.subscriptionID) {
                    onSuccess(data.subscriptionID, planKey)
                }
            }}
        />
    )
}

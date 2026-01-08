"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "./session-context"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface OnboardingData {
    selectedPlan?: string
    aiProvider?: string
    aiApiKey?: string
    channelConnected?: boolean
}

interface OnboardingContextType {
    currentStep: number
    onboardingData: OnboardingData
    isComplete: boolean
    isLoading: boolean
    setCurrentStep: (step: number) => void
    updateOnboardingData: (data: Partial<OnboardingData>) => void
    completeStep: (step: number) => Promise<void>
    completeOnboarding: () => Promise<void>
    canProceedToStep: (step: number) => boolean
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const { session } = useSession()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
    const [isComplete, setIsComplete] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load onboarding state from database
    useEffect(() => {
        const loadOnboardingState = async () => {
            if (!session?.user?.id) {
                setIsLoading(false)
                return
            }

            try {
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("onboarding_completed, onboarding_step, onboarding_data")
                    .eq("id", session.user.id)
                    .single()

                if (error) {
                    console.error("Error loading onboarding state:", error)
                    return
                }

                if (profile) {
                    setIsComplete(profile.onboarding_completed || false)
                    setCurrentStep(profile.onboarding_step || 1)
                    setOnboardingData((profile.onboarding_data as OnboardingData) || {})
                }
            } catch (err) {
                console.error("Error in loadOnboardingState:", err)
            } finally {
                setIsLoading(false)
            }
        }

        loadOnboardingState()
    }, [session?.user?.id])

    const updateOnboardingData = (data: Partial<OnboardingData>) => {
        setOnboardingData((prev) => ({ ...prev, ...data }))
    }

    const completeStep = async (step: number) => {
        if (!session?.user?.id) return

        const nextStep = step + 1

        try {
            const response = await fetch("/api/onboarding/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: nextStep,
                    data: onboardingData,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update onboarding step")
            }

            setCurrentStep(nextStep)
        } catch (err) {
            console.error("Error in completeStep:", err)
            throw err
        }
    }

    const completeOnboarding = async () => {
        if (!session?.user?.id) return

        try {
            const response = await fetch("/api/onboarding/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    completed: true,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to complete onboarding")
            }

            // Sync local state
            setIsComplete(true)

            // Clear router cache to ensure middleware sees the update
            router.refresh()
        } catch (err) {
            console.error("Error in completeOnboarding:", err)
            throw err
        }
    }

    const canProceedToStep = (step: number): boolean => {
        // Can always access step 1
        if (step === 1) return true

        // Can access step 2 if a plan is selected (or if user is already on step 2+)
        if (step === 2) return !!onboardingData.selectedPlan

        // Can access step 3 if a plan is selected (even if AI is skipped)
        if (step === 3) return !!onboardingData.selectedPlan

        // Can access step 4 if a plan is selected
        if (step === 4) return !!onboardingData.selectedPlan

        return false
    }

    const value: OnboardingContextType = {
        currentStep,
        onboardingData,
        isComplete,
        isLoading,
        setCurrentStep,
        updateOnboardingData,
        completeStep,
        completeOnboarding,
        canProceedToStep,
    }

    return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider")
    }
    return context
}

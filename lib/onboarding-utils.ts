import { supabase } from "@/lib/supabase/client"

export interface OnboardingStatus {
    isComplete: boolean
    currentStep: number
    onboardingData: any
}

/**
 * Check if a user has completed onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("onboarding_completed, onboarding_step, onboarding_data")
            .eq("id", userId)
            .single()

        if (error || !data) {
            console.error("Error checking onboarding status:", error)
            return null
        }

        return {
            isComplete: data.onboarding_completed || false,
            currentStep: data.onboarding_step || 1,
            onboardingData: data.onboarding_data || {},
        }
    } catch (err) {
        console.error("Error in checkOnboardingStatus:", err)
        return null
    }
}

/**
 * Validate if a step is complete based on onboarding data
 */
export function validateStepCompletion(step: number, onboardingData: any): boolean {
    switch (step) {
        case 1:
            return !!onboardingData.selectedPlan
        case 2:
            return !!onboardingData.aiProvider && !!onboardingData.aiApiKey
        case 3:
            return !!onboardingData.channelConnected
        case 4:
            return true // Final step is always accessible if we reach it
        default:
            return false
    }
}

/**
 * Get the next required step based on current onboarding data
 */
export function getNextRequiredStep(onboardingData: any): number {
    if (!onboardingData.selectedPlan) return 1
    if (!onboardingData.aiProvider || !onboardingData.aiApiKey) return 2
    if (!onboardingData.channelConnected) return 3
    return 4
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentStep: number, totalSteps: number = 4): number {
    return Math.round((currentStep / totalSteps) * 100)
}

/**
 * Get step title and description
 */
export function getStepInfo(step: number): { title: string; description: string } {
    const steps = {
        1: { title: "Select Plan", description: "Choose your subscription" },
        2: { title: "Connect AI", description: "Configure AI provider" },
        3: { title: "Connect Channel", description: "Link YouTube channel" },
        4: { title: "Complete", description: "Finish setup" },
    }

    return steps[step as keyof typeof steps] || { title: "Unknown", description: "" }
}

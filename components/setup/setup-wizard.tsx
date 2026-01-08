"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { StepIndicator } from "./step-indicator"
import { Step1SelectPlan } from "./step-1-select-plan"
import { Step2ConnectAI } from "./step-2-connect-ai"
import { Step3ConnectChannel } from "./step-3-connect-channel"
import { Step4Complete } from "./step-4-complete"
import { Loader2 } from "lucide-react"

const STEPS = [
    { number: 1, title: "Select Plan", description: "Choose your subscription" },
    { number: 2, title: "Connect AI", description: "Configure AI provider" },
    { number: 3, title: "Connect Channel", description: "Link YouTube channel" },
    { number: 4, title: "Complete", description: "Finish setup" },
]

export function SetupWizard() {
    const router = useRouter()
    const { currentStep, setCurrentStep, isComplete, isLoading, completeStep, canProceedToStep } = useOnboarding()

    // Redirect to dashboard if onboarding is already complete
    useEffect(() => {
        if (!isLoading && isComplete) {
            router.push("/dashboard")
        }
    }, [isComplete, isLoading, router])

    // Prevent accessing steps that aren't unlocked yet
    useEffect(() => {
        if (!isLoading && !canProceedToStep(currentStep)) {
            // Find the first step that can be accessed
            for (let i = 1; i <= 4; i++) {
                if (canProceedToStep(i)) {
                    setCurrentStep(i)
                    break
                }
            }
        }
    }, [currentStep, isLoading, canProceedToStep, setCurrentStep])

    const handleNext = async () => {
        try {
            await completeStep(currentStep)
        } catch (err) {
            console.error("Error completing step:", err)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading your setup...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
            <div className="container max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-center mb-2">Welcome to YouTube AI Studio</h1>
                    <p className="text-center text-muted-foreground">Let's get your account set up in just a few steps</p>
                </div>

                <Card className="border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                    <CardContent className="pt-6">
                        <StepIndicator
                            currentStep={currentStep}
                            totalSteps={STEPS.length}
                            steps={STEPS}
                            canProceedToStep={canProceedToStep}
                        />

                        <div className="mt-8">
                            {currentStep === 1 && <Step1SelectPlan onNext={handleNext} />}
                            {currentStep === 2 && <Step2ConnectAI onNext={handleNext} onBack={handleBack} />}
                            {currentStep === 3 && <Step3ConnectChannel onNext={handleNext} onBack={handleBack} />}
                            {currentStep === 4 && <Step4Complete onBack={handleBack} />}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

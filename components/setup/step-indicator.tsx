"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
    currentStep: number
    totalSteps: number
    steps: {
        number: number
        title: string
        description: string
    }[]
    canProceedToStep: (step: number) => boolean
}

export function StepIndicator({ currentStep, totalSteps, steps, canProceedToStep }: StepIndicatorProps) {
    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                </div>

                {/* Steps */}
                {steps.map((step) => {
                    const isComplete = currentStep > step.number
                    const isCurrent = currentStep === step.number
                    const isLocked = !canProceedToStep(step.number) && !isComplete && !isCurrent

                    return (
                        <div key={step.number} className="flex flex-col items-center flex-1">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                                    isComplete && "bg-primary border-primary text-primary-foreground",
                                    isCurrent && "bg-background border-primary text-primary ring-4 ring-primary/20",
                                    isLocked && "bg-muted border-border text-muted-foreground",
                                    !isComplete && !isCurrent && !isLocked && "bg-background border-border text-foreground"
                                )}
                            >
                                {isComplete ? <Check className="h-5 w-5" /> : step.number}
                            </div>

                            {/* Step Info */}
                            <div className="mt-3 text-center max-w-[120px]">
                                <p
                                    className={cn(
                                        "text-sm font-semibold transition-colors",
                                        isCurrent && "text-primary",
                                        isComplete && "text-foreground",
                                        isLocked && "text-muted-foreground"
                                    )}
                                >
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{step.description}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

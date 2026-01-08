import { SetupWizard } from "@/components/setup/setup-wizard"
import { OnboardingProvider } from "@/contexts/onboarding-context"

export default function SetupPage() {
    return (
        <OnboardingProvider>
            <SetupWizard />
        </OnboardingProvider>
    )
}

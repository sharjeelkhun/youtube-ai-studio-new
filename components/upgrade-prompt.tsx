"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, ArrowRight, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpgradePromptProps {
  feature: string
  description: string
  requiredPlan: string
  currentPlan: string
  icon?: React.ReactNode
  className?: string
}

export function UpgradePrompt({
  feature,
  description,
  requiredPlan,
  currentPlan,
  icon,
  className = ""
}: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/settings?tab=billing')
  }

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'professional':
        return 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
      case 'enterprise':
        return 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
      default:
        return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'professional':
        return '🚀'
      case 'enterprise':
        return '💎'
      default:
        return '⭐'
    }
  }

  return (
    <Card className={`relative overflow-hidden border-2 ${requiredPlan.toLowerCase() === 'professional' ? 'border-blue-200/50 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20' : 'border-yellow-200/50 bg-gradient-to-br from-yellow-50/30 to-orange-50/30 dark:from-yellow-950/20 dark:to-orange-950/20'} ${className}`}>
      {/* Premium background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-current to-transparent rounded-full transform -translate-x-12 translate-y-12"></div>
      </div>

      <CardHeader className="text-center pb-4 relative z-10">
        <div className="flex justify-center mb-3">
          <div className={`p-3 rounded-full ${requiredPlan.toLowerCase() === 'professional' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
            {icon || <Crown className={`h-6 w-6 ${requiredPlan.toLowerCase() === 'professional' ? 'text-blue-600' : 'text-yellow-600'}`} />}
          </div>
        </div>
        <CardTitle className="text-xl flex items-center justify-center gap-2 font-bold">
          <span className="text-2xl">{getPlanIcon(requiredPlan)}</span>
          {feature}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed max-w-md mx-auto">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1">
            Current: <span className="font-medium">{currentPlan}</span>
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge className={`text-xs px-3 py-1 bg-gradient-to-r ${getPlanColor(requiredPlan)} text-white border-0`}>
            {requiredPlan} Plan
          </Badge>
        </div>
        <Button
          onClick={handleUpgrade}
          size="lg"
          className={`w-full bg-gradient-to-r ${getPlanColor(requiredPlan)} text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base py-3`}
        >
          <Crown className="h-5 w-5 mr-2" />
          Upgrade to {requiredPlan}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Join 10,000+ creators who have upgraded their workflow
        </p>
      </CardContent>
    </Card>
  )
}

// Quick upgrade prompt for inline usage
interface QuickUpgradeProps {
  feature: string
  requiredPlan: string
  currentPlan: string
  className?: string
}

export function QuickUpgrade({
  feature,
  requiredPlan,
  currentPlan,
  className = ""
}: QuickUpgradeProps) {
  const router = useRouter()

  const getPlanEmoji = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'professional':
        return '🚀'
      case 'enterprise':
        return '💎'
      default:
        return '⭐'
    }
  }

  return (
    <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${requiredPlan.toLowerCase() === 'professional' ? 'from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/30' : 'from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200/30'} rounded-lg border border-dashed ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getPlanEmoji(requiredPlan)}</div>
        <div>
          <span className="text-sm font-semibold block">{feature}</span>
          <span className="text-xs text-muted-foreground">Unlock with {requiredPlan} plan</span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => router.push('/settings?tab=billing')}
        className={`bg-gradient-to-r ${requiredPlan.toLowerCase() === 'professional' ? 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' : 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'} text-white shadow-md hover:shadow-lg transition-all duration-200`}
      >
        Upgrade
      </Button>
    </div>
  )
}
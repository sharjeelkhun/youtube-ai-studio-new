"use client"

import { useFeatureAccess } from "@/lib/feature-access"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/contexts/subscription-context"

interface AdsBannerProps {
  className?: string
  position?: 'top' | 'bottom' | 'inline'
}

export function AdsBanner({ className = "", position = 'inline' }: AdsBannerProps) {
  const { shouldShowAds } = useFeatureAccess()
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()

  // Only check visibility, don't wait for loading - layout handles that
  if (!shouldShowAds() || isDismissed) {
    return null
  }

  const handleUpgrade = () => {
    router.push('/settings?tab=billing')
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (position === 'top' || position === 'bottom') {
    return (
      <div className={`w-full bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-pink-500/10 border-y border-blue-200/20 backdrop-blur-sm ${className}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  🚀 Level up your YouTube workflow
                </p>
                <p className="text-xs text-muted-foreground">
                  Remove ads • Unlock unlimited AI insights • Access premium features
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpgrade}
                className="text-xs border-blue-200/50 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Crown className="h-3 w-3 mr-1" />
                Go Premium
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Inline ad
  return (
    <Card className={`border-2 border-dashed border-blue-200/30 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">🎯 Unlock Premium Power</p>
              <p className="text-xs text-muted-foreground">
                Join 10,000+ creators using advanced AI tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Free Plan
            </Badge>
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Inline ad component for specific features
interface FeatureAdProps {
  feature: string
  className?: string
}

export function FeatureAd({ feature, className = "" }: FeatureAdProps) {
  const { shouldShowAds } = useFeatureAccess()

  if (!shouldShowAds()) {
    return null
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10 rounded-lg border border-dashed border-blue-200/30 text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Crown className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {feature}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        🚀 Unlock this premium feature with Professional or Enterprise plan
      </p>
      <Button
        size="sm"
        onClick={() => window.location.href = '/settings?tab=billing'}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs"
      >
        Upgrade Now
      </Button>
    </div>
  )
}
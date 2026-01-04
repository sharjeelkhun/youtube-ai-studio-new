"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Wand2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface TitleOptimizationProps {
  original: string
  optimized?: string
  hookStrength?: "Low" | "Medium" | "High"
  keywordCoverage?: number
  onApply?: () => void
  isLoading?: boolean
}

export function TitleOptimization({
  original,
  optimized,
  hookStrength = "Medium",
  keywordCoverage = 60,
  onApply,
  isLoading = false,
}: TitleOptimizationProps) {
  const [showComparison, setShowComparison] = useState(false)

  const getHookStrengthColor = (strength: string) => {
    switch (strength) {
      case "High":
        return "text-green-600"
      case "Medium":
        return "text-yellow-600"
      default:
        return "text-red-600"
    }
  }

  return (
    <Card className="bg-white border-gray-200 shadow-md">
      <CardHeader className="bg-red-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <span>📝 Title Optimization</span>
          <Badge className="bg-red-100 text-red-700 font-semibold border border-red-300">
            {keywordCoverage}% Keywords
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Original Title */}
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">Current Title</div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">{original}</p>
            <p className="text-xs text-gray-600 mt-1">
              {original.length}/60 characters
            </p>
            <Progress
              value={(original.length / 60) * 100}
              className="h-1.5 mt-2 bg-gray-200"
            />
          </div>
        </div>

        {/* Hook Strength & Keyword Coverage */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Hook Strength</div>
            <Badge variant="outline" className={`${getHookStrengthColor(hookStrength)} border border-gray-300 font-semibold`}>
              {hookStrength}
            </Badge>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Keyword Coverage</div>
            <div className="flex items-center gap-2">
              <Progress value={keywordCoverage} className="flex-1 h-1.5 bg-gray-200" />
              <span className="text-sm font-semibold text-gray-900 min-w-fit">{keywordCoverage}%</span>
            </div>
          </div>
        </div>

        {/* Optimized Title (if available) */}
        {optimized && (
          <>
            {!showComparison && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
                className="w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View AI Suggestion
              </Button>
            )}

            {showComparison && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-xs font-medium text-green-900 mb-2">AI-Optimized Title</div>
                  <p className="text-sm font-medium text-green-950">{optimized}</p>
                  <p className="text-xs text-green-700 mt-1">
                    {optimized.length}/60 characters
                  </p>
                  <Progress
                    value={(optimized.length / 60) * 100}
                    className="h-1.5 mt-1 bg-green-100"
                  />
                </div>

                {/* Improvements */}
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="text-xs font-medium text-blue-900 mb-2">✨ Improvements</div>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ Stronger hook in first 5 words</li>
                    <li>✓ Improved keyword placement</li>
                    <li>✓ Better CTR potential</li>
                  </ul>
                </div>

                <Button
                  onClick={onApply}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Applying...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Apply AI Title
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {!optimized && (
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Title
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
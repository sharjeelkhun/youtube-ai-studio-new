"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Wand2, Eye } from "lucide-react"
import { useState } from "react"

interface DescriptionOptimizationProps {
  original: string
  optimized?: string
  first2LinesScore?: number
  keywordDensity?: number
  onApply?: () => void
  isLoading?: boolean
}

export function DescriptionOptimization({
  original,
  optimized,
  first2LinesScore = 65,
  keywordDensity = 2.5,
  onApply,
  isLoading = false,
}: DescriptionOptimizationProps) {
  const [showComparison, setShowComparison] = useState(false)

  const getFirst2Lines = (text: string) => {
    return text.split('\n').slice(0, 2).join('\n')
  }

  return (
    <Card className="bg-white border-gray-200 shadow-md">
      <CardHeader className="bg-red-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <span>📄 Description Optimization</span>
          <Badge className="bg-red-100 text-red-700 font-semibold border border-red-300">
            {first2LinesScore}% First 2 Lines
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* First 2 Lines Preview */}
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">First 2 Lines (Most Important)</div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">{getFirst2Lines(original)}</p>
            <div className="mt-2">
              <Progress value={first2LinesScore} className="h-1.5 bg-gray-200" />
              <p className="text-xs text-gray-600 mt-1">Optimization Score: {first2LinesScore}%</p>
            </div>
          </div>
        </div>

        {/* Keyword Density & Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Keyword Density</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">{keywordDensity}%</span>
              <span className="text-xs text-muted-foreground">(ideal: 2-3%)</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Character Count</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{original.length}</span>
              <span className="text-xs text-muted-foreground">(max: 5000)</span>
            </div>
          </div>
        </div>

        {/* Current Description Preview */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Current Description</div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
            <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-5">{original}</p>
          </div>
        </div>

        {/* Optimized Comparison */}
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
                View Changes
              </Button>
            )}

            {showComparison && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-xs font-medium text-green-900 mb-2">✓ AI-Optimized Version</div>
                  <p className="text-sm text-green-950 whitespace-pre-wrap line-clamp-5">{optimized}</p>
                </div>

                {/* Key Changes */}
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <div className="text-xs font-medium text-amber-900 mb-2">📝 Key Changes</div>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>✓ Rewrote first 2 lines for better engagement</li>
                    <li>✓ Added strategic keywords naturally</li>
                    <li>✓ Improved keyword density to 2.5%</li>
                    <li>✓ Added timestamps & clear structure</li>
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
                      Apply AI Description
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
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Description
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
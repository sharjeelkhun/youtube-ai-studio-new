"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Image, Upload, Wand2, Lightbulb, Lock, TrendingUp } from "lucide-react"
import { useFeatureAccess } from "@/lib/feature-access"
import { UpgradePrompt } from "@/components/upgrade-prompt"

interface ThumbnailIntelligenceProps {
  currentThumbnailUrl?: string
  thumbnailScore?: number
  suggestions?: string[]
  conceptIdeas?: string[]
  onUpload?: () => void
  onGeneratePrompt?: () => void
  isLoading?: boolean
}

export function ThumbnailIntelligence({
  currentThumbnailUrl,
  thumbnailScore = 65,
  suggestions = [
    "Add more contrast between text and background",
    "Use bold, sans-serif fonts for better readability at small sizes",
    "Include facial expressions or emotions in center frame",
  ],
  conceptIdeas = [
    "Shocked expression with text overlay 'SHOCKING DISCOVERY'",
    "Split-screen comparison: Before (gray) vs After (vibrant colors)",
    "Minimal design with large emoji or icon and single word hook",
  ],
  onUpload,
  onGeneratePrompt,
  isLoading = false,
}: ThumbnailIntelligenceProps) {
  const { hasFeature, getUpgradeMessage } = useFeatureAccess()
  const canGeneratePrompts = hasFeature('CUSTOM_AI_PROMPTS')

  return (
    <Card className="bg-white border-gray-200 shadow-md">
      <CardHeader className="bg-red-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Image className="h-5 w-5 text-red-600" />
          Thumbnail Intelligence
          <Badge className="bg-red-100 text-red-700 font-semibold border border-red-300">{thumbnailScore}% Quality</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6\">
        {/* Current Thumbnail */}
        {currentThumbnailUrl && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Current Thumbnail</div>
            <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video">
              <img
                src={currentThumbnailUrl}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Quality Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Quality Score</p>
              <p className="text-2xl font-bold text-blue-600">{thumbnailScore}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* AI Improvement Suggestions */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">💡 Improvement Suggestions</div>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex gap-2 text-sm p-2 bg-amber-50 rounded border border-amber-200">
                <span className="text-amber-600 flex-shrink-0">→</span>
                <span className="text-amber-900">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail Concept Ideas */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">🎨 Thumbnail Concept Ideas</div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {conceptIdeas.map((idea, idx) => (
              <div key={idx} className="text-sm p-2 bg-slate-50 rounded border border-slate-200">
                {idea}
              </div>
            ))}
          </div>
        </div>

        {/* AI Thumbnail Prompt Generator (Premium) */}
        {!canGeneratePrompts ? (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Thumbnail Prompt Generator</span>
              </div>
              <p className="text-xs text-purple-800">Generate detailed AI prompts for creating custom thumbnails with DALL-E or Gemini</p>
            </div>
            <UpgradePrompt
              feature="CUSTOM_AI_PROMPTS"
              description={getUpgradeMessage('CUSTOM_AI_PROMPTS')}
              requiredPlan="Professional"
              currentPlan="Starter"
            />
          </div>
        ) : (
          <Button
            onClick={onGeneratePrompt}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Prompt
              </>
            )}
          </Button>
        )}

        {/* Upload New Thumbnail */}
        <Button
          onClick={onUpload}
          variant="outline"
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Thumbnail
        </Button>
      </CardContent>
    </Card>
  )
}
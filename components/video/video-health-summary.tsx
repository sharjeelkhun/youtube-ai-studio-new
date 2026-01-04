"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface VideoHealthSummaryProps {
  score: number
  titleOptimization: number
  descriptionOptimization: number
  tagsOptimization: number
  thumbnailScore: number
}

export function VideoHealthSummary({
  score,
  titleOptimization,
  descriptionOptimization,
  tagsOptimization,
  thumbnailScore,
}: VideoHealthSummaryProps) {
  const getStatusBadge = (score: number) => {
    if (score >= 80) return { label: "Optimized", color: "text-green-600", bgColor: "bg-green-100" }
    if (score >= 60) return { label: "Needs Improvement", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { label: "Underperforming", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const getScoreColor = (value: number) => {
    if (value >= 80) return "bg-green-500"
    if (value >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getAIDiagnosis = (score: number) => {
    if (score >= 80) return "✨ Your video is well-optimized! Keep this up."
    if (score >= 60) return "🔧 Title hook and tags need optimization to improve visibility."
    return "⚠️ Multiple optimization opportunities. Start with title and description."
  }

  const status = getStatusBadge(score)

  return (
    <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <span>Video Health Score</span>
          </CardTitle>
          <Badge className={cn("font-semibold px-3 py-1", status.bgColor, status.color)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
            <span className={cn("text-3xl font-bold", score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600")}>
              {score}/100
            </span>
          </div>
          <Progress value={score} className={cn("h-2.5", getScoreColor(score))} />
        </div>

        {/* Component Scores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "📝 Title", value: titleOptimization },
            { label: "📄 Description", value: descriptionOptimization },
            { label: "🏷️ Tags", value: tagsOptimization },
            { label: "🖼️ Thumbnail", value: thumbnailScore },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/50 hover:border-border transition-colors">
              <div className="text-xs font-medium text-muted-foreground mb-3">{item.label}</div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{item.value}%</div>
                <Progress value={item.value} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Diagnosis */}
        <Alert className="bg-muted/40 border-border/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {getAIDiagnosis(score)}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
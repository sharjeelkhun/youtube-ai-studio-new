"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, ArrowRight, Wand2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface NextBestActionProps {
  message: string
  action: "apply_title" | "apply_description" | "apply_tags" | "optimize_all"
  actionLabel: string
  onAction?: () => Promise<void>
  isLoading?: boolean
  priority: "high" | "medium" | "low"
}

export function NextBestAction({
  message,
  action,
  actionLabel,
  onAction,
  isLoading = false,
  priority = "high",
}: NextBestActionProps) {
  const getPriorityStyles = () => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-600",
          badge: "bg-red-100 text-red-700",
          button: "bg-red-600 hover:bg-red-700 text-white",
        }
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          text: "text-yellow-600",
          badge: "bg-yellow-100 text-yellow-700",
          button: "bg-yellow-600 hover:bg-yellow-700 text-white",
        }
      default:
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-600",
          badge: "bg-blue-100 text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
        }
    }
  }

  const styles = getPriorityStyles()

  return (
    <Card className={cn("border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden", styles.bg, styles.border)}>
      <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className={cn("p-2 rounded-lg", styles.bg)}>
              <Lightbulb className={cn("h-5 w-5", styles.text)} />
            </div>
            <span>Next Best Action</span>
          </CardTitle>
          <Badge className={cn("font-semibold px-3 py-1", styles.badge)}>
            {priority === "high" ? "⚡ HIGH" : priority === "medium" ? "📌 MEDIUM" : "💡 SUGGESTED"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Message */}
        <Alert className={cn("border-border/50 bg-muted/40", styles.text)}>
          <AlertDescription className="text-sm font-medium">
            {message}
          </AlertDescription>
        </Alert>

        {/* Action Button */}
        <Button
          onClick={onAction}
          disabled={isLoading}
          className={cn("w-full font-semibold h-10 gap-2", styles.button)}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⚙️</span>
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              {actionLabel}
              <ArrowRight className="h-4 w-4 ml-auto" />
            </>
          )}
        </Button>

        {/* Pro Tip */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
          <p className="font-medium flex items-center gap-1.5">
            <span>💡</span>
            Pro Tip:
          </p>
          <p className="text-muted-foreground">This recommendation is based on analysis of top-performing videos in your niche. Follow through to maximize growth potential.</p>
        </div>
      </CardContent>
    </Card>
  )
}
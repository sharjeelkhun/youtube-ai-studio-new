"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, Circle, Wand2, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useFeatureAccess } from "@/lib/feature-access"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "high" | "medium" | "low"
  impact?: string
  score?: number
}

interface AIActionChecklistProps {
  items: ChecklistItem[]
  onItemToggle: (id: string) => void
  onFixWithAI: (id: string) => Promise<void>
  isLoading?: boolean
}

export function AIActionChecklist({
  items,
  onItemToggle,
  onFixWithAI,
  isLoading = false,
}: AIActionChecklistProps) {
  const [fixingId, setFixingId] = useState<string | null>(null)
  const { hasFeature } = useFeatureAccess()
  const canApplyAI = hasFeature('MULTIPLE_AI_SUGGESTIONS')

  const handleFixWithAI = async (id: string) => {
    if (!canApplyAI) {
      toast.error('AI fixes require a professional plan or higher')
      return
    }
    setFixingId(id)
    try {
      await onFixWithAI(id)
      onItemToggle(id)
      toast.success('AI fix applied successfully!')
    } catch (error) {
      toast.error('Failed to apply AI fix')
    } finally {
      setFixingId(null)
    }
  }

  const completedCount = items.filter(item => item.completed).length
  const highPriorityItems = items.filter(item => item.priority === 'high' && !item.completed)

  if (!canApplyAI && highPriorityItems.length > 0) {
    return (
      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <span>AI Action Checklist</span>
            <Badge className="ml-auto font-semibold px-3 py-1 bg-primary/10 text-primary">
              {completedCount}/{items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border/50 opacity-60">
                <Circle className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
          <UpgradePrompt
            feature="MULTIPLE_AI_SUGGESTIONS"
            description="Unlock AI-powered fixes for all your video optimization tasks"
            requiredPlan="Professional"
            currentPlan="Starter"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <span>AI Action Checklist</span>
          <Badge className="ml-auto font-semibold px-3 py-1 bg-primary/10 text-primary">
            {completedCount}/{items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border transition-all",
              item.completed 
                ? "bg-muted/20 border-border/50 opacity-60" 
                : item.priority === "high"
                  ? "bg-red-500/5 border-red-500/20 hover:border-red-500/30"
                  : "bg-muted/40 border-border/50 hover:border-border"
            )}
          >
            <Checkbox
              id={item.id}
              checked={item.completed}
              onCheckedChange={() => onItemToggle(item.id)}
              className="mt-1"
              disabled={item.completed}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor={item.id} className={cn(
                  "font-medium text-sm cursor-pointer",
                  item.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {item.title}
                </label>
                {item.score !== undefined && (
                  <Badge className={cn(
                    "text-xs font-semibold",
                    item.score < 40 ? "bg-red-100 text-red-700" :
                    item.score < 70 ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  )}>
                    Score: {Math.round(item.score)}
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-xs mt-2",
                item.completed ? "text-muted-foreground" : "text-muted-foreground"
              )}>
                {item.description}
              </p>
              {item.impact && (
                <p className={cn(
                  "text-xs mt-2 font-medium flex items-center gap-1.5",
                  item.priority === "high" ? "text-red-600" : "text-blue-600"
                )}>
                  <span>💡</span>
                  {item.impact}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFixWithAI(item.id)}
              disabled={item.completed || fixingId === item.id || isLoading}
              className={cn(
                "flex-shrink-0 font-medium gap-1.5",
                item.completed 
                  ? "bg-muted border-border/50 text-muted-foreground"
                  : "bg-primary/10 border-primary/20 hover:border-primary/30 text-primary"
              )}
            >
              {fixingId === item.id ? (
                <>
                  <span className="animate-spin h-4 w-4">⚙️</span>
                </>
              ) : item.completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Fix
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
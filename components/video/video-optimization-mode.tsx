"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, CheckCircle2, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface OptimizationItem {
  type: "title" | "description" | "tags"
  original: string
  optimized: string
  status: "pending" | "optimizing" | "completed"
}

interface VideoOptimizationModeProps {
  video: {
    id?: string
    title: string
    description: string
    tags: string[]
  }
  onOptimize?: () => Promise<void>
  isLoading?: boolean
}

export function VideoOptimizationMode({
  video,
  onOptimize,
  isLoading = false,
}: VideoOptimizationModeProps) {
  const [optimizationItems, setOptimizationItems] = useState<OptimizationItem[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationComplete, setOptimizationComplete] = useState(false)

  const handleStartOptimization = async () => {
    setIsOptimizing(true)
    setOptimizationComplete(false)
    setOptimizationItems([
      {
        type: "title",
        original: video.title,
        optimized: "",
        status: "optimizing",
      },
      {
        type: "description",
        original: video.description.substring(0, 100),
        optimized: "",
        status: "pending",
      },
      {
        type: "tags",
        original: video.tags.slice(0, 3).join(", "),
        optimized: "",
        status: "pending",
      },
    ])

    try {
      if (onOptimize) {
        await onOptimize()
      }

      // Mark title as completed
      setTimeout(() => {
        setOptimizationItems(prev => {
          const updated = [...prev]
          if (updated[0]) updated[0].status = "completed"
          if (updated[1]) updated[1].status = "optimizing"
          return updated
        })
      }, 1500)

      // Mark description as completed
      setTimeout(() => {
        setOptimizationItems(prev => {
          const updated = [...prev]
          if (updated[1]) updated[1].status = "completed"
          if (updated[2]) updated[2].status = "optimizing"
          return updated
        })
      }, 3000)

      // Mark tags as completed
      setTimeout(() => {
        setOptimizationItems(prev => {
          const updated = [...prev]
          if (updated[2]) updated[2].status = "completed"
          return updated
        })
      }, 4500)

      // Show completion
      setTimeout(() => {
        setIsOptimizing(false)
        setOptimizationComplete(true)
      }, 5000)
    } catch (error) {
      console.error('Optimization error:', error)
      toast.error("Optimization failed", { description: "There was an error during optimization" })
      setIsOptimizing(false)
      setOptimizationItems([])
    }
  }

  return (
    <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <span>One-Click Optimization</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!isOptimizing && !optimizationComplete && (
          <div className="space-y-4">
            <Alert className="border-border/50 bg-primary/5">
              <AlertDescription className="text-sm">
                ✨ Optimize title, description, and tags using AI. Changes applied instantly.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleStartOptimization}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10 gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Starting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Start Optimization
                </>
              )}
            </Button>
          </div>
        )}

        {isOptimizing && (
          <div className="space-y-3">
            {optimizationItems.map((item, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-lg border transition-all",
                item.status === 'completed' 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : item.status === 'optimizing'
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-muted/40 border-border/50'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {item.status === "optimizing" && (
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {item.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {item.status === "pending" && (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className="text-sm font-medium capitalize text-foreground">{item.type}</span>
                  </div>
                  <Badge className={cn(
                    "font-semibold px-2.5 py-0.5",
                    item.status === "completed" ? "bg-green-100 text-green-700" :
                    item.status === "optimizing" ? "bg-blue-100 text-blue-700" : 
                    "bg-muted text-muted-foreground"
                  )}>
                    {item.status === "optimizing" ? "Optimizing..." : item.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.original}</p>
              </div>
            ))}
          </div>
        )}

        {optimizationComplete && (
          <div className="space-y-4">
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700">
                ✨ All optimizations completed successfully!
              </AlertDescription>
            </Alert>

            <div className="bg-muted/40 p-4 rounded-lg border border-border/50 space-y-3">
              <h4 className="font-medium text-sm text-foreground">📊 Optimization Summary</h4>
              {optimizationItems.map((item, idx) => (
                <div key={idx} className="text-xs space-y-1.5">
                  <div className="font-medium capitalize text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {item.type}
                  </div>
                  <div className="text-muted-foreground ml-5">
                    Optimization applied
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setOptimizationComplete(false)
                  setOptimizationItems([])
                }}
                className="border-border/50"
              >
                Start Over
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                View Results
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
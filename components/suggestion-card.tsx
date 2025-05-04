"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SuggestionCardProps {
  title: string
  type: string
  description: string
  metrics: {
    views: string
    engagement: string
  }
}

export function SuggestionCard({ title, type, description, metrics }: SuggestionCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge className="mb-2">{type}</Badge>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </div>
        <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-4">{description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Est. Views</p>
            <p className="text-sm font-medium">{metrics.views}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Engagement</p>
            <p className="text-sm font-medium">{metrics.engagement}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Use This Idea
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}

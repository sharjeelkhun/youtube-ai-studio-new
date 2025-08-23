"use client"

import { useState, useEffect } from "react"
import { Search, ArrowRight, CheckCircle, AlertCircle, HelpCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { getSeoScores, analyzeSeo } from "@/lib/api"
import type { SeoScore } from "@/lib/types"
import { toast } from "sonner"

export function SeoTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [seoScores, setSeoScores] = useState<SeoScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const fetchSeoScores = async () => {
      setIsLoading(true)
      try {
        const scores = await getSeoScores()
        setSeoScores(scores)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load SEO scores. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeoScores()
  }, [])

  const handleAnalyze = async () => {
    if (!searchQuery.trim()) {
      toast.error("Error", {
        description: "Please enter a video URL or title to analyze",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeSeo(searchQuery)
      if (result) {
        // Add the new score to the top of the list
        setSeoScores((prev) => [result, ...prev])
        toast.success("Analysis Complete", {
          description: `SEO score for "${result.title}" is ${result.score}/100`,
        })
        setSearchQuery("")
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to analyze SEO. Please try again.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>YouTube SEO Analyzer</CardTitle>
          <CardDescription>Analyze your video title, description, and tags for SEO optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Enter video URL or title..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !searchQuery.trim()}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Research</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {seoScores.map((score) => (
                <SeoScoreCard
                  key={score.id}
                  title={score.title}
                  score={score.score}
                  status={score.status}
                  details={score.details}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Research</CardTitle>
              <CardDescription>Find high-performing keywords for your niche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Keyword research tool content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Analyze top-performing videos in your niche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Competitor analysis tool content
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SeoScoreCardProps {
  title: string
  score: number
  status: "good" | "average" | "poor"
  details: {
    title: "Good" | "Average" | "Poor"
    tags: "Good" | "Average" | "Poor"
    description: "Good" | "Average" | "Poor"
    thumbnail: "Good" | "Average" | "Poor"
  }
}

function SeoScoreCard({ title, score, status, details }: SeoScoreCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "average":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "average":
        return <HelpCircle className="h-4 w-4 text-yellow-500" />
      case "poor":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">SEO Score</span>
          <Badge variant={status === "good" ? "default" : status === "average" ? "outline" : "secondary"}>
            {score}/100
          </Badge>
        </div>
        <Progress value={score} className={`h-2 ${getStatusColor()}`} />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Title</p>
            <p className="font-medium">{details.title}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tags</p>
            <p className="font-medium">{details.tags}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Description</p>
            <p className="font-medium">{details.description}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Thumbnail</p>
            <p className="font-medium">{details.thumbnail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, LineChart, Lightbulb, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { SuggestionCard } from "@/components/suggestion-card"
import { getContentSuggestions, getTrendingTopics, getVideoImprovements, generateAiContent } from "@/lib/api"
import type { ContentSuggestion, TrendingTopic, VideoImprovement } from "@/lib/types"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export function SuggestionsTab() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")

  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([])
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [videoImprovements, setVideoImprovements] = useState<VideoImprovement[]>([])

  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [isLoadingTrends, setIsLoadingTrends] = useState(true)
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSubtab = (searchParams?.get('tab') as string) || 'content'
  const [activeTab, setActiveTab] = useState(initialSubtab)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingContent(true)
        const suggestions = await getContentSuggestions()
        setContentSuggestions(suggestions)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load content suggestions.",
        })
      } finally {
        setIsLoadingContent(false)
      }

      try {
        setIsLoadingTrends(true)
        const trends = await getTrendingTopics()
        setTrendingTopics(trends)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load trending topics.",
        })
      } finally {
        setIsLoadingTrends(false)
      }

      try {
        setIsLoadingImprovements(true)
        const improvements = await getVideoImprovements()
        setVideoImprovements(improvements)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load video improvements.",
        })
      } finally {
        setIsLoadingImprovements(false)
      }
    }

    fetchData()
  }, [])

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Error", {
        description: "Please enter a prompt for the AI.",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedContent("")

    try {
      const content = await generateAiContent(prompt)
      setGeneratedContent(content)
      toast.success("Content Generated", {
        description: "AI has generated content based on your prompt.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to generate content. Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearPrompt = () => {
    setPrompt("")
    setGeneratedContent("")
  }

  const handleQuickPrompt = (promptText: string) => {
    setPrompt(promptText)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Assistant</CardTitle>
          <CardDescription>Get AI-powered suggestions for your YouTube content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="What kind of content would you like help with? E.g., 'Generate 5 video title ideas about AI in marketing'"
              className="min-h-[100px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  handleQuickPrompt("Generate 5 catchy video title ideas about AI tools for content creators")
                }
              >
                Title ideas
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleQuickPrompt("Write a YouTube video description template for a tutorial video")}
              >
                Description template
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  handleQuickPrompt("Create a script outline for a 10-minute video about YouTube growth strategies")
                }
              >
                Script outline
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  handleQuickPrompt("Suggest 3 thumbnail concepts for a video about AI in content creation")
                }
              >
                Thumbnail concepts
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  handleQuickPrompt("Generate SEO-friendly tags for a YouTube video about video editing tips")
                }
              >
                Tag suggestions
              </Badge>
            </div>
          </div>

          {generatedContent && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="mb-2 font-medium">Generated Content:</h3>
              <div className="whitespace-pre-line text-sm">{generatedContent}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClearPrompt} disabled={isGenerating || !prompt}>
            Clear
          </Button>
          <Button onClick={handleGenerateContent} disabled={isGenerating || !prompt}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate
                <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        params.set('tab', value)
        const query = params.toString()
        router.replace(`/suggestions${query ? `?${query}` : ''}`)
      }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content Ideas</TabsTrigger>
          <TabsTrigger value="trends">Trending Topics</TabsTrigger>
          <TabsTrigger value="improvements">Video Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {isLoadingContent ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contentSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  title={suggestion.title}
                  type={suggestion.type}
                  description={suggestion.description}
                  metrics={suggestion.metrics}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Trending Topics in Your Niche
              </CardTitle>
              <CardDescription>Topics gaining traction in the tech and AI content space</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTrends ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingTopics.map((topic) => (
                    <div key={topic.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{topic.title}</h3>
                        <Badge>{topic.growth} Growth</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
                      <Button variant="link" className="mt-2 h-auto p-0 text-sm">
                        View topic insights
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5 text-primary" />
                Video Performance Insights
              </CardTitle>
              <CardDescription>AI-powered suggestions to improve your existing videos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingImprovements ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {videoImprovements.map((improvement) => (
                    <div key={improvement.videoId} className="rounded-lg border p-4">
                      <h3 className="font-semibold">{improvement.videoTitle}</h3>
                      <div className="mt-2 space-y-2">
                        {improvement.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 h-4 w-4 text-yellow-500" />
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="mt-3">
                        Apply Suggestions
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

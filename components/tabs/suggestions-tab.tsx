"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, LineChart, Loader2, Info, Lightbulb, FileText, PenTool, Image, Tag, LayoutGrid, List, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { IdeaCard } from "@/components/idea-card"
import type { ContentIdea, NewContentIdea, IdeaType, IdeaStatus, IdeaSource } from "@/lib/types/ideas"
import { useIdeas } from "@/hooks/use-ideas"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import { useProfile } from "@/contexts/profile-context"
import { EditIdeaDialog } from "@/components/edit-idea-dialog"
import { cn } from "@/lib/utils"
import { useFeatureAccess } from "@/lib/feature-access"

export function SuggestionsTab() {
  const { profile } = useProfile()
  const [promptText, setPromptText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [ideaCount, setIdeaCount] = useState<number>(3)

  const [suggestions, setSuggestions] = useState<NewContentIdea[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSubtab = (searchParams?.get('tab') as string) || 'content'
  const [activeTab, setActiveTab] = useState(initialSubtab)
  const { ideas, loading: ideasLoading, saveIdea, deleteIdea, updateIdea } = useIdeas()
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState("")

  // Feature access hook
  const { hasFeature, getUpgradeMessage, planName, getSavedIdeasLimit } = useFeatureAccess()

  // Load view mode from local storage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('suggestionsViewMode')
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view mode to local storage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('suggestionsViewMode', mode)
  }

  // Filter function
  const filterIdeas = (ideasToFilter: ContentIdea[]) => {
    if (!searchQuery) return ideasToFilter
    const query = searchQuery.toLowerCase()
    return ideasToFilter.filter(idea =>
      idea.title.toLowerCase().includes(query) ||
      idea.description?.toLowerCase().includes(query) ||
      idea.type.toLowerCase().includes(query)
    )
  }

  // Filter saved ideas by type and search query
  const savedIdeas = filterIdeas(ideas.filter(idea => idea.status === 'saved'))
  const inProgressIdeas = filterIdeas(ideas.filter(idea => idea.status === 'in_progress'))
  const completedIdeas = filterIdeas(ideas.filter(idea => idea.status === 'completed'))

  const handleGenerateContent = async () => {
    if (!promptText.trim()) {
      toast.error("Error", {
        description: "Please enter a prompt for the AI.",
      })
      return
    }

    // Check if user has access to multiple AI suggestions
    // Allow if they have free generations remaining (less than 3)
    const settings = profile?.ai_settings as any
    const freeUsage = settings?.freeUsageCount || 0
    const hasFreeGenerations = freeUsage < 3

    if (!hasFeature('MULTIPLE_AI_SUGGESTIONS') && !hasFreeGenerations) {
      toast.error("Upgrade Required", {
        description: getUpgradeMessage('MULTIPLE_AI_SUGGESTIONS'),
        action: {
          label: 'Upgrade Plan',
          onClick: () => router.push('/settings?tab=billing')
        }
      })
      return
    }

    setIsGenerating(true)

    try {
      const res = await fetch('/api/ai/suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${promptText}\n\nPlease generate exactly ${ideaCount} distinct ideas.`
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('AI generation error:', error)
        if (error.code === 'billing_error') {
          toast.error('AI provider billing error. Please check your settings.')
        } else if (error.code === 'rate_limit') {
          toast.error('AI rate limit exceeded. Please try again later.')
        } else if (error.code === 'ai_provider_not_configured') {
          toast.error('AI Provider Not Configured', {
            description: 'Please configure your AI provider in Settings > AI Providers.',
            action: {
              label: 'Go to Settings',
              onClick: () => router.push('/settings?tab=ai')
            }
          })
        } else if (error.code === 'api_key_not_configured') {
          toast.error('API Key Missing', {
            description: 'Please add your API key for the selected AI provider.',
            action: {
              label: 'Configure',
              onClick: () => router.push('/settings?tab=ai')
            }
          })
        } else if (error.code === 'authentication_required') {
          toast.error('Please log in to use AI features.')
        } else {
          throw new Error(error.message || 'Failed to generate content')
        }
        return
      }

      console.log('AI response:', res)

      const data = await res.json()
      console.log('Received data from AI:', data)

      let newSuggestions: NewContentIdea[] = []

      if (data.structured && Array.isArray(data.structured)) {
        // The AI returned properly structured data
        newSuggestions = data.structured.map((item: any) => ({
          title: item.title,
          description: item.description,
          type: (item.type || "video_idea") as IdeaType,
          status: "saved" as IdeaStatus,
          metrics: {
            estimatedViews: item.metrics?.estimatedViews || "10K-20K",
            engagement: item.metrics?.engagement || "Medium"
          },
          metadata: {
            tags: item.metadata?.tags || []
          },
          source: "ai_generated" as IdeaSource
        }))
      } else {
        // Try to parse content as structured data
        try {
          const parsedContent = JSON.parse(data.content)
          if (Array.isArray(parsedContent)) {
            newSuggestions = parsedContent.map((item: any) => ({
              title: item.title,
              description: item.description,
              type: (item.type || "video_idea") as IdeaType,
              status: "saved" as IdeaStatus,
              metrics: {
                estimatedViews: item.metrics?.estimatedViews || "10K-20K",
                engagement: item.metrics?.engagement || "Medium"
              },
              metadata: {
                tags: item.metadata?.tags || []
              },
              source: "ai_generated" as IdeaSource
            }))
          }
        } catch (e) {
          console.error('Failed to parse AI response as JSON:', e)
          toast.error('Invalid response format from AI. Please try again.')
          return
        }
      }
      console.log('Generated suggestions:', newSuggestions)

      // Only update suggestions if we actually got new ones
      if (newSuggestions.length > 0) {
        console.log('Setting suggestions:', newSuggestions)
        setSuggestions(prev => [...newSuggestions, ...prev])

        // Show the formatted content in the text area
        setGeneratedContent(newSuggestions.map(idea =>
          `Title: ${idea.title}\nType: ${idea.type}\nDescription: ${idea.description}\nMetrics: ${JSON.stringify(idea.metrics, null, 2)
          }\n`
        ).join('\n---\n\n'))
      } else {
        console.warn('No suggestions were generated')
        toast.error('No valid suggestions were generated from the AI response')
        return
      }

      toast.success("Ideas Generated", {
        description: "AI has generated new content ideas based on your prompt.",
      })

    } catch (error) {
      console.error(error)
      toast.error("Error", {
        description: "Failed to generate content. Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearPrompt = () => {
    setPromptText("")
    setGeneratedContent("")
  }

  const handleQuickPrompt = (text: string) => {
    setPromptText(text)
  }

  const handleEditIdea = (idea: ContentIdea) => {
    setEditingIdea(idea)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async (updates: Partial<ContentIdea>) => {
    if (!editingIdea) return
    try {
      await updateIdea(editingIdea.id, updates)
      setEditDialogOpen(false)
      setEditingIdea(null)
      toast.success("Idea updated successfully")
    } catch (error) {
      console.error('Error updating idea:', error)
      toast.error("Failed to update idea")
    }
  }

  const handleSaveSuggestion = async (suggestion: NewContentIdea, index: number) => {
    try {
      await saveIdea({
        title: suggestion.title,
        description: suggestion.description || '',
        type: suggestion.type,
        status: 'saved',
        metrics: suggestion.metrics || {},
        metadata: suggestion.metadata || {},
        source: 'ai_generated'
      })

      // Remove from suggestions list on success
      setSuggestions(prev => prev.filter((_, i) => i !== index))
    } catch (error) {
      // Error is handled by useIdeas hook toast, but we catch it here to prevent runtime crash
      console.error("Failed to save suggestion:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      {editingIdea && (
        <EditIdeaDialog
          idea={editingIdea}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEdit}
        />
      )}

      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Content Assistant</CardTitle>
              <CardDescription>Get AI-powered suggestions for your YouTube content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Textarea
              placeholder="What kind of content would you like help with? E.g., 'Generate 5 video title ideas about AI in marketing'"
              className="min-h-[120px] text-base bg-background/50 resize-y p-4 border-border/50 focus-visible:ring-primary/20"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            {!profile?.ai_provider && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>AI Provider Not Configured</AlertTitle>
                <AlertDescription>
                  To use AI features, please configure your AI provider in{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold underline"
                    onClick={() => router.push('/settings?tab=ai')}
                  >
                    Settings &gt; AI Providers
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Quick Prompts:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: "Generate 5 catchy video title ideas about AI tools for content creators", icon: Lightbulb, label: "Title ideas" },
                  { text: "Write a YouTube video description template for a tutorial video", icon: FileText, label: "Description template" },
                  { text: "Create a script outline for a 10-minute video about YouTube growth strategies", icon: PenTool, label: "Script outline" },
                  { text: "Suggest 3 thumbnail concepts for a video about AI in content creation", icon: Image, label: "Thumbnail concepts" },
                  { text: "Generate SEO-friendly tags for a YouTube video about video editing tips", icon: Tag, label: "Tag suggestions" },
                ].map((item, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="group bg-background/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
                    onClick={() => handleQuickPrompt(item.text)}
                  >
                    <item.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-muted/20 px-6 py-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Generate {ideaCount} ideas
              </span>
              <Slider
                value={[ideaCount]}
                onValueChange={(value) => setIdeaCount(value[0])}
                max={9}
                min={3}
                step={3}
                className="w-[200px]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleClearPrompt} disabled={isGenerating || !promptText} className="hover:bg-destructive/10 hover:text-destructive">
                Clear
              </Button>
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating || !promptText || !profile?.ai_provider}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        params.set('tab', value)
        const query = params.toString()
        router.replace(`/suggestions${query ? `?${query}` : ''}`)
      }} className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 border border-border/40 rounded-xl w-full md:w-auto grid grid-cols-3">
            <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Content Ideas</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">In Progress</TabsTrigger>
            <TabsTrigger value="improvements" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Completed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/40 bg-background/50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex items-center bg-background/50 border border-border/40 rounded-xl p-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewModeChange('grid')}
                className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' && "bg-background shadow-sm text-primary")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewModeChange('list')}
                className={cn("h-8 w-8 rounded-lg", viewMode === 'list' && "bg-background shadow-sm text-primary")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {ideas.length >= getSavedIdeasLimit() && (
          <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Info className="h-4 w-4" />
            <AlertTitle>Storage Limit Reached</AlertTitle>
            <AlertDescription>
              You have reached the limit of {getSavedIdeasLimit()} ideas (across all tabs). Please delete some ideas or
              <Button
                variant="link"
                className="px-1.5 h-auto font-semibold underline text-foreground"
                onClick={() => router.push('/settings?tab=billing')}
              >
                upgrade your plan
              </Button>
              to save more.
            </AlertDescription>
          </Alert>
        )}

        <TabsContent value="content" className="space-y-4 max-w-full">
          {isLoadingContent || ideasLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {suggestions.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Generated Suggestions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>



                      {suggestions.map((suggestion, index) => (
                        <IdeaCard
                          key={`suggestion-${index}`}
                          idea={{
                            ...suggestion,
                            id: `temp-${index}`,
                            user_id: '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          }}
                          showSave
                          onSave={() => handleSaveSuggestion(suggestion, index)}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-medium">Saved Ideas</CardTitle>
                </CardHeader>
                <CardContent className="px-0">

                  {savedIdeas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10">
                      <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No saved ideas yet</p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
                      {savedIdeas.map((idea) => (
                        <IdeaCard
                          key={idea.id}
                          idea={idea}
                          onStatusChange={(status) => updateIdea(idea.id, { status })}
                          onDelete={() => deleteIdea(idea.id)}
                          onEdit={() => handleEditIdea(idea)}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* In Progress Ideas */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="px-0">
              {inProgressIdeas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10">
                  <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No ideas in progress</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
                  {inProgressIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onStatusChange={(status) => updateIdea(idea.id, { status })}
                      onDelete={() => deleteIdea(idea.id)}
                      onEdit={() => handleEditIdea(idea)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {/* Completed Ideas */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="px-0">
              {completedIdeas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10">
                  <LineChart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No completed ideas</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
                  {completedIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onStatusChange={(status) => updateIdea(idea.id, { status })}
                      onDelete={() => deleteIdea(idea.id)}
                      onEdit={() => handleEditIdea(idea)}
                      viewMode={viewMode}
                    />
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
"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, LineChart, Loader2, Info, Lightbulb, FileText, PenTool, Image, Tag, LayoutGrid, List, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { IdeaCard } from "@/components/idea-card"
import type { ContentIdea, NewContentIdea, IdeaType, IdeaStatus, IdeaSource } from "@/lib/types/ideas"
import { useIdeas } from "@/hooks/use-ideas"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import { useProfile } from "@/contexts/profile-context"
import { EditIdeaDialog } from "@/components/edit-idea-dialog"

export function SuggestionsTab() {
  const { profile } = useProfile()
  const [promptText, setPromptText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")

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

  // Remove initial suggestions fetch since we'll generate them on demand

  const handleGenerateContent = async () => {
    if (!promptText.trim()) {
      toast.error("Error", {
        description: "Please enter a prompt for the AI.",
      })
      return
    }

    setIsGenerating(true)

    try {
      const res = await fetch('/api/ai/suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
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

      // Update suggestions state with new ideas
      setSuggestions(newSuggestions)

      // Create formatted content for display
      const formattedContent = newSuggestions.map(idea =>
        `Title: ${idea.title}\nType: ${idea.type}\nDescription: ${idea.description}\nMetrics: ${JSON.stringify(idea.metrics, null, 2)
        }\nTags: ${idea.metadata?.tags?.join(', ') || 'None'}\n`
      ).join('\n---\n\n');

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

      setGeneratedContent(formattedContent)
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

  return (
    <div className="space-y-4">
      {/* Edit Dialog */}
      {editingIdea && (
        <EditIdeaDialog
          idea={editingIdea}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEdit}
        />
      )}

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#FF0000]/10">
              <Sparkles className="h-5 w-5 text-[#FF0000]" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Content Assistant</CardTitle>
              <CardDescription>Get AI-powered suggestions for your YouTube content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Textarea
              placeholder="What kind of content would you like help with? E.g., 'Generate 5 video title ideas about AI in marketing'"
              className="min-h-[120px] text-base focus:ring-2 focus:ring-[#FF0000]/20 transition-all"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            {!profile?.ai_provider && (
              <Alert className="border-[#FF0000]/20 bg-[#FF0000]/5">
                <Info className="h-4 w-4 text-[#FF0000]" />
                <AlertTitle>AI Provider Not Configured</AlertTitle>
                <AlertDescription>
                  To use AI features, please configure your AI provider in{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#FF0000] underline hover:text-[#CC0000]"
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
                <Button
                  variant="outline"
                  size="sm"
                  className="group hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all hover:scale-105"
                  onClick={() =>
                    handleQuickPrompt("Generate 5 catchy video title ideas about AI tools for content creators")
                  }
                >
                  <Lightbulb className="mr-2 h-3.5 w-3.5 group-hover:text-[#FF0000]" />
                  Title ideas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="group hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all hover:scale-105"
                  onClick={() => handleQuickPrompt("Write a YouTube video description template for a tutorial video")}
                >
                  <FileText className="mr-2 h-3.5 w-3.5 group-hover:text-[#FF0000]" />
                  Description template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="group hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all hover:scale-105"
                  onClick={() =>
                    handleQuickPrompt("Create a script outline for a 10-minute video about YouTube growth strategies")
                  }
                >
                  <PenTool className="mr-2 h-3.5 w-3.5 group-hover:text-[#FF0000]" />
                  Script outline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="group hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all hover:scale-105"
                  onClick={() =>
                    handleQuickPrompt("Suggest 3 thumbnail concepts for a video about AI in content creation")
                  }
                >
                  <Image className="mr-2 h-3.5 w-3.5 group-hover:text-[#FF0000]" />
                  Thumbnail concepts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="group hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5 transition-all hover:scale-105"
                  onClick={() =>
                    handleQuickPrompt("Generate SEO-friendly tags for a YouTube video about video editing tips")
                  }
                >
                  <Tag className="mr-2 h-3.5 w-3.5 group-hover:text-[#FF0000]" />
                  Tag suggestions
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          <Button variant="outline" onClick={handleClearPrompt} disabled={isGenerating || !promptText} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
            Clear
          </Button>
          <Button
            onClick={handleGenerateContent}
            disabled={isGenerating || !promptText || !profile?.ai_provider}
            className="bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-[0_0_20px_-5px_#ff000066] hover:shadow-[0_0_30px_-5px_#ff000099] transition-all hover:scale-105"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
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
      }} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="content" className="data-[state=active]:bg-[#FF0000] data-[state=active]:text-white">Content Ideas</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-[#FF0000] data-[state=active]:text-white">In Progress</TabsTrigger>
            <TabsTrigger value="improvements" className="data-[state=active]:bg-[#FF0000] data-[state=active]:text-white">Completed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border p-1 shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className={viewMode === 'grid' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white' : ''}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className={viewMode === 'list' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white' : ''}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="content" className="space-y-4">
          {isLoadingContent || ideasLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* New AI Suggestions */}
              {/* New AI Suggestions - only show when we have generated content */}
              {suggestions.length > 0 && (
                <Card className="border-2 border-[#FF0000]/20 bg-gradient-to-br from-[#FF0000]/5 to-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#FF0000]" />
                      <div>
                        <CardTitle className="text-xl">Generated AI Suggestions</CardTitle>
                        <CardDescription>
                          Fresh content ideas based on your prompt
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
                      {suggestions.map((suggestion, index) => (
                        <IdeaCard
                          key={`suggestion-${index}`}
                          idea={{
                            ...suggestion,
                            id: `temp-${index}`,
                            user_id: '', // The backend will handle setting the correct user_id
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          }}
                          showSave
                          onSave={() => saveIdea({
                            title: suggestion.title,
                            description: suggestion.description || '',
                            type: suggestion.type,
                            status: 'saved',
                            metrics: suggestion.metrics || {},
                            metadata: suggestion.metadata || {},
                            source: 'ai_generated'
                          })}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Saved Ideas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Saved Ideas</CardTitle>
                  <CardDescription>Your collection of saved content ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedIdeas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted p-6 mb-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No saved ideas yet</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Generate AI suggestions above and save the ones you like, or create your own ideas.
                      </p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Content in Progress
              </CardTitle>
              <CardDescription>Ideas you're currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              {ideasLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                inProgressIdeas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No ideas in progress</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      {searchQuery ? "No ideas match your search." : "Move ideas here when you start working on them."}
                    </p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
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
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5 text-primary" />
                Completed Ideas
              </CardTitle>
              <CardDescription>Ideas you've successfully turned into content</CardDescription>
            </CardHeader>
            <CardContent>
              {ideasLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                completedIdeas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <LineChart className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No completed ideas</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      {searchQuery ? "No ideas match your search." : "Mark ideas as completed when you've published them."}
                    </p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
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
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
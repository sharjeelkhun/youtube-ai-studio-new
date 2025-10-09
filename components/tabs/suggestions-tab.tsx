"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, LineChart, Loader2, Info } from "lucide-react"
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

  // Filter saved ideas by type
  const savedIdeas = ideas.filter(idea => idea.status === 'saved')
  const inProgressIdeas = ideas.filter(idea => idea.status === 'in_progress')
  const completedIdeas = ideas.filter(idea => idea.status === 'completed')

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
        `Title: ${idea.title}\nType: ${idea.type}\nDescription: ${idea.description}\nMetrics: ${
          JSON.stringify(idea.metrics, null, 2)
        }\nTags: ${idea.metadata?.tags?.join(', ') || 'None'}\n`
      ).join('\n---\n\n');

      // Only update suggestions if we actually got new ones
      if (newSuggestions.length > 0) {
        console.log('Setting suggestions:', newSuggestions)
        setSuggestions(prev => [...newSuggestions, ...prev])
        
        // Show the formatted content in the text area
        setGeneratedContent(newSuggestions.map(idea => 
          `Title: ${idea.title}\nType: ${idea.type}\nDescription: ${idea.description}\nMetrics: ${
            JSON.stringify(idea.metrics, null, 2)
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
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            {!profile?.ai_provider && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>AI Provider Not Configured</AlertTitle>
                <AlertDescription>
                  To use AI features, please configure your AI provider in{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary underline"
                    onClick={() => router.push('/settings?tab=ai')}
                  >
                    Settings &gt; AI Providers
                  </Button>
                </AlertDescription>
              </Alert>
            )}
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

          {/* {generatedContent && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="mb-2 font-medium">Generated Content:</h3>
              <div className="whitespace-pre-line text-sm">{generatedContent}</div>
            </div>
          )} */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClearPrompt} disabled={isGenerating || !promptText}>
            Clear
          </Button>
          <Button onClick={handleGenerateContent} disabled={isGenerating || !promptText || !profile?.ai_provider}>
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
          <TabsTrigger value="trends">In Progress</TabsTrigger>
          <TabsTrigger value="improvements">Completed</TabsTrigger>
        </TabsList>

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
                <Card>
                  <CardHeader>
                    <CardTitle>Generated AI Suggestions</CardTitle>
                    <CardDescription>
                      Fresh content ideas based on your prompt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Saved Ideas */}
              <Card>
                <CardHeader>
                  <CardTitle>Saved Ideas</CardTitle>
                  <CardDescription>Your collection of saved content ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savedIdeas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onStatusChange={(status) => updateIdea(idea.id, { status })}
                        onDelete={() => deleteIdea(idea.id)}
                        onEdit={() => handleEditIdea(idea)}
                      />
                    ))}
                  </div>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onStatusChange={(status) => updateIdea(idea.id, { status })}
                      onDelete={() => deleteIdea(idea.id)}
                      onEdit={() => handleEditIdea(idea)}
                    />
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onStatusChange={(status) => updateIdea(idea.id, { status })}
                      onDelete={() => deleteIdea(idea.id)}
                      onEdit={() => handleEditIdea(idea)}
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
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wand2, X, Plus, AlertTriangle, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface TagsIntelligenceProps {
  currentTags: string[]
  suggestedTags?: string[]
  relevanceScores?: Record<string, number>
  onReplaceTags?: () => void
  onApply?: (tags: string[]) => void
  isLoading?: boolean
}

export function TagsIntelligence({
  currentTags,
  suggestedTags = [],
  relevanceScores = {},
  onReplaceTags,
  onApply,
  isLoading = false,
}: TagsIntelligenceProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags)
  const [newTag, setNewTag] = useState("")

  const lowRelevanceTags = currentTags.filter(tag => (relevanceScores[tag] || 100) < 60)

  const handleAddTag = () => {
    if (newTag.trim() && selectedTags.length < 30) {
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const handleAddSuggestedTag = (tag: string) => {
    if (selectedTags.length < 30 && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleReplaceTags = async () => {
    if (onReplaceTags) {
      await onReplaceTags()
    }
  }

  return (
    <Card className="bg-white border-gray-200 shadow-md">
      <CardHeader className="bg-red-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <span>🏷️ Tags Intelligence</span>
          <Badge className="bg-red-100 text-red-700 font-semibold border border-red-300">
            {selectedTags.length}/30
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Low Relevance Tags Warning */}
        {lowRelevanceTags.length > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-700" />
            <AlertDescription className="text-yellow-900 text-sm font-medium">
              ⚠️ {lowRelevanceTags.length} low-relevance tag{lowRelevanceTags.length > 1 ? 's' : ''} detected: <strong>{lowRelevanceTags.join(", ")}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Tags */}
        <div>
          <div className="text-xs font-medium text-gray-700 mb-3">Current Tags</div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className={`flex items-center gap-2 py-1.5 px-2 text-xs font-medium border ${
                  (relevanceScores[tag] || 100) < 60
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                {tag}
                {relevanceScores[tag] && (
                  <span className="text-xs opacity-75">
                    ({relevanceScores[tag]}%)
                  </span>
                )}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:opacity-70 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTag}
            disabled={selectedTags.length >= 30}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested Tags */}
        {suggestedTags.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">💡 Suggested Tags</div>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAddSuggestedTag(tag)}
                  disabled={selectedTags.includes(tag) || selectedTags.length >= 30}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag Relevance Summary */}
        {Object.keys(relevanceScores).length > 0 && (
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-xs font-medium text-muted-foreground mb-2">Tag Relevance Score</div>
            <div className="space-y-1">
              {Object.entries(relevanceScores)
                .filter(([tag]) => selectedTags.includes(tag))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tag, score]) => (
                  <div key={tag} className="flex items-center justify-between text-xs">
                    <span>{tag}</span>
                    <div className="w-24 bg-white rounded h-1.5">
                      <div
                        className={`h-1.5 rounded transition-all ${
                          score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="font-medium">{score}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Replace All Tags Button */}
        <Button
          onClick={handleReplaceTags}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⚙️</span>
              Replacing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Replace All Tags with AI
            </>
          )}
        </Button>

        {/* Apply Changes */}
        {JSON.stringify(selectedTags) !== JSON.stringify(currentTags) && (
          <Button
            onClick={() => onApply?.(selectedTags)}
            variant="outline"
            className="w-full"
          >
            Save Tag Changes
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
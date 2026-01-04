"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { History, RotateCcw, AlertCircle, Clock, ChevronDown, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface OptimizationRecord {
  id: string
  timestamp: string
  changes: {
    field: "title" | "description" | "tags"
    before: string
    after: string
  }[]
  appliedBy: "user" | "ai"
}

interface VersionAndChangeTrackingProps {
  history: OptimizationRecord[]
  onRevert?: (id: string) => Promise<void>
  isLoading?: boolean
}

export function VersionAndChangeTracking({
  history,
  onRevert,
  isLoading = false,
}: VersionAndChangeTrackingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(history[0]?.id || null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

  const handleRevert = async (id: string) => {
    setRevertingId(id)
    try {
      if (onRevert) {
        await onRevert(id)
      }
      toast.success("Changes reverted successfully")
    } catch (error) {
      toast.error("Failed to revert changes")
    } finally {
      setRevertingId(null)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getTotalChanges = (record: OptimizationRecord) => {
    return record.changes.reduce((acc, change) => acc + 1, 0)
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'title':
        return '📝'
      case 'description':
        return '📄'
      case 'tags':
        return '🏷️'
      default:
        return '✨'
    }
  }

  if (history.length === 0) {
    return (
      <Card className="border-red-100 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <History className="h-5 w-5" />
            Optimization History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              No optimization history yet. Start optimizing your video to see changes here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-100">
      <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <History className="h-5 w-5 text-red-600" />
          </div>
          <span className="text-red-700">Optimization History</span>
          <Badge className="bg-red-600 hover:bg-red-700 ml-auto">{history.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-6">
        {history.map((record, idx) => (
          <div
            key={record.id}
            className={`border rounded-xl transition-all duration-200 overflow-hidden ${
              expandedId === record.id
                ? 'border-red-300 bg-red-50 shadow-md'
                : 'border-red-100 bg-white hover:border-red-200'
            }`}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              className="w-full text-left flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  record.appliedBy === 'ai'
                    ? 'bg-red-200 text-red-700'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {record.appliedBy === 'ai' ? '✨' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {getTotalChanges(record)} {getTotalChanges(record) === 1 ? 'change' : 'changes'}
                    </p>
                    {record.appliedBy === 'ai' && (
                      <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(record.timestamp)}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-red-600 transition-transform duration-200 flex-shrink-0 ${
                  expandedId === record.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Details */}
            {expandedId === record.id && (
              <div className="border-t border-red-200 p-4 space-y-4 bg-white">
                {record.changes.map((change, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFieldIcon(change.field)}</span>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{change.field}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Before */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-600 uppercase">Before</p>
                        <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
                          {change.before || <span className="text-gray-400 italic">No content</span>}
                        </p>
                      </div>
                      {/* After */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-red-700 uppercase">After</p>
                        <p className="text-sm text-red-900 line-clamp-4 leading-relaxed font-medium">
                          {change.after || <span className="text-gray-400 italic">No content</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Revert Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevert(record.id)}
                  disabled={revertingId === record.id || isLoading}
                  className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {revertingId === record.id ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Reverting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Revert to This Version
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
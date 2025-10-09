import { useState, useEffect } from 'react'
import { ContentIdea, NewContentIdea } from '@/lib/types/ideas'
import { toast } from 'sonner'

export function useIdeas() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all ideas
  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ideas')
      const data = await res.json()
      
      if (!res.ok) {
        // Handle known error responses
        if (res.status === 401) {
          throw new Error('You must be logged in to view ideas')
        } else {
          throw new Error(data.error || 'Failed to fetch ideas')
        }
      }

      setIdeas(data)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ideas'
      setError(message)
      toast.error('Error', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  const saveIdea = async (idea: NewContentIdea) => {
    try {
      // Ensure all required fields are properly initialized
      const ideaToSave: NewContentIdea = {
        title: idea.title,
        description: idea.description || '',
        type: idea.type,
        status: idea.status || 'saved',
        source: idea.source || 'user_created',
        metrics: idea.metrics || {},
        metadata: idea.metadata || {}
      }

      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaToSave),
      })

      const data = await res.json()
      
      if (!res.ok) {
        // Handle known error responses
        if (res.status === 401) {
          throw new Error('You must be logged in to save ideas')
        } else if (res.status === 400) {
          throw new Error(data.error || 'Invalid idea data')
        } else {
          throw new Error(data.error || 'Failed to save idea')
        }
      }

      setIdeas(prev => [data, ...prev])
      toast.success('Idea saved successfully')
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save idea'
      toast.error('Error', {
        description: message,
      })
      throw err
    }
  }

  const updateIdea = async (id: string, updates: Partial<ContentIdea>) => {
    try {
      const res = await fetch('/api/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        // Handle known error responses
        if (res.status === 401) {
          throw new Error('You must be logged in to update ideas')
        } else if (res.status === 400) {
          throw new Error(data.error || 'Invalid update data')
        } else {
          throw new Error(data.error || 'Failed to update idea')
        }
      }

      const updatedIdea = data as ContentIdea
      setIdeas(prev => prev.map(idea => 
        idea.id === id ? updatedIdea : idea
      ))
      toast.success('Idea updated successfully')
      return updatedIdea
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update idea'
      toast.error('Error', {
        description: message,
      })
      throw err
    }
  }

  const deleteIdea = async (id: string) => {
    try {
      const res = await fetch(`/api/ideas?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete idea')

      setIdeas(prev => prev.filter(idea => idea.id !== id))
      toast.success('Idea deleted successfully')
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to delete idea. Please try again.',
      })
      throw err
    }
  }

  return {
    ideas,
    loading,
    error,
    saveIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas: fetchIdeas,
  }
}
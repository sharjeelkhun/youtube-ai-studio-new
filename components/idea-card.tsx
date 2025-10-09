import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentIdea, IdeaStatus } from "@/lib/types/ideas"
import { BookMarked, Calendar, Edit2, FileText, MoreHorizontal, Play, Save, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from 'date-fns'
import { cn } from "@/lib/utils"

interface IdeaCardProps {
  idea: ContentIdea
  onSave?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onStatusChange?: (status: IdeaStatus) => void
  showSave?: boolean
  className?: string
}

const statusColors: Record<IdeaStatus, string> = {
  saved: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  archived: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
}

const statusIcons = {
  saved: BookMarked,
  in_progress: Play,
  completed: Save,
  archived: FileText
}

const formatStatus = (status: IdeaStatus) => {
  return status?.replace(/_/g, ' ') || 'Unknown'
}

export function IdeaCard({
  idea,
  onSave,
  onEdit,
  onDelete,
  onStatusChange,
  showSave = false,
  className
}: IdeaCardProps) {
  // Default to 'saved' status if undefined
  const status = idea?.status || 'saved'
  const StatusIcon = statusIcons[status] || BookMarked

  if (!idea) {
    return null
  }

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{idea.title}</CardTitle>
            <CardDescription>{idea.type}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onStatusChange && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange('saved')}>
                    Mark as Saved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange('in_progress')}>
                    Mark In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange('completed')}>
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange('archived')}>
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="outline" className={cn("", statusColors[status])}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {formatStatus(status)}
          </Badge>
          {idea.created_at && (
            <Badge variant="secondary">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
        {idea.metrics && Object.keys(idea.metrics).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {idea.metrics.estimatedViews && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Est. Views</p>
                <p className="text-sm font-medium">{idea.metrics.estimatedViews}</p>
              </div>
            )}
            {idea.metrics.engagement && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Engagement</p>
                <p className="text-sm font-medium">{idea.metrics.engagement}</p>
              </div>
            )}
            {idea.metrics.difficulty && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p className="text-sm font-medium">{idea.metrics.difficulty}</p>
              </div>
            )}
            {idea.metrics.timeToCreate && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Time to Create</p>
                <p className="text-sm font-medium">{idea.metrics.timeToCreate}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {showSave && onSave && (
        <CardFooter className="pt-0">
          <Button onClick={onSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Idea
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
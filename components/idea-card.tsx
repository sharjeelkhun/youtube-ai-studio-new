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
  viewMode?: 'grid' | 'list'
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
  className,
  viewMode = 'grid'
}: IdeaCardProps) {
  // Default to 'saved' status if undefined
  const status = idea?.status || 'saved'
  const StatusIcon = statusIcons[status] || BookMarked

  if (!idea) {
    return null
  }

  // List view layout
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        "relative transition-all duration-300 hover:shadow-xl border-2",
        status === 'saved' && "hover:border-[#FF0000]/30",
        className
      )}>
        <div className="flex flex-col md:flex-row md:items-start gap-4 p-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("", statusColors[status])}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {formatStatus(status)}
                  </Badge>
                  {idea.created_at && (
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{idea.type}</span>
                </div>
                <h3 className="text-lg font-semibold leading-tight">{idea.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="hover:bg-[#FF0000]/10 hover:text-[#FF0000]"
                    title="Edit idea"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="hover:bg-destructive/10 hover:text-destructive"
                    title="Delete idea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-[#FF0000]/10" title="More options">
                      <MoreHorizontal className="h-4 w-4" />
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
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {idea.metrics && Object.keys(idea.metrics).length > 0 && (
              <div className="flex flex-wrap gap-3">
                {idea.metrics.estimatedViews && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Views:</span>
                    <span className="text-sm font-semibold">{idea.metrics.estimatedViews}</span>
                  </div>
                )}
                {idea.metrics.engagement && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Engagement:</span>
                    <span className="text-sm font-semibold">{idea.metrics.engagement}</span>
                  </div>
                )}
                {idea.metrics.difficulty && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Difficulty:</span>
                    <span className="text-sm font-semibold">{idea.metrics.difficulty}</span>
                  </div>
                )}
                {idea.metrics.timeToCreate && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Time:</span>
                    <span className="text-sm font-semibold">{idea.metrics.timeToCreate}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {showSave && onSave && (
            <Button
              onClick={onSave}
              className="md:self-start bg-[#FF0000] hover:bg-[#CC0000] text-white transition-all hover:scale-105 shrink-0"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Idea
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Grid view layout (original)
  return (
    <Card className={cn(
      "relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2",
      status === 'saved' && "hover:border-[#FF0000]/30",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{idea.title}</CardTitle>
            <CardDescription>{idea.type}</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="hover:bg-[#FF0000]/10 hover:text-[#FF0000]"
                title="Edit idea"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="hover:bg-destructive/10 hover:text-destructive"
                title="Delete idea"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-[#FF0000]/10" title="More options">
                  <MoreHorizontal className="h-4 w-4" />
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            {idea.metrics.estimatedViews && (
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium">Est. Views</p>
                <p className="text-sm font-semibold">{idea.metrics.estimatedViews}</p>
              </div>
            )}
            {idea.metrics.engagement && (
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium">Engagement</p>
                <p className="text-sm font-semibold">{idea.metrics.engagement}</p>
              </div>
            )}
            {idea.metrics.difficulty && (
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium">Difficulty</p>
                <p className="text-sm font-semibold">{idea.metrics.difficulty}</p>
              </div>
            )}
            {idea.metrics.timeToCreate && (
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium">Time to Create</p>
                <p className="text-sm font-semibold">{idea.metrics.timeToCreate}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {showSave && onSave && (
        <CardFooter className="pt-0">
          <Button
            onClick={onSave}
            className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white transition-all hover:scale-105"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Idea
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
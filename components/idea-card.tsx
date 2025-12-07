import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentIdea, IdeaStatus } from "@/lib/types/ideas"
import { BookMarked, Calendar, Edit2, FileText, MoreHorizontal, Play, Save, Trash2, Eye, Activity, Clock, Gauge } from "lucide-react"
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
  saved: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  archived: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
        "group relative transition-all duration-300 hover:shadow-lg border-border/50 bg-background/60 backdrop-blur-sm",
        status === 'saved' && "hover:border-primary/30 hover:bg-background/80",
        className
      )}>
        <div className="flex flex-col md:flex-row md:items-start gap-4 p-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("px-2 py-0.5 capitalize", statusColors[status])}>
                    <StatusIcon className="mr-1.5 h-3 w-3" />
                    {formatStatus(status)}
                  </Badge>
                  {idea.created_at && (
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                    </span>
                  )}
                  <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
                    {idea.type.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">{idea.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{idea.description}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    title="Edit idea"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onStatusChange && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange('saved')}>Mark as Saved</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange('in_progress')}>Mark In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange('completed')}>Mark Completed</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange('archived')}>Archive</DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                          Delete Idea
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {idea.metrics && Object.keys(idea.metrics).length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                {idea.metrics.estimatedViews && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-medium">{idea.metrics.estimatedViews}</span>
                  </div>
                )}
                {idea.metrics.engagement && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="font-medium">{idea.metrics.engagement}</span>
                  </div>
                )}
                {idea.metrics.difficulty && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                    <Gauge className="h-3.5 w-3.5" />
                    <span className="font-medium">{idea.metrics.difficulty}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {showSave && onSave && (
            <Button
              onClick={onSave}
              size="sm"
              className="md:self-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Idea
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Grid view layout
  return (
    <Card className={cn(
      "group relative flex flex-col transition-all duration-300 hover:shadow-lg border-border/50 bg-background/60 backdrop-blur-sm",
      status === 'saved' && "hover:border-primary/30 hover:bg-background/80",
      className
    )}>
      <CardHeader className="p-5 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={cn("px-2 py-0.5 capitalize", statusColors[status])}>
            <StatusIcon className="mr-1.5 h-3 w-3" />
            {formatStatus(status)}
          </Badge>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onStatusChange && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange('saved')}>Mark as Saved</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange('in_progress')}>Mark In Progress</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange('completed')}>Mark Completed</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onStatusChange('archived')}>Archive</DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                      Delete Idea
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2">
          <CardTitle className="leading-snug group-hover:text-primary transition-colors text-base line-clamp-2 min-h-[3rem]">
            {idea.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="bg-muted px-1.5 py-0.5 rounded capitalize">{idea.type.replace('_', ' ')}</span>
            {idea.created_at && (
              <span>• {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
          {idea.description}
        </p>

        {idea.metrics && Object.keys(idea.metrics).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            {idea.metrics.estimatedViews && (
              <div className="flex flex-col px-2 py-1.5 rounded bg-muted/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Est. Views</span>
                <span className="text-xs font-medium truncate" title={idea.metrics.estimatedViews}>{idea.metrics.estimatedViews}</span>
              </div>
            )}
            {idea.metrics.engagement && (
              <div className="flex flex-col px-2 py-1.5 rounded bg-muted/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Engagement</span>
                <span className="text-xs font-medium truncate" title={idea.metrics.engagement}>{idea.metrics.engagement}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showSave && onSave && (
        <CardFooter className="p-5 pt-0">
          <Button
            onClick={onSave}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Idea
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
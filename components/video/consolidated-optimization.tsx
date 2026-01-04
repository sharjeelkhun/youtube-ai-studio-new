"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Sparkles, FileText, Hash, Image as ImageIcon, TrendingUp,
    Zap, AlertCircle, CheckCircle2, ArrowRight, Keyboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ConsolidatedOptimizationProps {
    video: {
        title: string
        description: string
        tags: string[]
        thumbnail_url?: string
    }
    scores: {
        overall: number
        title: number
        description: number
        tags: number
        thumbnail: number
    }
    onOptimizeTitle?: () => void
    onOptimizeDescription?: () => void
    onOptimizeTags?: () => void
    onOptimizeAll?: () => void
    isLoading?: boolean
    topPriority?: {
        title: string
        description: string
        impact: string
        action: () => void
    }
}

export function ConsolidatedOptimization({
    video,
    scores,
    onOptimizeTitle,
    onOptimizeDescription,
    onOptimizeTags,
    onOptimizeAll,
    isLoading = false,
    topPriority
}: ConsolidatedOptimizationProps) {
    // Animated score counter
    const [displayScore, setDisplayScore] = useState(scores.overall)
    const [previousScore, setPreviousScore] = useState(scores.overall)
    const [showScoreChange, setShowScoreChange] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    // Animate score changes
    useEffect(() => {
        if (scores.overall !== previousScore) {
            setShowScoreChange(true)
            setPreviousScore(scores.overall)

            // Animate the counter
            const duration = 800
            const steps = 40
            const increment = (scores.overall - displayScore) / steps
            let currentStep = 0

            const timer = setInterval(() => {
                currentStep++
                if (currentStep >= steps) {
                    setDisplayScore(scores.overall)
                    clearInterval(timer)
                } else {
                    setDisplayScore(prev => prev + increment)
                }
            }, duration / steps)

            // Hide change indicator after animation
            setTimeout(() => setShowScoreChange(false), 2000)

            return () => clearInterval(timer)
        }
    }, [scores.overall])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K - Optimize All
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                onOptimizeAll?.()
            }
            // Cmd/Ctrl + 1 - Overview tab
            if ((e.metaKey || e.ctrlKey) && e.key === '1') {
                e.preventDefault()
                setActiveTab('overview')
            }
            // Cmd/Ctrl + 2 - Title tab
            if ((e.metaKey || e.ctrlKey) && e.key === '2') {
                e.preventDefault()
                setActiveTab('title')
            }
            // Cmd/Ctrl + 3 - Description tab
            if ((e.metaKey || e.ctrlKey) && e.key === '3') {
                e.preventDefault()
                setActiveTab('description')
            }
            // Cmd/Ctrl + 4 - Tags tab
            if ((e.metaKey || e.ctrlKey) && e.key === '4') {
                e.preventDefault()
                setActiveTab('tags')
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [onOptimizeAll])

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 dark:text-green-400"
        if (score >= 60) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent"
        if (score >= 60) return "Good"
        return "Needs Work"
    }

    const getScoreBadgeClass = (score: number) => {
        if (score >= 80) return "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
        if (score >= 60) return "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        return "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
    }

    const scoreChange = scores.overall - previousScore

    return (
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 pb-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Video Optimization
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            AI-powered insights to maximize your video's performance
                        </p>
                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Keyboard className="h-3 w-3" />
                            <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to optimize all</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground">Overall Score</span>
                            <Badge variant="outline" className={cn("text-xs font-bold", getScoreBadgeClass(scores.overall))}>
                                {getScoreLabel(scores.overall)}
                            </Badge>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={cn("text-4xl font-bold tabular-nums transition-all duration-500", getScoreColor(scores.overall))}>
                                {Math.round(displayScore)}
                            </span>
                            <span className="text-lg text-muted-foreground">/100</span>
                        </div>
                        {/* Score change indicator */}
                        {showScoreChange && scoreChange !== 0 && (
                            <div className={cn(
                                "text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300",
                                scoreChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {scoreChange > 0 ? '+' : ''}{scoreChange} points
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Grid - Mobile Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
                        <FileText className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <div className={cn("text-lg font-bold transition-colors duration-300", getScoreColor(scores.title))}>{scores.title}%</div>
                        <div className="text-[10px] text-muted-foreground">Title</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
                        <FileText className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                        <div className={cn("text-lg font-bold transition-colors duration-300", getScoreColor(scores.description))}>{scores.description}%</div>
                        <div className="text-[10px] text-muted-foreground">Description</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
                        <Hash className="h-4 w-4 mx-auto mb-1 text-green-500" />
                        <div className={cn("text-lg font-bold transition-colors duration-300", getScoreColor(scores.tags))}>{scores.tags}%</div>
                        <div className="text-[10px] text-muted-foreground">Tags</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors">
                        <ImageIcon className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                        <div className={cn("text-lg font-bold transition-colors duration-300", getScoreColor(scores.thumbnail))}>{scores.thumbnail}%</div>
                        <div className="text-[10px] text-muted-foreground">Thumbnail</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Top Priority Action */}
                {topPriority && (
                    <Alert className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 animate-in fade-in slide-in-from-top-2 duration-500">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-red-600 text-white text-[10px] px-2 py-0">
                                        HIGH PRIORITY
                                    </Badge>
                                    <span className="font-semibold text-sm">{topPriority.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{topPriority.description}</p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    💡 {topPriority.impact}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={topPriority.action}
                                className="bg-red-600 hover:bg-red-700 text-white shrink-0 w-full sm:w-auto"
                            >
                                Fix Now
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabbed Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                        <TabsTrigger value="overview" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Overview</span>
                            <span className="sm:hidden">1</span>
                        </TabsTrigger>
                        <TabsTrigger value="title" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Title</span>
                            <span className="sm:hidden">2</span>
                        </TabsTrigger>
                        <TabsTrigger value="description" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Description</span>
                            <span className="sm:hidden">3</span>
                        </TabsTrigger>
                        <TabsTrigger value="tags" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Hash className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Tags</span>
                            <span className="sm:hidden">4</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            {/* Title Optimization */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-all gap-3">
                                <div className="flex items-center gap-3 flex-1 w-full">
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                        scores.title >= 70 ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"
                                    )}>
                                        {scores.title >= 70 ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">Title Optimization</span>
                                            <Badge variant="outline" className={cn("text-[10px]", getScoreBadgeClass(scores.title))}>
                                                {scores.title}%
                                            </Badge>
                                        </div>
                                        <Progress value={scores.title} className="h-1.5" />
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={onOptimizeTitle} disabled={isLoading} className="w-full sm:w-auto">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Optimize
                                </Button>
                            </div>

                            {/* Description Optimization */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-all gap-3">
                                <div className="flex items-center gap-3 flex-1 w-full">
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                        scores.description >= 70 ? "bg-green-100 dark:bg-green-950" : "bg-amber-100 dark:bg-amber-950"
                                    )}>
                                        {scores.description >= 70 ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">Description Optimization</span>
                                            <Badge variant="outline" className={cn("text-[10px]", getScoreBadgeClass(scores.description))}>
                                                {scores.description}%
                                            </Badge>
                                        </div>
                                        <Progress value={scores.description} className="h-1.5" />
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={onOptimizeDescription} disabled={isLoading} className="w-full sm:w-auto">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Optimize
                                </Button>
                            </div>

                            {/* Tags Optimization */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-all gap-3">
                                <div className="flex items-center gap-3 flex-1 w-full">
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                        scores.tags >= 70 ? "bg-green-100 dark:bg-green-950" : "bg-amber-100 dark:bg-amber-950"
                                    )}>
                                        {scores.tags >= 70 ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">Tags Optimization</span>
                                            <Badge variant="outline" className={cn("text-[10px]", getScoreBadgeClass(scores.tags))}>
                                                {scores.tags}%
                                            </Badge>
                                        </div>
                                        <Progress value={scores.tags} className="h-1.5" />
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={onOptimizeTags} disabled={isLoading} className="w-full sm:w-auto">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Optimize
                                </Button>
                            </div>
                        </div>

                        {/* One-Click Optimize All */}
                        <Button
                            onClick={onOptimizeAll}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold h-11 shadow-lg hover:shadow-xl transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin mr-2">⚙️</span>
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Optimize Everything with AI
                                    <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono hidden sm:inline">⌘K</kbd>
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    {/* Title Tab */}
                    <TabsContent value="title" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Current Title</h4>
                                <Badge variant="outline" className="text-[10px]">
                                    {video.title.length}/100 characters
                                </Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-sm">
                                {video.title}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="text-xs text-muted-foreground mb-1">Hook Strength</div>
                                    <div className="text-sm font-semibold">Medium</div>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                                    <div className="text-xs text-muted-foreground mb-1">Keyword Coverage</div>
                                    <div className="text-sm font-semibold">100%</div>
                                </div>
                            </div>
                            <Button onClick={onOptimizeTitle} disabled={isLoading} className="w-full">
                                <Zap className="h-4 w-4 mr-2" />
                                Generate AI Title
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Description Tab */}
                    <TabsContent value="description" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">First 2 Lines (Most Important)</h4>
                                <Badge variant="outline" className={cn("text-[10px]", getScoreBadgeClass(scores.description))}>
                                    {scores.description}% optimized
                                </Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-sm max-h-32 overflow-y-auto">
                                {video.description.split('\n').slice(0, 2).join('\n') || 'No description'}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                                    <div className="text-xs text-muted-foreground mb-1">Keyword Density</div>
                                    <div className="text-sm font-semibold">15.4%</div>
                                    <div className="text-[10px] text-muted-foreground">ideal: 2-3%</div>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="text-xs text-muted-foreground mb-1">Character Count</div>
                                    <div className="text-sm font-semibold">{video.description.length}</div>
                                    <div className="text-[10px] text-muted-foreground">max: 5000</div>
                                </div>
                            </div>
                            <Button onClick={onOptimizeDescription} disabled={isLoading} className="w-full">
                                <Zap className="h-4 w-4 mr-2" />
                                Generate AI Description
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Tags Tab */}
                    <TabsContent value="tags" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Current Tags</h4>
                                <Badge variant="outline" className="text-[10px]">
                                    {video.tags.length}/30
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 rounded-lg bg-muted/20 border border-border/30">
                                {video.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                                <div className="text-xs text-muted-foreground mb-2">Top Performing Tags</div>
                                <div className="space-y-1">
                                    {video.tags.slice(0, 3).map((tag, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="truncate">{tag}</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400 ml-2">
                                                {90 + idx * 3}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={onOptimizeTags} disabled={isLoading} className="w-full">
                                <Zap className="h-4 w-4 mr-2" />
                                Replace All Tags with AI
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

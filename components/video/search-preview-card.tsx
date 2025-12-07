"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Search } from "lucide-react"
import Image from "next/image"

interface SearchPreviewCardProps {
    title: string
    description: string
    thumbnailUrl: string
    channelName: string
    publishedAt: string
}

export function SearchPreviewCard({ title, description, thumbnailUrl, channelName, publishedAt }: SearchPreviewCardProps) {
    // Mock data for preview
    const views = "1.2K views"
    const timeAgo = "2 days ago"

    return (
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Search Result Preview
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* YouTube Search Result Mockup */}
                <div className="flex flex-col sm:flex-row gap-4 group cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full sm:w-[360px] shrink-0 rounded-xl overflow-hidden bg-muted">
                        <Image
                            src={thumbnailUrl || '/placeholder.svg'}
                            alt={title || "Video thumbnail"}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-medium px-1 rounded">
                            10:23
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-1 min-w-0">
                        <h3 className="text-lg font-normal leading-tight line-clamp-2 text-foreground break-words">
                            {title || "Untitled Video"}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>{views}</span>
                            <span className="mx-1">•</span>
                            <span>{timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-2 py-2">
                            <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                                {channelName?.[0]?.toUpperCase() || "C"}
                            </div>
                            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                {channelName || "Channel Name"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {description || "No description available."}
                        </p>
                        {/* Badges often seen in search */}
                        <div className="mt-1 flex gap-1">
                            <span className="bg-muted text-[10px] text-muted-foreground px-1 rounded">New</span>
                            <span className="bg-muted text-[10px] text-muted-foreground px-1 rounded">4K</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                        This is how your video might appear in YouTube search results.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

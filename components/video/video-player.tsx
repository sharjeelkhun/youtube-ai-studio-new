"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
    videoId: string
    title: string
    thumbnailUrl?: string
}

export function VideoPlayer({ videoId, title, thumbnailUrl }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)

    return (
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg overflow-hidden">
            <CardContent className="p-0">
                <div className="relative aspect-video bg-black group">
                    {!isPlaying && thumbnailUrl ? (
                        <>
                            <img
                                src={thumbnailUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                <Button
                                    size="lg"
                                    onClick={() => setIsPlaying(true)}
                                    className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700 shadow-2xl hover:scale-110 transition-transform"
                                >
                                    <Play className="h-8 w-8 ml-1" fill="white" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
                            title={title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}

                    {/* Video Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between text-white text-sm">
                            <span className="font-medium truncate">{title}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-white/20"
                                    onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                                >
                                    <Maximize className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Youtube, Sparkles, BarChart, Zap, ShieldCheck } from "lucide-react"
import { ConnectYouTubeButton } from "@/components/connect-youtube-button"

export function ConnectChannelHero() {
    const features = [
        {
            icon: BarChart,
            title: "Analytics",
            description: "Deep insights"
        },
        {
            icon: Sparkles,
            title: "Ideas",
            description: "AI generation"
        },
        {
            icon: Zap,
            title: "SEO",
            description: "Auto-optimize"
        }
    ]

    return (
        <div className="relative w-full max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[60vh]">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="relative w-full border-white/10 bg-background/60 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none">
                    <Youtube className="w-96 h-96 -rotate-12 transform translate-x-32 -translate-y-32" />
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />

                <CardHeader className="flex flex-col items-center text-center space-y-6 pt-12 pb-6 relative z-10 w-full">
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-md shadow-sm">
                        <Youtube className="w-3.5 h-3.5 mr-2" />
                        Official Integration
                    </Badge>

                    <div className="space-y-4 max-w-2xl px-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
                            Supercharge your <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-600">
                                YouTube Channel
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
                            Unlock AI-powered analytics, growth tools, and automated SEO.
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center pb-8 relative z-10 w-full flex-1 justify-between gap-12">
                    {/* Action Area - Centered */}
                    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
                        <div className="transform hover:scale-105 transition-transform duration-300 w-full flex justify-center">
                            <ConnectYouTubeButton className="w-full justify-center" />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 bg-background/50 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            <span>Read-only access • Secure & Private</span>
                        </div>
                    </div>

                    {/* Feature Grid - Improved for Mobile */}
                    <div className="w-full max-w-3xl border-t border-border/40 pt-8 px-4 mt-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {features.map((feature, i) => (
                                <div key={i} className="flex flex-row sm:flex-col items-center sm:text-center p-4 rounded-2xl bg-muted/20 border border-white/5 hover:bg-muted/40 transition-colors group">
                                    <div className="mr-4 sm:mr-0 sm:mb-3 p-2.5 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left sm:text-center">
                                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{feature.title}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

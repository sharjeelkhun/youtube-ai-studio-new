'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Check, Zap, Settings, Cpu, X, Box, Sparkles } from 'lucide-react'
import { aiProviders } from '@/lib/ai-providers'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AIProviderSwitcher() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [currentProvider, setCurrentProvider] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadCurrentProvider()

        const handleProviderChange = (event: CustomEvent) => {
            if (event.detail?.provider) {
                setCurrentProvider(event.detail.provider)
            }
        }

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'ai_provider_changed') {
                loadCurrentProvider()
            }
        }

        window.addEventListener('ai-provider-changed' as any, handleProviderChange)
        window.addEventListener('storage', handleStorageChange)

        const pollInterval = setInterval(() => {
            loadCurrentProvider()
        }, 2000)

        return () => {
            window.removeEventListener('ai-provider-changed' as any, handleProviderChange)
            window.removeEventListener('storage', handleStorageChange)
            clearInterval(pollInterval)
        }
    }, [])

    const loadCurrentProvider = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('ai_provider')
                .eq('id', user.id)
                .maybeSingle()

            if (profile && (profile as any).ai_provider !== currentProvider) {
                setCurrentProvider((profile as any).ai_provider)
            }
        } catch (error) {
            console.error('Error loading provider:', error)
        }
    }

    const switchProvider = async (providerId: string) => {
        if (providerId === currentProvider) {
            setIsOpen(false)
            return
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await (supabase
                .from('profiles') as any)
                .update({ ai_provider: providerId })
                .eq('id', user.id)

            if (!error) {
                setCurrentProvider(providerId)
                window.dispatchEvent(new CustomEvent('ai-provider-changed', {
                    detail: { provider: providerId }
                }))
                localStorage.setItem('ai_provider_changed', Date.now().toString())
                setIsOpen(false)
            }
        } catch (error) {
            console.error('Error switching provider:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const currentProviderData = aiProviders.find(p => p.id === currentProvider)

    return (
        <div className="relative">
            <Drawer
                open={isOpen}
                onOpenChange={setIsOpen}
                dismissible={false}
            >
                <DrawerTrigger asChild>
                    <div className="relative group cursor-pointer" role="button" aria-label="Clone AI Provider">
                        {/* Tooltip */}
                        <div className="hidden md:block absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            AI Engine: {currentProviderData?.name || "Select"}
                        </div>

                        <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-full bg-background/50 hover:bg-accent border border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden">
                            {currentProviderData?.logo ? (
                                <div className="w-5 h-5 text-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                    <currentProviderData.logo />
                                </div>
                            ) : (
                                <Zap className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                            {/* Status Dot */}
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        </Button>
                    </div>
                </DrawerTrigger>

                {/* 
                    Wider Drawer Content: max-w-2xl
                    Reverted to solid bg-background for clean "Apple" look
                */}
                <DrawerContent className="max-w-2xl mx-auto inset-x-0 rounded-t-[32px] max-h-[92vh] border-t border-x border-border/40 shadow-2xl bg-background text-foreground">
                    <div className="w-full relative">
                        {/* Close Button - Manual implementation for reliability */}
                        <div className="absolute right-6 top-6 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted border border-border/50 shadow-sm transition-all hover:rotate-90 duration-300 group"
                            >
                                <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" strokeWidth={2.5} />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>

                        <div className="flex flex-col h-full max-h-[92vh]">
                            <DrawerHeader className="text-center sm:text-center pt-10 pb-6 shrink-0 flex flex-col items-center">
                                <div className="mx-auto w-14 h-14 rounded-[20px] bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent flex items-center justify-center mb-4 shadow-sm ring-1 ring-primary/20">
                                    <Cpu className="w-7 h-7 text-primary" strokeWidth={1.5} />
                                </div>
                                <DrawerTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                    AI Engine
                                </DrawerTitle>
                                <DrawerDescription className="text-muted-foreground text-base max-w-none mx-auto mt-2 leading-relaxed">
                                    Power your studio with the world's most advanced AI models.
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="px-6 sm:px-10 overflow-y-auto min-h-0 flex-1 space-y-8 pb-10">
                                {/* Current Active Provider Card */}
                                {currentProviderData && (
                                    <div className="relative group overflow-hidden rounded-[28px] p-[1px] bg-gradient-to-br from-primary/30 via-primary/5 to-transparent shadow-lg shadow-primary/5">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 bg-card/80 backdrop-blur-xl rounded-[27px] h-full">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-40 animate-pulse" />
                                                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-background to-muted/20 shadow-xl flex items-center justify-center ring-1 ring-border/10">
                                                    <currentProviderData.logo />
                                                </div>
                                            </div>
                                            <div className="flex-1 text-center sm:text-left space-y-2">
                                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                                    <h3 className="text-2xl font-bold tracking-tight">{currentProviderData.name}</h3>
                                                    <Badge className="bg-primary text-primary-foreground hover:bg-primary shadow-lg shadow-primary/25 border-0 rounded-full px-3 py-0.5 text-xs font-bold tracking-wide uppercase">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground font-medium text-base">
                                                    {currentProviderData.description}
                                                </p>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">Operational</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Provider Grid */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-px bg-border flex-1" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                            <Box className="w-3 h-3" /> Available Providers
                                        </span>
                                        <div className="h-px bg-border flex-1" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {aiProviders.map((provider) => {
                                            const isActive = provider.id === currentProvider
                                            const Logo = provider.logo

                                            return (
                                                <button
                                                    type="button"
                                                    key={provider.id}
                                                    onClick={() => !isActive && switchProvider(provider.id)}
                                                    disabled={isLoading}
                                                    className={`group relative flex items-start gap-4 p-5 rounded-[24px] border text-left transition-all duration-300 h-full
                                                        ${isActive
                                                            ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20'
                                                            : 'bg-card/40 hover:bg-accent/50 border-border/60 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1'
                                                        }
                                                    `}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0Shadow-sm ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm border border-border/50 group-hover:scale-110'}`}>
                                                        <div className={`w-6 h-6 ${isActive ? 'text-white' : 'text-foreground'}`}>
                                                            <Logo />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className={`font-bold text-base ${isActive ? 'text-primary' : 'text-foreground'}`}>{provider.name}</h3>
                                                            {isActive && (
                                                                <div className="bg-primary rounded-full p-1 shadow-md shadow-primary/30">
                                                                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                                                            {provider.description}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            {provider.billing.tier === 'free' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                    Free API
                                                                </span>
                                                            )}
                                                            {provider.billing.tier === 'free-trial' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                    Free Trial
                                                                </span>
                                                            )}
                                                            {provider.billing.tier === 'pay-as-you-go' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                                    Paid API
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 px-10 pt-2 pb-8 border-t border-border/30 bg-muted/10">
                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all text-sm font-medium hover:bg-primary/5 gap-2"
                                    onClick={() => {
                                        setIsOpen(false)
                                        router.push('/settings?tab=ai')
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50 shadow-sm">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    Configure Advanced API Keys & Settings
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

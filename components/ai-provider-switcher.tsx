'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, ChevronRight, Zap, X } from 'lucide-react'
import { aiProviders } from '@/lib/ai-providers'

export function AIProviderSwitcher() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentProvider, setCurrentProvider] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClientComponentClient()

    useEffect(() => {
        loadCurrentProvider()

        // Listen for provider changes from settings page or other tabs
        const handleProviderChange = (event: CustomEvent) => {
            if (event.detail?.provider) {
                setCurrentProvider(event.detail.provider)
            }
        }

        // Listen for storage changes (cross-tab sync)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'ai_provider_changed') {
                loadCurrentProvider()
            }
        }

        // Listen for custom event (same-tab sync)
        window.addEventListener('ai-provider-changed' as any, handleProviderChange)
        window.addEventListener('storage', handleStorageChange)

        // Poll for changes every 2 seconds as fallback
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
                .single()

            if (profile && profile.ai_provider !== currentProvider) {
                setCurrentProvider(profile.ai_provider)
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

            const { error } = await supabase
                .from('profiles')
                .update({ ai_provider: providerId })
                .eq('id', user.id)

            if (!error) {
                setCurrentProvider(providerId)

                // Dispatch custom event for same-tab sync
                window.dispatchEvent(new CustomEvent('ai-provider-changed', {
                    detail: { provider: providerId }
                }))

                // Set storage flag for cross-tab sync
                localStorage.setItem('ai_provider_changed', Date.now().toString())

                setIsOpen(false)

                // Note: Page will need refresh for full effect, but UI updates immediately
            }
        } catch (error) {
            console.error('Error switching provider:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const currentProviderData = aiProviders.find(p => p.id === currentProvider)

    return (
        <>
            {/* Edge Tab Trigger - Slides out from right edge */}
            <motion.div
                className="fixed top-1/2 right-0 -translate-y-1/2 z-50"
                initial={{ x: '100%' }}
                animate={{ x: isOpen ? '100%' : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <motion.button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center gap-2 bg-gradient-to-l from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-l-2xl pr-4 pl-3 py-4"
                    whileHover={{ x: -8 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-l from-red-400/50 to-red-500/50 rounded-l-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative flex items-center gap-2">
                        {/* Vertical Text */}
                        <div className="flex flex-col items-center gap-1">
                            <Zap className="w-5 h-5" />
                            <div className="writing-mode-vertical text-sm font-bold tracking-wider whitespace-nowrap">
                                AI ENGINE
                            </div>
                        </div>

                        {/* Arrow Indicator */}
                        <motion.div
                            animate={{ x: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </motion.div>
                    </div>
                </motion.button>
            </motion.div>

            {/* Premium Slide-out Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop with blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />

                        {/* Slide-out Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="relative px-8 py-6 border-b border-gray-200 dark:border-gray-800">
                                {/* Subtle gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-transparent" />

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-xl blur-lg opacity-50" />
                                            <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                AI Provider
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Choose your AI engine
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Current Provider Badge */}
                            {currentProviderData && (
                                <div className="px-8 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-b border-red-100 dark:border-red-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center">
                                            {currentProviderData.logo()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                                                Currently Active
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {currentProviderData.name}
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Provider Grid */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        Available Providers
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {aiProviders.map((provider) => {
                                        const isActive = provider.id === currentProvider
                                        const Logo = provider.logo

                                        return (
                                            <motion.button
                                                key={provider.id}
                                                onClick={() => switchProvider(provider.id)}
                                                disabled={isLoading || isActive}
                                                className={`group relative w-full overflow-hidden rounded-2xl transition-all duration-300 ${isActive
                                                    ? 'bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10 border-2 border-red-500/30 cursor-default'
                                                    : 'bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md cursor-pointer'
                                                    }`}
                                                whileHover={!isActive ? { scale: 1.02, y: -2 } : {}}
                                                whileTap={!isActive ? { scale: 0.98 } : {}}
                                            >
                                                <div className="relative flex items-center gap-4 p-5">
                                                    {/* Logo Container */}
                                                    <div className={`relative flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'
                                                        }`}>
                                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                                                            ? 'bg-white dark:bg-gray-800 shadow-lg ring-2 ring-red-500/20'
                                                            : 'bg-white dark:bg-gray-800 group-hover:shadow-md'
                                                            }`}>
                                                            <Logo />
                                                        </div>
                                                    </div>

                                                    {/* Provider Info */}
                                                    <div className="flex-1 text-left">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className={`font-bold text-base transition-colors ${isActive
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400'
                                                                }`}>
                                                                {provider.name}
                                                            </h3>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                                                            {provider.description}
                                                        </p>
                                                    </div>

                                                    {/* Action Indicator */}
                                                    {!isActive && (
                                                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                                <ChevronRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Loading Spinner */}
                                                    {isLoading && isActive && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        window.location.href = '/settings?tab=ai'
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <Sparkles className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                        Advanced AI Settings
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CSS for vertical text */}
            <style jsx global>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
        </>
    )
}
